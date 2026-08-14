// Game-flow internals of the v2 engine (Core Rules July 2026).
// The action switch lives in reducer.ts; everything here mutates the cloned
// state passed to it and stays deterministic.
import type { Domain } from '../data/cards'
import { def, keywords, unitsAt } from './cardinfo'
import { autoAssignment, greedyAssignment, validateAssignment } from './combat'
import { combatMightQ, might } from './queries'
import { shuffle } from './rng'
import { scriptFor } from '../effects/registry'
import type { Ability, Op, Trigger } from '../effects/ir'
import { runVm, startProgram, type ExecState } from '../effects/vm'
import { evalCond, type EffectCtx } from '../effects/selectors'
import type { ChainItem, GameState, GrantedEffect, LocationRef, PlayerIx, UnitEntity } from './types'
import { CHANNEL_PER_TURN, VICTORY_SCORE } from './types'

export class IllegalAction extends Error {}

export const other = (p: PlayerIx): PlayerIx => (p === 0 ? 1 : 0)

export function log(s: GameState, text: string, player: PlayerIx | null = null) {
  s.log.push({ turn: s.turn, player, text })
}

export function pname(s: GameState, p: PlayerIx) {
  return s.players[p].name
}

export function bfName(s: GameState, ix: number) {
  return def(s.battlefields[ix].cardId).name
}

// ---------------------------------------------------------------- drawing

export function burnOut(s: GameState, p: PlayerIx) {
  const pl = s.players[p]
  const opp = other(p)
  if (pl.trash.length > 0) {
    pl.deck.push(...pl.trash.splice(0))
    shuffle(s.rng, pl.deck)
  }
  s.players[opp].points += 1
  log(s, `Burn Out ! ${pname(s, p)} n'a plus de deck : ${pname(s, opp)} gagne 1 point.`, p)
  checkWin(s)
}

export function draw(s: GameState, p: PlayerIx, n: number) {
  const pl = s.players[p]
  for (let i = 0; i < n; i++) {
    if (s.winner !== null) return
    if (pl.deck.length === 0) {
      burnOut(s, p)
      if (pl.deck.length === 0) continue // deck and trash both empty
    }
    pl.hand.push(pl.deck.shift()!)
  }
}

export function checkWin(s: GameState) {
  if (s.winner !== null) return
  for (const p of [0, 1] as PlayerIx[]) {
    if (s.players[p].points >= VICTORY_SCORE) {
      s.winner = p
      s.phase = 'over'
      s.pending = null
      log(s, `🏆 ${pname(s, p)} atteint ${VICTORY_SCORE} points et gagne la partie !`)
      return
    }
  }
}

// ---------------------------------------------------------------- scoring

export function score(s: GameState, p: PlayerIx, bfIx: number, method: 'hold' | 'conquer') {
  const bf = s.battlefields[bfIx]
  if (bf.scoredBy[p]) return
  bf.scoredBy[p] = true
  const pl = s.players[p]
  // Final point restriction: at Victory-1, a Conquer only scores if every
  // battlefield was scored by this player this turn; otherwise draw a card.
  if (pl.points === VICTORY_SCORE - 1 && method === 'conquer') {
    const scoredAll = s.battlefields.every((b) => b.scoredBy[p])
    if (!scoredAll) {
      draw(s, p, 1)
      log(
        s,
        `${pname(s, p)} conquiert ${bfName(s, bfIx)} à 7 points sans avoir marqué chaque champ de bataille : pioche 1 carte au lieu du point final.`,
        p
      )
      return
    }
  }
  pl.points += 1
  log(
    s,
    `${pname(s, p)} marque 1 point (${method === 'hold' ? 'Tenue' : 'Conquête'} de ${bfName(s, bfIx)}) → ${pl.points} pts.`,
    p
  )
  // Battlefield conquer/hold abilities + "when you conquer/hold" unit triggers.
  const scripted = queueTriggersFor(s, bf.cardId, p, method === 'hold' ? 'holdHere' : 'conquerHere', {
    sourceUid: null,
    sourceBattlefield: bfIx,
  })
  for (const u of [...s.units]) {
    if (u.controller === p) queueTriggersFor(s, u.cardId, p, method === 'hold' ? 'hold' : 'conquer', { sourceUid: u.uid })
  }
  // Hunt (823): units with Hunt present at the scored battlefield grant XP.
  for (const u of s.units) {
    if (u.controller === p && u.location === bfIx && u.kind === 'unit') {
      const huntVal = keywords(u.cardId).hunt
      if (huntVal > 0) {
        s.players[p].xp = (s.players[p].xp ?? 0) + huntVal
        log(s, `${pname(s, p)} gagne ${huntVal} XP (Hunt de ${def(u.cardId).name}) → ${s.players[p].xp}.`, p)
      }
    }
  }
  // Legend conquer/hold triggers know which battlefield was scored.
  queueTriggersFor(s, s.players[p].legendId, p, method === 'hold' ? 'hold' : 'conquer', {
    sourceUid: null,
    sourceBattlefield: bfIx,
  })
  // Trash-zone conquer triggers (Super Mega Death Rocket!).
  if (method === 'conquer') {
    const seen = new Set<string>()
    for (const cardId of [...s.players[p].trash]) {
      if (seen.has(cardId)) continue
      seen.add(cardId)
      const sc = scriptFor(cardId)
      const hasTrashTrigger = (sc?.abilities ?? []).some(
        (ab) => ab.kind === 'triggered' && ab.when.on === 'conquer' && ab.zone === 'trash'
      )
      if (hasTrashTrigger) queueTriggersFor(s, cardId, p, 'conquer', { sourceUid: null })
    }
  }
  const text = def(bf.cardId).text
  const bfManual = scriptFor(bf.cardId)?.manual === true
  if (text && (!scripted || bfManual)) log(s, `Capacité de ${bfName(s, bfIx)} : « ${text} » (appliquer manuellement si besoin).`, p)
  checkWin(s)
}

