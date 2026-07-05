import type { Domain } from '../data/cards'
import { combatMight, def, hasPlayedTrigger, keywords, unitMight, unitsAt } from './cardinfo'
import { shuffle } from './rng'
import type {
  GameAction,
  GameState,
  LocationRef,
  ManualOp,
  PlayerIx,
  UnitEntity,
} from './types'
import { CHANNEL_PER_TURN, MAX_MULLIGAN, VICTORY_SCORE } from './types'

export class IllegalAction extends Error {}

const other = (p: PlayerIx): PlayerIx => (p === 0 ? 1 : 0)

function log(s: GameState, text: string, player: PlayerIx | null = null) {
  s.log.push({ turn: s.turn, player, text })
}

function pname(s: GameState, p: PlayerIx) {
  return s.players[p].name
}

function bfName(s: GameState, ix: number) {
  return def(s.battlefields[ix].cardId).name
}

// ---------------------------------------------------------------- drawing

function burnOut(s: GameState, p: PlayerIx) {
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

function draw(s: GameState, p: PlayerIx, n: number) {
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

function checkWin(s: GameState) {
  if (s.winner !== null) return
  for (const p of [0, 1] as PlayerIx[]) {
    if (s.players[p].points >= VICTORY_SCORE) {
      s.winner = p
      s.phase = 'over'
      log(s, `🏆 ${pname(s, p)} atteint ${VICTORY_SCORE} points et gagne la partie !`)
      return
    }
  }
}

// ---------------------------------------------------------------- scoring

function score(s: GameState, p: PlayerIx, bfIx: number, method: 'hold' | 'conquer') {
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
  const text = def(bf.cardId).text
  if (text) log(s, `Capacité de ${bfName(s, bfIx)} : « ${text} » (appliquer manuellement si besoin).`, p)
  checkWin(s)
}

function setControl(s: GameState, bfIx: number, p: PlayerIx) {
  const bf = s.battlefields[bfIx]
  if (bf.controller === p) return
  bf.controller = p
  bf.contestedBy = null
  log(s, `${pname(s, p)} prend le contrôle de ${bfName(s, bfIx)}.`, p)
  score(s, p, bfIx, 'conquer')
}

// ---------------------------------------------------------------- units

function killUnit(s: GameState, uid: number, cause: string) {
  const ix = s.units.findIndex((u) => u.uid === uid)
  if (ix < 0) return
  const u = s.units[ix]
  s.units.splice(ix, 1)
  const card = def(u.cardId)
  const owner = u.controller // 1v1: controller == owner in this engine
  if (u.isChampion) {
    // Champions go to the trash like any unit (cannot return to Champion Zone)
  }
  s.players[owner].trash.push(u.cardId)
  log(s, `${card.name} de ${pname(s, owner)} est détruit (${cause}).`, owner)
  if (keywords(u.cardId).deathknell) {
    log(
      s,
      `⚠️ Deathknell de ${card.name} : « ${card.text} » — à résoudre manuellement (outils manuels).`,
      owner
    )
  }
}

function arriveAt(s: GameState, u: UnitEntity, loc: LocationRef) {
  u.location = loc
  if (typeof loc === 'number') {
    const bf = s.battlefields[loc]
    if (bf.controller !== u.controller && bf.contestedBy === null) {
      bf.contestedBy = u.controller
      log(s, `${pname(s, u.controller)} conteste ${bfName(s, loc)}.`, u.controller)
    }
    // Units arriving at an active combat battlefield join the fight
    if (s.showdown && s.showdown.battlefield === loc && s.showdown.defender !== null) {
      u.combatRole = u.controller === s.showdown.attacker ? 'attacker' : 'defender'
    }
  }
}

// ---------------------------------------------------------------- cleanup

function cleanup(s: GameState) {
  if (s.winner !== null) return
  // 1. Kill lethal-damaged units
  for (const u of [...s.units]) {
    if (u.kind === 'unit' && u.damage > 0 && u.damage >= unitMight(u)) {
      killUnit(s, u.uid, 'dégâts létaux')
    }
  }
  // 2. Remove combat designations from units not at the combat battlefield
  const combatBf = s.showdown?.defender !== null && s.showdown ? s.showdown.battlefield : null
  for (const u of s.units) {
    if (u.combatRole !== null && u.location !== combatBf) u.combatRole = null
  }
  // 4. Facedown cards: removed when their owner no longer controls the
  //    battlefield or has no unit present there
  s.battlefields.forEach((bf, ix) => {
    if (!bf.facedown) return
    const owner = bf.facedown.owner
    if (bf.controller !== owner || unitsAt(s, ix, owner).length === 0) {
      s.players[owner].trash.push(bf.facedown.cardId)
      log(s, `La carte cachée à ${bfName(s, ix)} est défaussée (contrôle perdu).`, owner)
      bf.facedown = null
    }
  })
  // Contest & control resolution
  s.pendingCombat = []
  s.battlefields.forEach((bf, ix) => {
    const p0 = unitsAt(s, ix, 0).length
    const p1 = unitsAt(s, ix, 1).length
    if (p0 > 0 && p1 > 0) {
      // 5. Combat pending
      s.pendingCombat.push(ix)
    } else if (p0 + p1 > 0) {
      const present: PlayerIx = p0 > 0 ? 0 : 1
      if (bf.controller !== present) {
        if (bf.controller === null) {
          bf.contestedBy = present // showdown will resolve control
        } else {
          // Empty enemy battlefield: control flips immediately (conquer)
          setControl(s, ix, present)
        }
      } else {
        bf.contestedBy = null
      }
    }
  })
  if (s.winner !== null) return
  // 6–7. In Neutral Open state, start showdowns/combats
  if (s.chain.length === 0 && s.showdown === null) {
    // Non-combat showdown at a contested, uncontrolled battlefield
    const contestedIx = s.battlefields.findIndex(
      (bf, ix) => bf.contestedBy !== null && bf.controller === null && !s.pendingCombat.includes(ix)
    )
    if (contestedIx >= 0) {
      const attacker = s.battlefields[contestedIx].contestedBy!
      s.showdown = { battlefield: contestedIx, attacker, defender: null, focus: attacker, passes: 0 }
      log(s, `Showdown à ${bfName(s, contestedIx)} (sans combat).`, attacker)
      return
    }
    if (s.pendingCombat.length === 1) {
      startCombat(s, s.pendingCombat[0])
    } else if (s.pendingCombat.length > 1) {
      log(s, `Plusieurs combats en attente : ${pname(s, s.turnPlayer)} choisit l'ordre.`)
    }
  }
}

function startCombat(s: GameState, bfIx: number) {
  const bf = s.battlefields[bfIx]
  const attacker = bf.contestedBy ?? other(bf.controller ?? s.turnPlayer)
  const defender = other(attacker)
  for (const u of unitsAt(s, bfIx)) {
    u.combatRole = u.controller === attacker ? 'attacker' : 'defender'
  }
  s.showdown = { battlefield: bfIx, attacker, defender, focus: attacker, passes: 0 }
  s.pendingCombat = s.pendingCombat.filter((ix) => ix !== bfIx)
  log(s, `⚔️ Combat à ${bfName(s, bfIx)} : ${pname(s, attacker)} attaque ${pname(s, defender)}.`)
  for (const u of unitsAt(s, bfIx)) {
    const text = def(u.cardId).text
    if (/when i attack|when i defend/i.test(text)) {
      log(s, `⚠️ Déclencheur de ${def(u.cardId).name} : « ${text} » — à résoudre manuellement.`, u.controller)
    }
  }
}

// ---------------------------------------------------------------- combat damage

/** Auto-assignment: Tanks first, then highest Might; full lethal per unit. */
function assignDamage(pool: number, targets: UnitEntity[]): Map<number, number> {
  const out = new Map<number, number>()
  const ordered = [...targets].sort((a, b) => {
    const ta = keywords(a.cardId).tank ? 1 : 0
    const tb = keywords(b.cardId).tank ? 1 : 0
    if (ta !== tb) return tb - ta
    return unitMight(b) - unitMight(a)
  })
  let remaining = pool
  for (const u of ordered) {
    if (remaining <= 0) break
    const lethal = Math.max(1, unitMight(u) - u.damage)
    const dealt = Math.min(lethal, remaining)
    out.set(u.uid, dealt)
    remaining -= dealt
  }
  return out
}

function combatDamageAndResolution(s: GameState) {
  const sd = s.showdown!
  const bfIx = sd.battlefield
  const attackerUnits = s.units.filter((u) => u.location === bfIx && u.combatRole === 'attacker')
  const defenderUnits = s.units.filter((u) => u.location === bfIx && u.combatRole === 'defender')

  if (attackerUnits.length > 0 && defenderUnits.length > 0) {
    const atkTotal = attackerUnits.reduce((n, u) => n + combatMight(u), 0)
    const defTotal = defenderUnits.reduce((n, u) => n + combatMight(u), 0)
    const toDefenders = assignDamage(atkTotal, defenderUnits)
    const toAttackers = assignDamage(defTotal, attackerUnits)
    log(s, `Dégâts de combat : attaque ${atkTotal} / défense ${defTotal}.`)
    for (const [uid, dmg] of [...toDefenders, ...toAttackers]) {
      const u = s.units.find((x) => x.uid === uid)!
      u.damage += dmg
      log(s, `${def(u.cardId).name} subit ${dmg} dégât(s).`)
    }
    // Kill lethal units now (resolution step 1)
    for (const u of [...s.units]) {
      if (u.kind === 'unit' && u.damage > 0 && u.damage >= unitMight(u)) {
        killUnit(s, u.uid, 'combat')
      }
    }
  } else {
    log(s, `Pas de dégâts de combat (un camp n'a plus d'unités).`)
  }

  const bf = s.battlefields[bfIx]
  const atkLeft = s.units.filter((u) => u.location === bfIx && u.controller === sd.attacker)
  const defLeft = s.units.filter((u) => u.location === bfIx && u.controller === sd.defender!)

  if (atkLeft.length > 0 && defLeft.length > 0) {
    for (const u of atkLeft) {
      u.location = 'base'
      u.combatRole = null
    }
    log(s, `Les deux camps survivent : les attaquants de ${pname(s, sd.attacker)} sont rappelés à la base.`)
  } else if (defLeft.length === 0 && atkLeft.length > 0) {
    setControl(s, bfIx, sd.attacker)
  }
  bf.contestedBy = null
  // Clear ALL marked damage on all units everywhere (end of any combat)
  for (const u of s.units) {
    u.damage = 0
    if (u.location !== bfIx) u.combatRole = null
  }
  for (const u of s.units) u.combatRole = null
  s.showdown = null
  cleanup(s)
}

function endShowdown(s: GameState) {
  const sd = s.showdown!
  if (sd.defender !== null) {
    combatDamageAndResolution(s)
    return
  }
  // Non-combat showdown: contester takes control
  const bfIx = sd.battlefield
  const bf = s.battlefields[bfIx]
  s.showdown = null
  if (bf.contestedBy !== null && unitsAt(s, bfIx, bf.contestedBy).length > 0) {
    setControl(s, bfIx, bf.contestedBy)
  }
  cleanup(s)
}

// ---------------------------------------------------------------- turn flow

function startTurn(s: GameState, p: PlayerIx) {
  if (s.winner !== null) return
  s.turn += 1
  s.turnPlayer = p
  s.phase = 'action'
  s.cardsPlayedThisTurn = [0, 0]
  for (const bf of s.battlefields) bf.scoredBy = [false, false]
  log(s, `— Tour ${s.turn} : ${pname(s, p)} —`)

  // Awaken: ready everything the turn player controls
  for (const u of s.units) if (u.controller === p) u.ready = true
  for (const r of s.players[p].runes) r.ready = true

  // Beginning step: Temporary permanents die before scoring
  for (const u of [...s.units]) {
    if (u.controller === p && keywords(u.cardId).temporary) {
      killUnit(s, u.uid, 'Temporaire')
    }
  }
  for (const u of s.units) {
    if (u.controller === p && /at the start of/i.test(def(u.cardId).text)) {
      log(s, `⚠️ Début de tour — ${def(u.cardId).name} : « ${def(u.cardId).text} »`, p)
    }
  }

  // Scoring step: Hold
  s.battlefields.forEach((bf, ix) => {
    if (bf.controller === p) score(s, p, ix, 'hold')
  })
  if (s.winner !== null) return

  // Channel phase: 2 runes (second player channels 3 on their first turn)
  const n = s.turn === 2 ? CHANNEL_PER_TURN + 1 : CHANNEL_PER_TURN
  const pl = s.players[p]
  const channeled = pl.runeDeck.splice(0, n)
  for (const cardId of channeled) {
    pl.runes.push({ uid: s.nextUid++, cardId, ready: true })
  }
  log(s, `${pname(s, p)} canalise ${channeled.length} rune(s).`, p)

  // Draw phase
  draw(s, p, 1)
  log(s, `${pname(s, p)} pioche 1 carte.`, p)
  // Rune pools empty at end of Draw Phase
  for (const q of s.players) q.pool = { energy: 0, power: {} }

  cleanup(s)
}

function endTurn(s: GameState) {
  const p = s.turnPlayer
  // Ending step: stun wears off
  for (const u of s.units) u.stunned = false
  for (const u of s.units) {
    if (/at the end of/i.test(def(u.cardId).text)) {
      log(s, `⚠️ Fin de tour — ${def(u.cardId).name} : « ${def(u.cardId).text} »`, u.controller)
    }
  }
  // Expiration step: clear damage, "this turn" effects, pools
  for (const u of s.units) {
    u.damage = 0
    u.tempMight = 0
  }
  for (const q of s.players) q.pool = { energy: 0, power: {} }
  cleanup(s)
  if (s.winner !== null) return
  startTurn(s, other(p))
}

// ---------------------------------------------------------------- costs

function payPower(s: GameState, p: PlayerIx, amount: number, domains: Domain[]): boolean {
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

function availablePower(s: GameState, p: PlayerIx, domains: Domain[]): number {
  const pool = s.players[p].pool
  let n = pool.power.Universal ?? 0
  for (const d of domains) n += pool.power[d] ?? 0
  return n
}

// ---------------------------------------------------------------- timing

function canActNow(s: GameState, p: PlayerIx, kw: { action: boolean; reaction: boolean }): boolean {
  if (s.winner !== null || s.phase !== 'action') return false
  if (s.chain.length > 0) {
    // Closed state: only Reactions by the active chain player, before the chain locks
    return kw.reaction && s.chainActive === p && s.chainPasses < 2
  }
  if (s.showdown) {
    return (kw.action || kw.reaction) && s.showdown.focus === p
  }
  return s.turnPlayer === p
}

// ---------------------------------------------------------------- manual ops

function applyManual(s: GameState, p: PlayerIx, op: ManualOp) {
  const who = pname(s, p)
  const unit = (uid: number) => s.units.find((u) => u.uid === uid)
  switch (op.k) {
    case 'draw':
      draw(s, op.who, op.n)
      log(s, `🔧 ${who} : ${pname(s, op.who)} pioche ${op.n}.`, p)
      break
    case 'damage': {
      const u = unit(op.unitUid)
      if (u) {
        u.damage += op.n
        log(s, `🔧 ${who} : ${op.n} dégât(s) à ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'heal': {
      const u = unit(op.unitUid)
      if (u) {
        u.damage = Math.max(0, u.damage - op.n)
        log(s, `🔧 ${who} : soigne ${op.n} sur ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'buff': {
      const u = unit(op.unitUid)
      if (u && !u.buffed) {
        u.buffed = true
        log(s, `🔧 ${who} : buff sur ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'unbuff': {
      const u = unit(op.unitUid)
      if (u && u.buffed) {
        u.buffed = false
        log(s, `🔧 ${who} : buff retiré de ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'stun': {
      const u = unit(op.unitUid)
      if (u && !u.stunned) {
        u.stunned = true
        log(s, `🔧 ${who} : ${def(u.cardId).name} est étourdi.`, p)
      }
      break
    }
    case 'kill':
      killUnit(s, op.unitUid, 'effet')
      break
    case 'recallUnit': {
      const u = unit(op.unitUid)
      if (u) {
        u.location = 'base'
        u.combatRole = null
        log(s, `🔧 ${who} : ${def(u.cardId).name} est rappelé à la base.`, p)
      }
      break
    }
    case 'readyUnit': {
      const u = unit(op.unitUid)
      if (u) {
        u.ready = op.ready
        log(s, `🔧 ${who} : ${def(u.cardId).name} ${op.ready ? 'redressé' : 'engagé'}.`, p)
      }
      break
    }
    case 'tempMight': {
      const u = unit(op.unitUid)
      if (u) {
        u.tempMight += op.n
        log(s, `🔧 ${who} : ${def(u.cardId).name} ${op.n > 0 ? '+' : ''}${op.n} Might ce tour.`, p)
      }
      break
    }
    case 'points':
      s.players[op.who].points = Math.max(0, s.players[op.who].points + op.n)
      log(s, `🔧 ${who} : ${pname(s, op.who)} ${op.n > 0 ? '+' : ''}${op.n} point(s) → ${s.players[op.who].points}.`, p)
      checkWin(s)
      break
    case 'energy':
      s.players[op.who].pool.energy = Math.max(0, s.players[op.who].pool.energy + op.n)
      log(s, `🔧 ${who} : ${op.n > 0 ? '+' : ''}${op.n} énergie pour ${pname(s, op.who)}.`, p)
      break
    case 'power': {
      const pool = s.players[op.who].pool
      pool.power[op.domain] = Math.max(0, (pool.power[op.domain] ?? 0) + op.n)
      log(s, `🔧 ${who} : ${op.n > 0 ? '+' : ''}${op.n} puissance ${op.domain} pour ${pname(s, op.who)}.`, p)
      break
    }
    case 'discard': {
      const h = s.players[op.who].hand
      const ix = h.indexOf(op.cardId)
      if (ix >= 0) {
        h.splice(ix, 1)
        s.players[op.who].trash.push(op.cardId)
        log(s, `🔧 ${who} : ${pname(s, op.who)} défausse ${def(op.cardId).name}.`, p)
      }
      break
    }
    case 'toHandFromTrash': {
      const t = s.players[op.who].trash
      const ix = t.indexOf(op.cardId)
      if (ix >= 0) {
        t.splice(ix, 1)
        s.players[op.who].hand.push(op.cardId)
        log(s, `🔧 ${who} : ${def(op.cardId).name} revient de la défausse en main.`, p)
      }
      break
    }
    case 'channel': {
      const pl = s.players[op.who]
      const runes = pl.runeDeck.splice(0, op.n)
      for (const cardId of runes) pl.runes.push({ uid: s.nextUid++, cardId, ready: true })
      log(s, `🔧 ${who} : ${pname(s, op.who)} canalise ${runes.length} rune(s).`, p)
      break
    }
    case 'note':
      log(s, `💬 ${who} : ${op.text}`, p)
      break
  }
  cleanup(s)
}

// ---------------------------------------------------------------- main reducer

export function applyAction(prev: GameState, action: GameAction): GameState {
  const s = structuredClone(prev)
  const p = action.player

  if (s.winner !== null && action.t !== 'manual') return s

  switch (action.t) {
    case 'mulligan': {
      if (s.phase !== 'mulligan') throw new IllegalAction('Pas en phase de mulligan')
      const pl = s.players[p]
      if (pl.mulliganed) throw new IllegalAction('Mulligan déjà effectué')
      if (action.cardIds.length > MAX_MULLIGAN) throw new IllegalAction('Max 2 cartes')
      const aside: string[] = []
      for (const id of action.cardIds) {
        const ix = pl.hand.indexOf(id)
        if (ix < 0) throw new IllegalAction('Carte absente de la main')
        aside.push(...pl.hand.splice(ix, 1))
      }
      draw(s, p, aside.length)
      shuffle(s.rng, aside)
      pl.deck.push(...aside) // recycled to the bottom
      pl.mulliganed = true
      log(s, `${pname(s, p)} mulligane ${aside.length} carte(s).`, p)
      if (s.players.every((q) => q.mulliganed)) startTurn(s, s.turnPlayer)
      return s
    }

    case 'exhaustRune': {
      const rune = s.players[p].runes.find((r) => r.uid === action.runeUid)
      if (!rune || !rune.ready) throw new IllegalAction('Rune indisponible')
      rune.ready = false
      s.players[p].pool.energy += 1
      return s
    }

    case 'recycleRune': {
      const pl = s.players[p]
      const ix = pl.runes.findIndex((r) => r.uid === action.runeUid)
      if (ix < 0) throw new IllegalAction('Rune introuvable')
      const rune = pl.runes[ix]
      const domain = (def(rune.cardId).domains[0] ?? 'Universal') as Domain
      pl.runes.splice(ix, 1)
      pl.runeDeck.push(rune.cardId) // bottom of rune deck
      pl.pool.power[domain] = (pl.pool.power[domain] ?? 0) + 1
      return s
    }

    case 'playCard': {
      const card = def(action.cardId)
      const kw = keywords(action.cardId)
      const pl = s.players[p]
      const isHiddenPlay = action.from === 'hidden'
      const effKw = isHiddenPlay ? { action: true, reaction: true } : kw
      if (!canActNow(s, p, effKw)) throw new IllegalAction('Timing illégal pour cette carte')

      // Source zone checks
      if (action.from === 'hand') {
        if (!pl.hand.includes(action.cardId)) throw new IllegalAction('Carte absente de la main')
      } else if (action.from === 'champion') {
        if (!pl.championInZone || pl.championId !== action.cardId)
          throw new IllegalAction('Champion indisponible')
      } else {
        const bf = s.battlefields[action.battlefield ?? -1]
        if (!bf?.facedown || bf.facedown.owner !== p || bf.facedown.cardId !== action.cardId)
          throw new IllegalAction('Carte cachée introuvable')
        if (s.turn <= bf.facedown.hiddenOnTurn)
          throw new IllegalAction('Jouable à partir du tour suivant')
      }

      // Costs (hidden plays ignore the base cost)
      if (!isHiddenPlay) {
        const energy = card.energy ?? 0
        const power = card.power ?? 0
        const extraEnergy = action.accelerate && kw.accelerate ? 1 : 0
        const extraPower = action.accelerate && kw.accelerate ? 1 : 0
        if (pl.pool.energy < energy + extraEnergy) throw new IllegalAction('Énergie insuffisante')
        if (availablePower(s, p, card.domains) < power + extraPower)
          throw new IllegalAction('Puissance insuffisante')
        pl.pool.energy -= energy + extraEnergy
        payPower(s, p, power + extraPower, card.domains)
      }

      // Remove from source zone
      if (action.from === 'hand') pl.hand.splice(pl.hand.indexOf(action.cardId), 1)
      else if (action.from === 'champion') pl.championInZone = false
      else s.battlefields[action.battlefield!].facedown = null

      s.cardsPlayedThisTurn[p] += 1
      if (kw.legion && s.cardsPlayedThisTurn[p] > 1) {
        log(s, `Légion de ${card.name} est active (une autre carte a été jouée ce tour).`, p)
      }
      if (kw.unknown.length > 0) {
        log(s, `⚠️ Mots-clés non gérés sur ${card.name} : ${kw.unknown.join(', ')} — appliquer manuellement.`, p)
      }

      if (card.type === 'Unit') {
        let loc: LocationRef = action.location ?? 'base'
        if (typeof loc === 'number' && s.battlefields[loc].controller !== p) {
          throw new IllegalAction('Une unité arrive à la base ou sur un champ de bataille contrôlé')
        }
        if (isHiddenPlay) loc = action.battlefield!
        const u: UnitEntity = {
          uid: s.nextUid++,
          cardId: action.cardId,
          controller: p,
          kind: 'unit',
          location: 'base',
          ready: Boolean(action.accelerate && kw.accelerate),
          damage: 0,
          buffed: false,
          stunned: false,
          combatRole: null,
          tempMight: 0,
          isChampion: action.from === 'champion',
        }
        s.units.push(u)
        arriveAt(s, u, loc)
        log(
          s,
          `${pname(s, p)} joue ${card.name}${typeof loc === 'number' ? ` à ${bfName(s, loc)}` : ''}${u.ready ? ' (Accélérée, arrive redressée)' : ''}.`,
          p
        )
        if (hasPlayedTrigger(card)) {
          s.chain.push({
            uid: s.nextUid++,
            cardId: action.cardId,
            label: `Déclencheur : ${card.name}`,
            controller: p,
            kind: 'trigger',
            scripted: kw.vision,
            script: kw.vision ? 'vision' : undefined,
          })
          s.chainActive = other(p)
          s.chainPasses = 0
          log(s, `Déclencheur de ${card.name} sur la chaîne : « ${card.text} »`, p)
        } else {
          cleanup(s)
        }
      } else if (card.type === 'Gear') {
        const u: UnitEntity = {
          uid: s.nextUid++,
          cardId: action.cardId,
          controller: p,
          kind: 'gear',
          location: 'base',
          ready: true,
          damage: 0,
          buffed: false,
          stunned: false,
          combatRole: null,
          tempMight: 0,
          isChampion: false,
        }
        s.units.push(u)
        log(s, `${pname(s, p)} joue l'équipement ${card.name}.`, p)
        if (hasPlayedTrigger(card)) {
          s.chain.push({
            uid: s.nextUid++,
            cardId: action.cardId,
            label: `Déclencheur : ${card.name}`,
            controller: p,
            kind: 'trigger',
            scripted: false,
          })
          s.chainActive = other(p)
          s.chainPasses = 0
        } else {
          cleanup(s)
        }
      } else if (card.type === 'Spell') {
        s.chain.push({
          uid: s.nextUid++,
          cardId: action.cardId,
          label: card.name,
          controller: p,
          kind: 'spell',
          targets: action.targets,
          scripted: false,
        })
        s.chainActive = other(p)
        s.chainPasses = 0
        if (s.showdown) s.showdown.passes = 0
        log(s, `${pname(s, p)} joue le sort ${card.name} : « ${card.text} »`, p)
      } else {
        throw new IllegalAction(`Type injouable : ${card.type}`)
      }
      return s
    }

    case 'move': {
      if (s.winner !== null) throw new IllegalAction('Partie terminée')
      if (s.turnPlayer !== p || s.phase !== 'action') throw new IllegalAction('Pas votre tour')
      if (s.chain.length > 0 || s.showdown) throw new IllegalAction('Déplacement impossible pendant une chaîne ou un showdown')
      const movers = action.unitUids.map((uid) => s.units.find((u) => u.uid === uid))
      if (movers.some((u) => !u || u.controller !== p || u.kind !== 'unit' || !u.ready))
        throw new IllegalAction('Unités invalides (contrôlées et redressées uniquement)')
      for (const u of movers as UnitEntity[]) {
        const from = u.location
        const to = action.to
        const legal =
          (from === 'base' && typeof to === 'number') ||
          (typeof from === 'number' && to === 'base') ||
          (typeof from === 'number' && typeof to === 'number' && keywords(u.cardId).ganking)
        if (!legal || from === to) throw new IllegalAction('Destination illégale')
      }
      for (const u of movers as UnitEntity[]) {
        u.ready = false
        arriveAt(s, u, action.to)
      }
      const names = (movers as UnitEntity[]).map((u) => def(u.cardId).name).join(', ')
      log(
        s,
        `${pname(s, p)} déplace ${names} vers ${action.to === 'base' ? 'la base' : bfName(s, action.to as number)}.`,
        p
      )
      cleanup(s)
      return s
    }

    case 'hide': {
      if (s.turnPlayer !== p || s.phase !== 'action') throw new IllegalAction('Pas votre tour')
      if (s.chain.length > 0 || s.showdown) throw new IllegalAction('Impossible maintenant')
      const pl = s.players[p]
      if (!pl.hand.includes(action.cardId)) throw new IllegalAction('Carte absente de la main')
      if (!keywords(action.cardId).hidden) throw new IllegalAction('Cette carte n’a pas Hidden')
      const bf = s.battlefields[action.battlefield]
      if (!bf || bf.controller !== p || bf.facedown) throw new IllegalAction('Champ de bataille invalide')
      const identity = def(pl.legendId).domains
      if (availablePower(s, p, identity) < 1) throw new IllegalAction('1 puissance requise')
      payPower(s, p, 1, identity)
      pl.hand.splice(pl.hand.indexOf(action.cardId), 1)
      bf.facedown = { cardId: action.cardId, owner: p, hiddenOnTurn: s.turn }
      log(s, `${pname(s, p)} cache une carte à ${bfName(s, action.battlefield)}.`, p)
      return s
    }

    case 'pass': {
      if (s.chain.length > 0) {
        if (s.chainActive !== p) throw new IllegalAction('Pas la priorité')
        s.chainPasses += 1
        if (s.chainPasses < 2) {
          s.chainActive = other(p)
        } else {
          s.chainActive = s.chain[s.chain.length - 1].controller
          log(s, `La chaîne est verrouillée : ${pname(s, s.chainActive)} résout ${s.chain[s.chain.length - 1].label}.`)
        }
        return s
      }
      if (s.showdown) {
        if (s.showdown.focus !== p) throw new IllegalAction('Pas le focus')
        s.showdown.passes += 1
        if (s.showdown.passes >= 2) {
          endShowdown(s)
        } else {
          s.showdown.focus = other(p)
        }
        return s
      }
      throw new IllegalAction('Rien à passer')
    }

    case 'resolveChainTop': {
      const top = s.chain[s.chain.length - 1]
      if (!top) throw new IllegalAction('Chaîne vide')
      if (s.chainPasses < 2) throw new IllegalAction('Les deux joueurs doivent d’abord passer')
      if (top.controller !== p) throw new IllegalAction('Seul son contrôleur résout cet élément')
      s.chain.pop()
      if (top.script === 'vision') {
        const pl = s.players[p]
        if (action.choice === 'recycle' && pl.deck.length > 0) {
          pl.deck.push(pl.deck.shift()!)
          log(s, `Vision : ${pname(s, p)} recycle la carte du dessus de son deck.`, p)
        } else {
          log(s, `Vision : ${pname(s, p)} garde la carte du dessus.`, p)
        }
      } else if (top.kind === 'spell' && top.cardId) {
        s.players[p].trash.push(top.cardId)
        log(s, `${top.label} est résolu (effets appliqués manuellement) → défausse.`, p)
      } else {
        log(s, `${top.label} est résolu.`, p)
      }
      s.chainPasses = 0
      cleanup(s)
      if (s.chain.length > 0) {
        s.chainActive = s.chain[s.chain.length - 1].controller
      } else {
        s.chainActive = null
        if (s.showdown) {
          s.showdown.focus = other(s.showdown.focus)
          s.showdown.passes = 0
        }
      }
      return s
    }

    case 'chooseCombat': {
      if (s.turnPlayer !== p) throw new IllegalAction('Seul le joueur actif choisit')
      if (s.chain.length > 0 || s.showdown) throw new IllegalAction('Impossible maintenant')
      if (!s.pendingCombat.includes(action.battlefield)) throw new IllegalAction('Pas de combat ici')
      startCombat(s, action.battlefield)
      return s
    }

    case 'endTurn': {
      if (s.turnPlayer !== p || s.phase !== 'action') throw new IllegalAction('Pas votre tour')
      if (s.chain.length > 0 || s.showdown || s.pendingCombat.length > 0)
        throw new IllegalAction('Résolvez la chaîne / le combat d’abord')
      log(s, `${pname(s, p)} termine son tour.`, p)
      endTurn(s)
      return s
    }

    case 'concede': {
      s.winner = other(p)
      s.phase = 'over'
      log(s, `${pname(s, p)} abandonne. 🏆 ${pname(s, other(p))} gagne !`)
      return s
    }

    case 'manual': {
      applyManual(s, p, action.op)
      return s
    }
  }
}