/** Establish Control (466.5 / 348.2.a): conquer if not already scored. */
export function establishControl(s: GameState, bfIx: number, p: PlayerIx) {
  const bf = s.battlefields[bfIx]
  bf.contestedBy = null
  if (bf.controller === p) return
  bf.controller = p
  log(s, `${pname(s, p)} prend le contrôle de ${bfName(s, bfIx)}.`, p)
  score(s, p, bfIx, 'conquer')
}

// ---------------------------------------------------------------- units

export function killUnit(s: GameState, uid: number, cause: string) {
  const ix = s.units.findIndex((u) => u.uid === uid)
  if (ix < 0) return
  const u = s.units[ix]
  // Simple replacement watcher: "the next time it would die this turn, heal it instead."
  const wi = (s.watchers ?? []).findIndex((w) => w.uid === uid && w.kind === 'preventDeathHeal')
  if (wi >= 0) {
    s.watchers!.splice(wi, 1)
    u.damage = 0
    u.ready = false
    u.location = 'base'
    u.combatRole = null
    log(s, `${def(u.cardId).name} aurait dû mourir : soignée, engagée et rappelée à la place.`)
    return
  }
  s.units.splice(ix, 1)
  const card = def(u.cardId)
  const owner = u.owner ?? u.controller
  if (u.isToken) {
    log(s, `Le jeton ${card.name} de ${pname(s, owner)} est détruit (${cause}) et cesse d'exister.`, owner)
    return
  }
  if (scriptFor(u.cardId)?.banishOnDeath) {
    s.players[owner].banishment.push(u.cardId)
    log(s, `${card.name} de ${pname(s, owner)} est détruit (${cause}) et banni.`, owner)
    s.diedThisTurn = s.diedThisTurn ?? [0, 0]
    s.diedThisTurn[u.controller] += 1
    for (const w of [...s.units]) {
      queueTriggersFor(s, w.cardId, w.controller, 'unitDies', { sourceUid: w.uid, eventUid: u.uid })
    }
    return
  }
  s.players[owner].trash.push(u.cardId)
  s.diedThisTurn = s.diedThisTurn ?? [0, 0]
  s.diedThisTurn[u.controller] += 1
  log(s, `${card.name} de ${pname(s, owner)} est détruit (${cause}).`, owner)
  // Deathknell (808): the trigger chains, noting the dead unit's identity.
  const queued = queueTriggersFor(s, u.cardId, owner, 'deathknell', { sourceUid: null, eventUid: u.uid })
  if (!queued && keywords(u.cardId).deathknell) {
    log(
      s,
      `⚠️ Deathknell de ${card.name} : « ${card.text} » — à résoudre manuellement (outils manuels).`,
      owner
    )
  }
  // "When another unit dies" watchers on the board.
  for (const w of [...s.units]) {
    queueTriggersFor(s, w.cardId, w.controller, 'unitDies', { sourceUid: w.uid, eventUid: u.uid })
  }
}

export function banishUnit(s: GameState, uid: number) {
  const ix = s.units.findIndex((u) => u.uid === uid)
  if (ix < 0) return
  const u = s.units[ix]
  s.units.splice(ix, 1)
  if (u.isToken) {
    log(s, `Le jeton ${def(u.cardId).name} cesse d'exister.`, u.controller)
    return
  }
  s.players[u.owner ?? u.controller].banishment.push(u.cardId)
  log(s, `${def(u.cardId).name} de ${pname(s, u.owner ?? u.controller)} est banni.`, u.controller)
}

// ---------------------------------------------------------------- scripted triggers

/** Triggered abilities of a card matching an event kind. */
function matchingAbilities(cardId: string, on: Trigger['on']): { ix: number; ability: Extract<Ability, { kind: 'triggered' }> }[] {
  const script = scriptFor(cardId)
  if (!script?.abilities) return []
  const out: { ix: number; ability: Extract<Ability, { kind: 'triggered' }> }[] = []
  script.abilities.forEach((ab, ix) => {
    if (ab.kind === 'triggered' && ab.when.on === on) out.push({ ix, ability: ab })
  })
  return out
}

/**
 * Queue every scripted trigger of `cardId` matching the event onto the chain.
 * Returns true when at least one scripted trigger was queued.
 */
export function queueTriggersFor(
  s: GameState,
  cardId: string,
  controller: PlayerIx,
  on: Trigger['on'],
  opts: { sourceUid: number | null; eventUid?: number | null; sourceBattlefield?: number | null } = { sourceUid: null }
): boolean {
  const abilities = matchingAbilities(cardId, on)
  if (abilities.length === 0) return false
  let queued = false
  for (const { ix, ability } of abilities) {
    // Dependent-keyword gate (Level N) and Equipment Inactive rule (720).
    if (ability.requires) {
      const rctx: EffectCtx = {
        cardId,
        sourceUid: opts.sourceUid,
        sourceBattlefield: opts.sourceBattlefield ?? null,
        controller,
        eventUid: opts.eventUid ?? null,
        vars: {},
      }
      if (!evalCond(s, rctx, ability.requires)) continue
    }
    if (opts.sourceUid !== null) {
      const srcUnit = s.units.find((x) => x.uid === opts.sourceUid)
      const sc = scriptFor(cardId)
      if (srcUnit?.kind === 'gear' && sc?.equip && (srcUnit.attachedTo === undefined || srcUnit.attachedTo === null)) {
        continue // unattached Equipment: rules text inactive
      }
    }
    // "The first time … each turn" limiter.
    if (ability.oncePerTurn) {
      const key = `trg:${opts.sourceUid ?? cardId}:${ix}`
      if ((s.onceUsed[key] ?? 0) >= 1) continue
      s.onceUsed[key] = 1
    }
    queued = true
    pushChain(
      s,
      {
        cardId,
        label: `Déclencheur : ${def(cardId).name}`,
        controller,
        kind: 'trigger',
        scripted: true,
        abilityIx: ix,
        sourceUid: opts.sourceUid,
        eventUid: opts.eventUid ?? null,
        targetVars: opts.sourceBattlefield !== undefined && opts.sourceBattlefield !== null ? { __bf: opts.sourceBattlefield } : undefined,
      },
      'trigger'
    )
    log(s, `Déclencheur de ${def(cardId).name} sur la chaîne.`, controller)
  }
  return queued
}

/** killOnDamage watcher: consume after any damage lands on the unit. */
export function afterDamage(s: GameState, uid: number) {
  const wi = (s.watchers ?? []).findIndex((w) => w.uid === uid && w.kind === 'killOnDamage')
  if (wi >= 0) {
    const src = s.watchers![wi].source
    s.watchers!.splice(wi, 1)
    killUnit(s, uid, def(src).name)
  }
}

/** "When you play a [type] card" triggers across the player's board + legend. */
export function firePlayCardTriggers(s: GameState, p: PlayerIx, playedCardId: string, excludeUid: number | null) {
  const played = def(playedCardId)
  const check = (cardId: string, sourceUid: number | null) => {
    const script = scriptFor(cardId)
    if (!script?.abilities) return
    script.abilities.forEach((ab, ix) => {
      if (ab.kind !== 'triggered' || ab.when.on !== 'playCard') return
      const f = ab.when.filter
      if (f?.type && !f.type.includes(played.type as 'Unit' | 'Spell' | 'Gear')) return
      if (f?.minEnergy !== undefined && (played.energy ?? 0) < f.minEnergy) return
      if (ab.oncePerTurn) {
        const key = `trg:${sourceUid ?? cardId}:${ix}`
        if ((s.onceUsed[key] ?? 0) >= 1) return
        s.onceUsed[key] = 1
      }
      pushChain(
        s,
        {
          cardId,
          label: `Déclencheur : ${def(cardId).name}`,
          controller: p,
          kind: 'trigger',
          scripted: true,
          abilityIx: ix,
          sourceUid,
          eventUid: null,
        },
        'trigger'
      )
      log(s, `Déclencheur de ${def(cardId).name} sur la chaîne.`, p)
    })
  }
  for (const u of [...s.units]) {
    if (u.controller !== p || u.uid === excludeUid) continue
    check(u.cardId, u.uid)
  }
  check(s.players[p].legendId, null)
}

/** Fire an event's triggers across every board card of the given player. */
export function fireBoardEvent(
  s: GameState,
  p: PlayerIx,
  on: Trigger['on'],
  eventUid: number | null = null
) {
  for (const u of [...s.units]) {
    if (u.controller !== p) continue
    queueTriggersFor(s, u.cardId, p, on, { sourceUid: u.uid, eventUid })
  }
  queueTriggersFor(s, s.players[p].legendId, p, on, { sourceUid: null, eventUid })
}

/** Build the resolution program for a chain item backed by a registry script. */
function programForItem(_s: GameState, item: ChainItem): { ctx: EffectCtx; ops: Op[] } | null {
  if (!item.cardId) return null
  const script = scriptFor(item.cardId)
  if (!script) return null
  const vars = { ...(item.targetVars ?? {}) }
  const sourceBattlefield = typeof vars.__bf === 'number' ? (vars.__bf as number) : null
  const ctx: EffectCtx = {
    cardId: item.cardId,
    sourceUid: item.sourceUid ?? null,
    sourceBattlefield,
    controller: item.controller,
    eventUid: item.eventUid ?? null,
    vars,
  }
  if (item.kind === 'spell' && script.spell) {
    let ops: Op[] = script.spell.ops
    // Repeat [Cost] (820): may pay to run the whole effect again (re-choosing targets).
    if (script.spell.repeat) {
      const repeatOps: Op[] = [
        { op: 'choose', bind: '__rep', spec: { kind: 'mayPay', cost: script.spell.repeat, prompt: `Payer Repeat pour répéter « ${def(item.cardId).name} » ?` } },
        {
          op: 'if',
          cond: { var: '__rep' },
          then: [
            ...(script.spell.targets ?? []).map((t): Op => ({ op: 'choose', bind: t.bind, spec: t.spec, optional: t.optional })),
            ...script.spell.ops,
          ],
        },
      ]
      ops = [...ops, ...repeatOps]
    }
    return { ctx, ops }
  }
  if (item.kind === 'ability' && item.abilityIx === -1 && script.equip) {
    // Equip resolution: choose a friendly unit, attach.
    const ops: Op[] = [
      { op: 'choose', bind: '__eq', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
      { op: 'attachSelfTo', bind: '__eq' },
    ]
    return { ctx, ops }
  }
  if ((item.kind === 'trigger' || item.kind === 'ability') && item.abilityIx !== undefined && script.abilities) {
    const ab = script.abilities[item.abilityIx]
    if (!ab || ab.kind === 'passive') return null
    let ops: Op[] = []
    // Targets declared on the ability are chosen at resolution (M1 simplification).
    for (const t of ab.targets ?? []) {
      ops.push({ op: 'choose', bind: t.bind, spec: t.spec, optional: t.optional })
    }
    ops = ops.concat(ab.ops)
    if (ab.kind === 'triggered' && ab.optional) {
      ops = [
        { op: 'choose', bind: '__opt', spec: { kind: 'yesNo', prompt: `Activer « ${def(item.cardId).name} » ?` } },
        { op: 'if', cond: { var: '__opt' }, then: ops },
      ]
    }
    return { ctx, ops }
  }
  return null
}

export function arriveAt(s: GameState, u: UnitEntity, loc: LocationRef) {
  u.location = loc
  if (typeof loc === 'number') {
    const bf = s.battlefields[loc]
    if (bf.controller !== u.controller && bf.contestedBy === null) {
      bf.contestedBy = u.controller
      log(s, `${pname(s, u.controller)} conteste ${bfName(s, loc)}.`, u.controller)
    }
    // Units arriving at an active combat battlefield join the fight (464.2.c.3.a)
    if (s.showdown && s.showdown.battlefield === loc && s.showdown.defender !== null) {
      u.combatRole = u.controller === s.showdown.attacker ? 'attacker' : 'defender'
    }
  }
}

// ---------------------------------------------------------------- chain (FEPR)

export function pushChain(
  s: GameState,
  item: Omit<GameState['chain'][number], 'uid'>,
  opener: 'play' | 'trigger'
) {
  if (s.chain.length === 0) s.chainOpener = opener
  s.chain.push({ ...item, uid: s.nextUid++ })
  s.chainPasses = 0
  // 337.4 / 338.1.a.5: priority goes to the newest item's controller first.
  s.chainActive = item.controller
  if (s.showdown) s.showdown.passes = 0
}

/** Resolve the top of the chain (both players passed). May suspend on a choice. */
export function resolveChainTop(s: GameState) {
  const top = s.chain.pop()
  if (!top) return
  // Scripted resolution via the effect VM.
  if (top.scripted && top.script !== 'vision') {
    const program = programForItem(s, top)
    if (program) {
      log(s, `${top.label} se résout.`, top.controller)
      startProgram(s, program.ctx, program.ops, 'chainResolved', undefined, {
        trashOnDone: top.kind === 'spell' && top.cardId ? { player: top.controller, cardId: top.cardId } : undefined,
      })
      return
    }
  }
  if (top.script === 'vision') {
    // Legacy unscripted [Vision] cards: keep/recycle prompt, then bookkeeping.
    s.pending = { player: top.controller, spec: { kind: 'vision' } }
    log(s, `Vision : ${pname(s, top.controller)} regarde le dessus de son deck.`, top.controller)
    return
  }
  if (top.kind === 'spell' && top.cardId) {
    s.players[top.controller].trash.push(top.cardId)
    log(s, `${top.label} est résolu (effets appliqués manuellement) → défausse.`, top.controller)
  } else {
    log(s, `${top.label} est résolu.`, top.controller)
  }
  afterChainResolve(s)
}

/** Bookkeeping after a chain item finished resolving (340). */
export function afterChainResolve(s: GameState) {
  s.chainPasses = 0
  cleanup(s)
  if (s.winner !== null) return
  if (s.chain.length > 0) {
    s.chainActive = s.chain[s.chain.length - 1].controller
    return
  }
  s.chainActive = null
  const opener = s.chainOpener
  s.chainOpener = null
  // 346/346.1: focus passes when a play-opened chain empties during a showdown.
  if (s.showdown && opener === 'play') {
    s.showdown.focus = other(s.showdown.focus)
    s.showdown.passes = 0
  }
  // A chained Ending Step finished: run delayed effects, then end the turn.
  maybeResumeEnding(s)
}

// ---------------------------------------------------------------- showdown & combat

export function beginShowdown(s: GameState, bfIx: number) {
  const contester = s.battlefields[bfIx].contestedBy
  if (contester === null) return
  s.showdown = { battlefield: bfIx, attacker: contester, defender: null, focus: contester, passes: 0 }
  log(s, `Showdown à ${bfName(s, bfIx)} (sans combat).`, contester)
}

export function beginCombat(s: GameState, bfIx: number) {
  const bf = s.battlefields[bfIx]
  const ongoing = s.showdown !== null && s.showdown.battlefield === bfIx && s.showdown.defender === null
  const attacker = bf.contestedBy ?? other(bf.controller ?? s.turnPlayer)
  const defender = other(attacker)
  if (ongoing) {
    // 464.2: the current showdown becomes a Combat Showdown; focus is maintained.
    s.showdown!.defender = defender
    s.showdown!.attacker = attacker
    s.showdown!.passes = 0
  } else {
    s.showdown = { battlefield: bfIx, attacker, defender, focus: attacker, passes: 0 }
  }
  for (const u of unitsAt(s, bfIx)) {
    u.combatRole = u.controller === attacker ? 'attacker' : 'defender'
  }
  log(s, `⚔️ Combat à ${bfName(s, bfIx)} : ${pname(s, attacker)} attaque ${pname(s, defender)}.`)
  // Combat triggers (464.2.e): attacker's first, then the defender's.
  const attackUnits = unitsAt(s, bfIx, attacker)
  const defendUnits = unitsAt(s, bfIx, defender)
  for (const u of attackUnits) {
    queueTriggersFor(s, u.cardId, attacker, 'attack', { sourceUid: u.uid })
  }
  for (const u of defendUnits) {
    queueTriggersFor(s, u.cardId, defender, 'defend', { sourceUid: u.uid })
  }
  // Battlefield "when you defend here" abilities belong to the defender.
  queueTriggersFor(s, bf.cardId, defender, 'defendHere', { sourceUid: null, sourceBattlefield: bfIx })
  // Unscripted combat triggers: manual reminder.
  for (const u of unitsAt(s, bfIx)) {
    const text = def(u.cardId).text
    if ((!scriptFor(u.cardId) || scriptFor(u.cardId)?.manual) && /when i attack|when i defend/i.test(text)) {
      log(s, `⚠️ Déclencheur de ${def(u.cardId).name} : « ${text} » — à résoudre manuellement.`, u.controller)
    }
  }
}

/** All players passed focus: the showdown closes (348). */
export function closeShowdown(s: GameState) {
  const sd = s.showdown!
  if (sd.defender !== null) {
    combatDamageStep(s)
    return
  }
  // Non-combat showdown (348.2): the sole present player establishes control.
  const bfIx = sd.battlefield
  const bf = s.battlefields[bfIx]
  s.showdown = null
  const p0 = unitsAt(s, bfIx, 0).length
  const p1 = unitsAt(s, bfIx, 1).length
  if (p0 > 0 && p1 === 0) establishControl(s, bfIx, 0)
  else if (p1 > 0 && p0 === 0) establishControl(s, bfIx, 1)
  else bf.contestedBy = null
  cleanup(s)
}

/** Combat Damage Step (465): attacker assigns first, then defender. */
export function combatDamageStep(s: GameState) {
  const sd = s.showdown!
  const bfIx = sd.battlefield
  const attackers = s.units.filter((u) => u.location === bfIx && u.combatRole === 'attacker' && u.kind === 'unit')
  const defenders = s.units.filter((u) => u.location === bfIx && u.combatRole === 'defender' && u.kind === 'unit')

  if (attackers.length === 0 || defenders.length === 0) {
    log(s, `Pas de dégâts de combat (un camp n'a plus d'unités).`)
    finishCombat(s)
    return
  }

  const atkPool = attackers.reduce((n, u) => n + combatMightQ(s, u), 0)
  const auto = autoAssignment(atkPool, defenders)
  if (auto === null) {
    s.pending = {
      player: sd.attacker,
      spec: { kind: 'assignDamage', pool: atkPool, targets: defenders.map((u) => u.uid), side: 'attacker' },
      battlefield: bfIx,
      attackerAssign: null,
    }
    log(s, `${pname(s, sd.attacker)} assigne ${atkPool} dégât(s) de combat.`, sd.attacker)
    return
  }
  continueCombatDamage(s, auto)
}

/** Attacker assignment known: compute/ask the defender's, then deal. */
export function continueCombatDamage(s: GameState, attackerAssign: Record<number, number>) {
  const sd = s.showdown!
  const bfIx = sd.battlefield
  const attackers = s.units.filter((u) => u.location === bfIx && u.combatRole === 'attacker' && u.kind === 'unit')
  const defenders = s.units.filter((u) => u.location === bfIx && u.combatRole === 'defender' && u.kind === 'unit')
  const defPool = defenders.reduce((n, u) => n + combatMightQ(s, u), 0)
  const auto = autoAssignment(defPool, attackers)
  if (auto === null) {
    s.pending = {
      player: sd.defender!,
      spec: { kind: 'assignDamage', pool: defPool, targets: attackers.map((u) => u.uid), side: 'defender' },
      battlefield: bfIx,
      attackerAssign,
    }
    log(s, `${pname(s, sd.defender!)} assigne ${defPool} dégât(s) de combat.`, sd.defender!)
    return
  }
  dealCombatDamage(s, attackerAssign, auto)
}

/** Both assignments known: deal simultaneously (465.2.d), then resolution. */
export function dealCombatDamage(
  s: GameState,
  attackerAssign: Record<number, number>,
  defenderAssign: Record<number, number>
) {
  s.pending = null
  const sd = s.showdown!
  const atkTotal = Object.values(attackerAssign).reduce((a, b) => a + b, 0)
  const defTotal = Object.values(defenderAssign).reduce((a, b) => a + b, 0)
  log(s, `Dégâts de combat : attaque ${atkTotal} / défense ${defTotal}.`)
  for (const [uidStr, dmg] of [...Object.entries(attackerAssign), ...Object.entries(defenderAssign)]) {
    if (dmg <= 0) continue
    const u = s.units.find((x) => x.uid === Number(uidStr))
    if (!u) continue
    u.damage += dmg
    log(s, `${def(u.cardId).name} subit ${dmg} dégât(s).`)
    afterDamage(s, u.uid)
  }
  void sd
  finishCombat(s)
}

/** The Resolution Step (466): Combat Cleanup, result, control. */
export function finishCombat(s: GameState) {
  const sd = s.showdown!
  const bfIx = sd.battlefield
  // Combat Cleanup — 3a/3b: deathknell notes + lethal kills
  for (const u of [...s.units]) {
    if (u.kind === 'unit' && u.damage > 0 && u.damage >= might(s, u)) {
      killUnit(s, u.uid, 'combat')
    }
  }
  // 3c: Heal all Units
  for (const u of s.units) u.damage = 0
  // 3d: Recall attackers if defenders are still present
  const defsLeft = s.units.filter(
    (u) => u.location === bfIx && u.controller === sd.defender && u.kind === 'unit'
  )
  const atksLeft = s.units.filter(
    (u) => u.location === bfIx && u.controller === sd.attacker && u.kind === 'unit'
  )
  if (defsLeft.length > 0 && atksLeft.length > 0) {
    for (const u of atksLeft) {
      u.location = 'base'
      u.combatRole = null
    }
    log(s, `Les deux camps survivent : les attaquants de ${pname(s, sd.attacker)} sont rappelés à la base.`)
  }
  // 466.3-466.5: result & control
  const bf = s.battlefields[bfIx]
  const now0 = unitsAt(s, bfIx, 0).length
  const now1 = unitsAt(s, bfIx, 1).length
  s.showdown = null
  for (const u of s.units) u.combatRole = null
  if (now0 > 0 && now1 === 0) establishControl(s, bfIx, 0)
  else if (now1 > 0 && now0 === 0) establishControl(s, bfIx, 1)
  else bf.contestedBy = null
  cleanup(s)
}

// ---------------------------------------------------------------- cleanup (323)

/** Cleanup per rule 323, looped until stable (322). */
export function cleanup(s: GameState) {
  for (let guard = 0; guard < 20; guard++) {
    const before = JSON.stringify([s.units, s.battlefields, s.players[0].points, s.players[1].points])
    cleanupPass(s)
    if (s.winner !== null || s.pending !== null) return
    const after = JSON.stringify([s.units, s.battlefields, s.players[0].points, s.players[1].points])
    if (before === after) return
  }
}

function cleanupPass(s: GameState) {
  if (s.winner !== null) return
  // 1. Victory check happens via score()/checkWin.
  // 2. Combat designations
  const combatBf = s.showdown !== null && s.showdown.defender !== null ? s.showdown.battlefield : null
  for (const u of s.units) {
    if (combatBf !== null && u.location === combatBf && u.kind === 'unit') {
      const want = u.controller === s.showdown!.attacker ? 'attacker' : 'defender'
      if (u.combatRole !== want) u.combatRole = want
    } else if (u.combatRole !== null) {
      u.combatRole = null
    }
  }
  // 3a/3b. Deathknell notes + lethal kills
  for (const u of [...s.units]) {
    if (u.kind === 'unit' && u.damage > 0 && u.damage >= might(s, u)) {
      killUnit(s, u.uid, 'dégâts létaux')
    }
  }
  if (s.winner !== null) return
  // 4. Lose control of battlefields without your units (Open State, no
  //    showdown/combat there) — control is presence-based (323.6).
  s.battlefields.forEach((bf, ix) => {
    if (bf.controller === null) return
    const hasUnits = unitsAt(s, ix, bf.controller).length > 0
    const ongoingHere = s.showdown !== null && s.showdown.battlefield === ix
    if (!hasUnits && s.chain.length === 0 && !ongoingHere) {
      log(s, `${pname(s, bf.controller)} perd le contrôle de ${bfName(s, ix)} (aucune unité présente).`)
      bf.controller = null
    }
  })
  // Attachments: sync gear to its unit; detach + recall when the unit is gone.
  for (const g of s.units) {
    if (g.kind !== 'gear' || g.attachedTo === undefined || g.attachedTo === null) continue
    const host = s.units.find((x) => x.uid === g.attachedTo)
    if (!host) {
      g.attachedTo = null
      g.location = 'base'
      log(s, `${def(g.cardId).name} se détache (unité disparue) et revient à la base.`)
    } else {
      g.location = host.location
    }
  }
  // 5. Facedown cards trashed when the battlefield isn't controlled by their owner.
  s.battlefields.forEach((bf, ix) => {
    if (!bf.facedown) return
    if (bf.controller !== bf.facedown.owner) {
      s.players[bf.facedown.owner].trash.push(bf.facedown.cardId)
      log(s, `La carte cachée à ${bfName(s, ix)} est défaussée (contrôle perdu).`, bf.facedown.owner)
      bf.facedown = null
    }
  })
  // 8/8a. Contested status upkeep
  s.battlefields.forEach((bf, ix) => {
    const ongoingHere = s.showdown !== null && s.showdown.battlefield === ix
    if (bf.contestedBy !== null && unitsAt(s, ix, bf.contestedBy).length === 0 && !ongoingHere) {
      bf.contestedBy = null
    }
    if (bf.contestedBy === null) {
      for (const p of [0, 1] as PlayerIx[]) {
        if (bf.controller !== p && unitsAt(s, ix, p).length > 0) {
          bf.contestedBy = p
          break
        }
      }
    }
  })
  // 6/7/9/10. Stage & begin showdowns/combats — Neutral Open only.
  if (s.chain.length === 0 && s.showdown === null && s.pending === null && s.phase === 'action') {
    const combatStaged = s.battlefields
      .map((_, ix) => ix)
      .filter((ix) => unitsAt(s, ix, 0).length > 0 && unitsAt(s, ix, 1).length > 0)
    const showdownStaged = s.battlefields
      .map((_, ix) => ix)
      .filter((ix) => s.battlefields[ix].contestedBy !== null && !combatStaged.includes(ix))
    if (showdownStaged.length === 1) {
      beginShowdown(s, showdownStaged[0])
      return
    }
    if (showdownStaged.length > 1) {
      s.pending = {
        player: s.turnPlayer,
        spec: { kind: 'battlefield', options: showdownStaged, reason: 'showdown' },
      }
      log(s, `${pname(s, s.turnPlayer)} choisit quel showdown commence.`, s.turnPlayer)
      return
    }
    if (combatStaged.length === 1) {
      beginCombat(s, combatStaged[0])
      return
    }
    if (combatStaged.length > 1) {
      s.pending = {
        player: s.turnPlayer,
        spec: { kind: 'battlefield', options: combatStaged, reason: 'combat' },
      }
      log(s, `${pname(s, s.turnPlayer)} choisit quel combat commence.`, s.turnPlayer)
      return
    }
  }
  // 10a. Non-combat showdown where opposing units now face off → combat.
  if (s.showdown !== null && s.showdown.defender === null) {
    const ix = s.showdown.battlefield
    if (unitsAt(s, ix, 0).length > 0 && unitsAt(s, ix, 1).length > 0) {
      beginCombat(s, ix)
    }
  }
}

// ---------------------------------------------------------------- turn flow

export function startTurn(s: GameState, p: PlayerIx) {
  if (s.winner !== null) return
  s.turn += 1
  s.turnPlayer = p
  s.phase = 'action'
  s.cardsPlayedThisTurn = [0, 0]
  for (const bf of s.battlefields) bf.scoredBy = [false, false]
  log(s, `— Tour ${s.turn} : ${pname(s, p)} —`)

  // Awaken: ready everything the turn player controls (legend included)
  for (const u of s.units) if (u.controller === p) u.ready = true
  for (const r of s.players[p].runes) r.ready = true
  s.players[p].legendReady = true
  s.onceUsed = {}

  // Beginning Step: Temporary permanents die before scoring (816)
  for (const u of [...s.units]) {
    if (u.controller === p && effKeywordsTemporary(s, u)) {
      killUnit(s, u.uid, 'Temporaire')
    }
  }
  // Scripted start-of-turn triggers (units + legend), manual reminders otherwise.
  for (const u of [...s.units]) {
    if (u.controller !== p) continue
    const queued = queueTriggersFor(s, u.cardId, p, 'startOfTurn', { sourceUid: u.uid })
    if (!queued && (!scriptFor(u.cardId) || scriptFor(u.cardId)?.manual) && /at the start of/i.test(def(u.cardId).text)) {
      log(s, `⚠️ Début de tour — ${def(u.cardId).name} : « ${def(u.cardId).text} »`, p)
    }
  }
  queueTriggersFor(s, s.players[p].legendId, p, 'startOfTurn', { sourceUid: null })

  // Scoring Step: Hold every controlled battlefield (315.2.b)
  s.battlefields.forEach((bf, ix) => {
    if (bf.controller === p) score(s, p, ix, 'hold')
  })
  if (s.winner !== null) return

  // Channel Phase: 2 runes (second player channels 3 on their first turn, 644.7)
  const n = s.turn === 2 ? CHANNEL_PER_TURN + 1 : CHANNEL_PER_TURN
  const pl = s.players[p]
  const channeled = pl.runeDeck.splice(0, n)
  for (const cardId of channeled) {
    pl.runes.push({ uid: s.nextUid++, cardId, ready: true })
  }
  log(s, `${pname(s, p)} canalise ${channeled.length} rune(s).`, p)

  // Draw Phase
  draw(s, p, 1)
  log(s, `${pname(s, p)} pioche 1 carte.`, p)
  // Main Phase begins: every player's rune pool empties (316.3)
  for (const q of s.players) q.pool = { energy: 0, power: {} }

  cleanup(s)
}

export function endTurn(s: GameState) {
  const p = s.turnPlayer
  // Ending Step: stun wears off (599.1.a.2); end-of-turn triggers
  for (const u of s.units) u.stunned = false
  for (const u of [...s.units]) {
    if (u.controller !== p) continue
    const queued = queueTriggersFor(s, u.cardId, u.controller, 'endOfTurn', { sourceUid: u.uid })
    if (!queued && (!scriptFor(u.cardId) || scriptFor(u.cardId)?.manual) && /at the end of/i.test(def(u.cardId).text)) {
      log(s, `⚠️ Fin de tour — ${def(u.cardId).name} : « ${def(u.cardId).text} »`, u.controller)
    }
  }
  queueTriggersFor(s, s.players[p].legendId, p, 'endOfTurn', { sourceUid: null })
  // End-of-turn triggers chained: finish the turn once the chain resolves.
  if (s.chain.length > 0 || s.pending !== null || s.exec !== null) {
    s.endingTurn = true
    return
  }
  processDelayed(s)
}

/** Run the next "at end of this turn" effect, then complete the turn (317).
 *  Each program's completion re-enters via maybeResumeEnding — one item at a
 *  time, no double-processing. */
export function processDelayed(s: GameState) {
  s.endingTurn = true
  const q = (s.delayed ?? []) as { ctx: EffectCtx; ops: Op[] }[]
  if (q.length === 0) {
    s.endingTurn = false
    finishEndTurn(s)
    return
  }
  const item = q.shift()!
  startProgram(s, item.ctx, item.ops, 'delayedStep')
}

/** Continue the Ending Step once the board has drained (chain/VM/choices). */
export function maybeResumeEnding(s: GameState) {
  if (s.endingTurn && s.chain.length === 0 && s.pending === null && s.exec === null && s.winner === null) {
    processDelayed(s)
  }
}

/** Expiration + Cleanup steps of the Ending Phase, then the next turn (317.2-3). */
export function finishEndTurn(s: GameState) {
  const p = s.turnPlayer
  s.watchers = []
  s.entryReady = [0, 0]
  for (let guard = 0; guard < 10; guard++) {
    for (const u of s.units) {
      u.damage = 0
      u.tempMight = 0
      u.grants = u.grants.filter((g) => g.duration !== 'turn')
    }
    for (const q of s.players) q.pool = { energy: 0, power: {} }
    const before = JSON.stringify([s.units, s.battlefields])
    cleanup(s)
    if (s.winner !== null) return
    const after = JSON.stringify([s.units, s.battlefields])
    if (before === after) break
  }
  s.discardsThisTurn = [0, 0]
  s.diedThisTurn = [0, 0]
  // 317.3: next queued turn, else alternate
  const next = s.turnQueue.shift() ?? other(p)
  startTurn(s, next)
}

// ---------------------------------------------------------------- costs

export function payPower(s: GameState, p: PlayerIx, amount: number, domains: Domain[]): boolean {
  const pool = s.players[p].pool
  let need = amount
  for (const d of domains) {
    const have = pool.power[d] ?? 0
    const use = Math.min(have, need)
    pool.power[d] = have - use
    need -= use
  }
  const uni = pool.power.Universal ?? 0
  const useUni = Math.min(uni, need)
  pool.power.Universal = uni - useUni
  need -= useUni
  return need === 0
}

/** Pay power of ANY domain (e.g. the Hide cost, 811.1.b). */
export function payAnyPower(s: GameState, p: PlayerIx, amount: number): boolean {
  const pool = s.players[p].pool
  let need = amount
  for (const d of Object.keys(pool.power) as (Domain | 'Universal')[]) {
    if (d === 'Universal') continue
    const have = pool.power[d] ?? 0
    const use = Math.min(have, need)
    pool.power[d] = have - use
    need -= use
    if (need === 0) return true
  }
  const uni = pool.power.Universal ?? 0
  const useUni = Math.min(uni, need)
  pool.power.Universal = uni - useUni
  need -= useUni
  return need === 0
}

export function availablePower(s: GameState, p: PlayerIx, domains: Domain[]): number {
  const pool = s.players[p].pool
  let n = pool.power.Universal ?? 0
  for (const d of domains) n += pool.power[d] ?? 0
  return n
}

export function totalPower(s: GameState, p: PlayerIx): number {
  const pool = s.players[p].pool
  return Object.values(pool.power).reduce((a, b) => a + (b ?? 0), 0)
}

// ---------------------------------------------------------------- timing

export function canActNow(s: GameState, p: PlayerIx, kw: { action: boolean; reaction: boolean }): boolean {
  if (s.winner !== null || s.phase !== 'action' || s.pending !== null) return false
  if (s.chain.length > 0) {
    // Closed State (338.1.a): only Reactions, by the priority holder.
    return kw.reaction && s.chainActive === p
  }
  if (s.showdown) {
    return (kw.action || kw.reaction) && s.showdown.focus === p
  }
  return s.turnPlayer === p
}

// ---------------------------------------------------------------- combat choice plumbing

/** Handle an assignDamage answer (or a bot's greedy fallback). */
export function applyAssignDamageChoice(s: GameState, assignments: Record<number, number>) {
  const pending = s.pending
  if (!pending || pending.spec.kind !== 'assignDamage' || !('attackerAssign' in pending))
    throw new IllegalAction('Aucune assignation en attente')
  const targets = pending.spec.targets
    .map((uid) => s.units.find((u) => u.uid === uid))
    .filter((u): u is UnitEntity => u !== undefined)
  const err = validateAssignment(pending.spec.pool, targets, assignments)
  if (err) throw new IllegalAction(err)
  if (pending.spec.side === 'attacker') {
    s.pending = null
    continueCombatDamage(s, assignments)
  } else {
    const atk = pending.attackerAssign ?? {}
    s.pending = null
    dealCombatDamage(s, atk, assignments)
  }
}

/** Canonical legal assignment for the current pending prompt (bot / UI default). */
export function defaultAssignment(s: GameState): Record<number, number> {
  const pending = s.pending
  if (!pending || pending.spec.kind !== 'assignDamage') return {}
  const targets = pending.spec.targets
    .map((uid) => s.units.find((u) => u.uid === uid))
    .filter((u): u is UnitEntity => u !== undefined)
  return greedyAssignment(pending.spec.pool, targets)
}

// ---------------------------------------------------------------- effect helpers

function effKeywordsTemporary(_s: GameState, u: UnitEntity): boolean {
  if (keywords(u.cardId).temporary) return true
  return u.grants.some((g) => g.keywords.some((k) => /^temporary/i.test(k)))
}

/** Grant might/keywords to a unit from a scripted effect. */
export function giveToUnit(
  s: GameState,
  u: UnitEntity,
  mightBonus: number,
  kws: string[],
  duration: 'turn' | 'permanent'
) {
  const grant: GrantedEffect = { might: mightBonus, keywords: kws, duration }
  u.grants.push(grant)
  const parts = [
    mightBonus !== 0 ? `${mightBonus > 0 ? '+' : ''}${mightBonus} ⚔️` : '',
    ...kws.map((k) => `[${k}]`),
  ].filter(Boolean)
  log(s, `${def(u.cardId).name} reçoit ${parts.join(' ')}${duration === 'turn' ? ' ce tour' : ''}.`)
}

/** Channel N runes from the top of the rune deck (default ready). */
export function channelRunes(s: GameState, p: PlayerIx, n: number, exhausted: boolean) {
  const pl = s.players[p]
  const channeled = pl.runeDeck.splice(0, n)
  for (const cardId of channeled) {
    pl.runes.push({ uid: s.nextUid++, cardId, ready: !exhausted })
  }
  if (channeled.length > 0)
    log(s, `${pname(s, p)} canalise ${channeled.length} rune(s)${exhausted ? ' engagée(s)' : ''}.`, p)
}

/** Discard a specific card from a player's hand (with discarded-self triggers). */
export function discardCard(s: GameState, p: PlayerIx, cardId: string) {
  const hand = s.players[p].hand
  const ix = hand.indexOf(cardId)
  if (ix < 0) return
  hand.splice(ix, 1)
  s.players[p].trash.push(cardId)
  s.discardsThisTurn[p] += 1
  log(s, `${pname(s, p)} défausse ${def(cardId).name}.`, p)
  queueTriggersFor(s, cardId, p, 'discardedSelf', { sourceUid: null })
  fireBoardEvent(s, p, 'youDiscard')
}

export function gainPoints(s: GameState, p: PlayerIx, n: number) {
  s.players[p].points = Math.max(0, s.players[p].points + n)
  log(s, `${pname(s, p)} gagne ${n} point(s) → ${s.players[p].points}.`, p)
  checkWin(s)
}

// Re-exported for reducer/UI convenience.
export { runVm, startProgram }
export type { ExecState }
