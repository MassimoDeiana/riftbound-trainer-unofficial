// Resumable effect interpreter.
// The execution state (frames, pc, vars) lives INSIDE GameState — pure data,
// structuredClone- and JSON-safe — so P2P lockstep and time travel keep
// working. When an op needs player input the VM suspends by setting
// s.pending; the answering `choose` action resumes it.
import type { Domain } from '../data/cards'
import { def } from '../engine/cardinfo'
import {
  afterChainResolve,
  afterDamage,
  arriveAt,
  fireBoardEvent,
  maybeResumeEnding,
  banishUnit,
  channelRunes,
  cleanup,
  discardCard,
  draw,
  gainPoints,
  giveToUnit,
  IllegalAction,
  killUnit,
  log,
  pname,
  queueTriggersFor,
} from '../engine/core'
import { effKeywords } from '../engine/queries'
import type { GameState, PlayerIx } from '../engine/types'
import { runCustomOp } from './custom'
import type { ChoiceIR, Cost, Op } from './ir'
import { evalAmount, evalCond, resolveUnits, resolveWho, unitsMatching, type EffectCtx } from './selectors'
import { TOKENS } from '../data/tokens'

export interface Frame {
  ops: Op[]
  pc: number
  /** forEach continuation: rebind and restart when the block completes. */
  loopBind?: string
  loopRemaining?: number[]
}

export interface ExecState {
  ctx: EffectCtx
  frames: Frame[]
  /** Continuation when the program completes. */
  done: 'chainResolved' | 'finalizeItem' | 'delayedStep' | 'none'
  chainItemUid?: number
  /** Spell card sent to its owner's trash once execution finishes. */
  trashOnDone?: { player: PlayerIx; cardId: string }
}

/** Start executing a program; returns after completion or suspension. */
export function startProgram(
  s: GameState,
  ctx: EffectCtx,
  ops: Op[],
  done: ExecState['done'],
  chainItemUid?: number,
  opts?: { trashOnDone?: { player: PlayerIx; cardId: string } }
) {
  s.exec = { ctx, frames: [{ ops, pc: 0 }], done, chainItemUid, trashOnDone: opts?.trashOnDone }
  runVm(s)
}

/** Advance the VM until it suspends on a choice or completes. */
export function runVm(s: GameState) {
  const exec = s.exec as ExecState | null
  if (!exec) return
  let guard = 0
  while (guard++ < 500) {
    if (s.winner !== null) {
      s.exec = null
      return
    }
    const frame = exec.frames[exec.frames.length - 1]
    if (!frame) {
      finishProgram(s, exec)
      return
    }
    if (frame.pc >= frame.ops.length) {
      if (frame.loopBind && frame.loopRemaining && frame.loopRemaining.length > 0) {
        exec.ctx.vars[frame.loopBind] = frame.loopRemaining.shift()!
        frame.pc = 0
        continue
      }
      exec.frames.pop()
      continue
    }
    const op = frame.ops[frame.pc]
    const outcome = step(s, exec, frame, op)
    if (outcome === 'suspend') return
  }
  throw new Error('Effect VM did not terminate')
}

function finishProgram(s: GameState, exec: ExecState) {
  const done = exec.done
  const uid = exec.chainItemUid
  s.exec = null
  if (exec.trashOnDone) {
    s.players[exec.trashOnDone.player].trash.push(exec.trashOnDone.cardId)
  }
  if (done === 'finalizeItem' && uid !== undefined) {
    const item = s.chain.find((c) => c.uid === uid)
    if (item) item.targetVars = { ...exec.ctx.vars }
    return
  }
  if (done === 'chainResolved') {
    afterChainResolve(s)
    return
  }
  if (done === 'delayedStep') {
    cleanup(s)
    maybeResumeEnding(s)
    return
  }
  cleanup(s)
}

/** Execute one op. Returns 'suspend' when waiting on a choice. */
function step(s: GameState, exec: ExecState, frame: Frame, op: Op): 'ok' | 'suspend' {
  const ctx = exec.ctx
  const me = ctx.controller

  switch (op.op) {
    case 'choose': {
      const who = resolveWho(ctx, op.who)[0]
      const spec = compileChoice(s, ctx, op.spec, who)
      if (spec === null) {
        // Nothing to choose (no legal options / empty zone): bind empty, move on.
        ctx.vars[op.bind] = []
        frame.pc++
        return 'ok'
      }
      s.pending = { player: who, spec, vm: { bind: op.bind, optional: op.optional ?? false } }
      return 'suspend'
    }

    case 'deal': {
      const n = evalAmount(s, ctx, op.n)
      for (const u of resolveUnits(s, ctx, op.to)) {
        if (u.kind !== 'unit') continue
        u.damage += n
        log(s, `${def(ctx.cardId).name} inflige ${n} dégât(s) à ${def(u.cardId).name}.`)
        afterDamage(s, u.uid)
      }
      break
    }
    case 'kill':
      for (const u of resolveUnits(s, ctx, op.target)) killUnit(s, u.uid, def(ctx.cardId).name)
      break
    case 'stun': {
      let stunnedAny = false
      for (const u of resolveUnits(s, ctx, op.target)) {
        if (!u.stunned) {
          u.stunned = true
          stunnedAny = true
          log(s, `${def(u.cardId).name} est étourdi par ${def(ctx.cardId).name}.`)
        }
      }
      if (stunnedAny) fireBoardEvent(s, me, 'youStun')
      break
    }
    case 'buff': {
      let buffedAny = false
      for (const u of resolveUnits(s, ctx, op.target)) {
        if (!u.buffed) {
          u.buffed = true
          buffedAny = true
          log(s, `${def(u.cardId).name} reçoit un buff (+1 ⚔️).`)
        }
      }
      if (buffedAny) fireBoardEvent(s, me, 'youBuff')
      break
    }
    case 'heal':
      for (const u of resolveUnits(s, ctx, op.target)) {
        u.damage = op.n === 'all' ? 0 : Math.max(0, u.damage - evalAmount(s, ctx, op.n))
      }
      break
    case 'ready':
      for (const u of resolveUnits(s, ctx, op.target)) u.ready = true
      break
    case 'exhaust':
      for (const u of resolveUnits(s, ctx, op.target)) u.ready = false
      break
    case 'recall':
      for (const u of resolveUnits(s, ctx, op.target)) {
        u.location = 'base'
        u.combatRole = null
        log(s, `${def(u.cardId).name} est rappelé à la base.`)
      }
      break
    case 'banish':
      for (const u of resolveUnits(s, ctx, op.target)) banishUnit(s, u.uid)
      break
    case 'returnToHand':
      for (const u of resolveUnits(s, ctx, op.target)) {
        const ix = s.units.findIndex((x) => x.uid === u.uid)
        if (ix >= 0) {
          s.units.splice(ix, 1)
          const owner = u.owner ?? u.controller
          if (!u.isToken) s.players[owner].hand.push(u.cardId)
          log(s, `${def(u.cardId).name} retourne dans la main de ${pname(s, owner)}.`)
        }
      }
      break
    case 'give': {
      const might = op.might !== undefined ? evalAmount(s, ctx, op.might) : 0
      for (const u of resolveUnits(s, ctx, op.target)) {
        giveToUnit(s, u, might, op.keywords ?? [], op.duration)
      }
      break
    }
    case 'moveTo': {
      let dest: 'base' | number | undefined
      if (op.to === 'base') dest = 'base'
      else if (op.to === 'here') {
        dest = ctx.sourceUid !== null ? (s.units.find((x) => x.uid === ctx.sourceUid)?.location as 'base' | number | undefined) : undefined
      } else if ('atUnit' in op.to) {
        const v = ctx.vars[op.to.atUnit]
        const uid = Array.isArray(v) ? (v as number[])[0] : typeof v === 'number' ? v : undefined
        dest = uid !== undefined ? (s.units.find((x) => x.uid === uid)?.location as 'base' | number | undefined) : undefined
      } else {
        const v = ctx.vars[op.to.var]
        dest = v === 'base' ? 'base' : typeof v === 'number' ? v : undefined
      }
      if (dest !== undefined) {
        for (const u of resolveUnits(s, ctx, op.target)) {
          const from = u.location
          arriveAt(s, u, dest)
          if (op.ready) u.ready = true
          log(s, `${def(u.cardId).name} est déplacé vers ${dest === 'base' ? 'la base' : def(s.battlefields[dest].cardId).name}.`)
          queueTriggersFor(s, u.cardId, u.controller, 'move', { sourceUid: u.uid })
          if (typeof from === 'number') {
            queueTriggersFor(s, s.battlefields[from].cardId, u.controller, 'moveFromHere', {
              sourceUid: null,
              sourceBattlefield: from,
              eventUid: u.uid,
            })
          }
        }
      }
      break
    }

    case 'draw': {
      let players: PlayerIx[]
      if (op.who !== undefined && typeof op.who === 'object') {
        const us = resolveUnits(s, ctx, { var: op.who.controllerOf })
        players = us.length > 0 ? [us[0].controller] : []
      } else {
        players = resolveWho(ctx, op.who)
      }
      for (const p of players) {
        const n = evalAmount(s, ctx, op.n)
        draw(s, p, n)
        log(s, `${pname(s, p)} pioche ${n}.`, p)
      }
      break
    }
    case 'discard': {
      // The discarding player chooses which cards: modelled as a choose over
      // their hand followed by the actual discard (handled on resume).
      const p = resolveWho(ctx, op.who)[0]
      const n = Math.min(evalAmount(s, ctx, op.n), s.players[p].hand.length)
      if (n <= 0) break
      const spec = { kind: 'card' as const, zone: 'hand' as const, player: p, legal: s.players[p].hand.map((_, i) => i), min: n, max: n, prompt: `Défausse ${n} carte(s)` }
      s.pending = { player: p, spec, vm: { bind: '__discard', optional: false, thenDiscard: p } }
      return 'suspend'
    }
    case 'addEnergy':
      for (const p of resolveWho(ctx, op.who)) {
        s.players[p].pool.energy += evalAmount(s, ctx, op.n)
      }
      break
    case 'addPower': {
      for (const p of resolveWho(ctx, op.who)) {
        const n = evalAmount(s, ctx, op.n)
        const domain: Domain | 'Universal' =
          op.domain === 'any' || op.domain === 'identity'
            ? op.domain === 'identity'
              ? ((def(s.players[p].legendId).domains[0] ?? 'Universal') as Domain)
              : 'Universal'
            : op.domain
        s.players[p].pool.power[domain] = (s.players[p].pool.power[domain] ?? 0) + n
      }
      break
    }
    case 'channel':
      for (const p of resolveWho(ctx, op.who)) {
        channelRunes(s, p, evalAmount(s, ctx, op.n), op.exhausted ?? false)
      }
      break
    case 'gainPoints':
      for (const p of resolveWho(ctx, op.who)) gainPoints(s, p, evalAmount(s, ctx, op.n))
      break
    case 'gainXp':
      for (const p of resolveWho(ctx, op.who)) {
        const n = evalAmount(s, ctx, op.n)
        s.players[p].xp = Math.max(0, (s.players[p].xp ?? 0) + n)
        log(s, `${pname(s, p)} ${n >= 0 ? 'gagne' : 'dépense'} ${Math.abs(n)} XP (total ${s.players[p].xp}).`, p)
      }
      break

    case 'toHandFromTrash': {
      const picks = (ctx.vars[op.bind] as number[] | undefined) ?? []
      const trash = s.players[me].trash
      const cards = picks.map((i) => trash[i]).filter((c): c is string => c !== undefined)
      for (const c of cards) {
        trash.splice(trash.indexOf(c), 1)
        s.players[me].hand.push(c)
        log(s, `${def(c).name} revient de la défausse en main.`, me)
      }
      break
    }
    case 'recycleFromTrash': {
      const picks = (ctx.vars[op.bind] as number[] | undefined) ?? []
      const trash = s.players[me].trash
      const cards = picks.map((i) => trash[i]).filter((c): c is string => c !== undefined)
      for (const c of cards) {
        trash.splice(trash.indexOf(c), 1)
        s.players[me].deck.push(c)
        log(s, `${def(c).name} est recyclé sous le deck.`, me)
      }
      if (cards.length > 0) fireBoardEvent(s, me, 'youRecycle')
      break
    }
    case 'recycleFromHand': {
      const p = resolveWho(ctx, op.who)[0]
      const ids = (ctx.vars[`${op.bind}__cards`] as string[] | undefined) ?? []
      for (const c of ids) {
        const ix = s.players[p].hand.indexOf(c)
        if (ix >= 0) {
          s.players[p].hand.splice(ix, 1)
          s.players[p].deck.push(c)
          log(s, `${def(c).name} est recyclé sous le deck de ${pname(s, p)}.`, p)
        }
      }
      break
    }
    case 'discardBound': {
      const p = resolveWho(ctx, op.who)[0]
      const ids = (ctx.vars[`${op.bind}__cards`] as string[] | undefined) ?? []
      for (const c of ids) {
        if (s.players[p].hand.includes(c)) discardCard(s, p, c)
      }
      break
    }
    case 'selfFromTrash': {
      const trash = s.players[me].trash
      const ix = trash.indexOf(ctx.cardId)
      if (ix < 0) break
      trash.splice(ix, 1)
      if (op.to === 'hand') {
        s.players[me].hand.push(ctx.cardId)
        log(s, `${def(ctx.cardId).name} revient de la défausse en main.`, me)
      } else {
        s.players[me].deck.push(ctx.cardId)
        log(s, `${def(ctx.cardId).name} est recyclé sous le deck.`, me)
        fireBoardEvent(s, me, 'youRecycle')
      }
      break
    }
    case 'takeControl': {
      for (const u of resolveUnits(s, ctx, op.target)) {
        u.owner = u.owner ?? u.controller
        u.controller = me
        if (op.recall !== false) {
          u.location = 'base'
          u.combatRole = null
        }
        log(s, `${pname(s, me)} prend le contrôle de ${def(u.cardId).name}.`, me)
      }
      break
    }
    case 'championFromTrashToZone': {
      const pl = s.players[me]
      const ix = pl.trash.indexOf(pl.championId)
      if (ix >= 0 && !pl.championInZone) {
        pl.trash.splice(ix, 1)
        pl.championInZone = true
        log(s, `${def(pl.championId).name} retourne dans la zone de champion.`, me)
      }
      break
    }
    case 'attachSelfTo': {
      const src2 = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid) : undefined
      const v = ctx.vars[op.bind]
      const uid = Array.isArray(v) ? (v as number[])[0] : typeof v === 'number' ? v : undefined
      const target = uid !== undefined ? s.units.find((x) => x.uid === uid) : undefined
      if (src2 && target) {
        src2.attachedTo = target.uid
        src2.location = target.location
        log(s, `${def(src2.cardId).name} est attaché à ${def(target.cardId).name}.`)
      }
      break
    }
    case 'attachBoundToSelf': {
      const self = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid) : undefined
      const v = ctx.vars[op.bind]
      const uid = Array.isArray(v) ? (v as number[])[0] : typeof v === 'number' ? v : undefined
      const gear = uid !== undefined ? s.units.find((x) => x.uid === uid) : undefined
      if (self && gear && gear.kind === 'gear') {
        gear.attachedTo = self.uid
        gear.location = self.location
        log(s, `${def(gear.cardId).name} est attaché à ${def(self.cardId).name}.`)
      }
      break
    }
    case 'revealTopRune': {
      const pl = s.players[me]
      const top = pl.runeDeck.shift()
      if (!top) {
        ctx.vars[op.bind] = ''
        break
      }
      const domain = def(top).domains[0] ?? ''
      pl.runeDeck.push(top)
      ctx.vars[op.bind] = domain
      log(s, `${pname(s, me)} révèle ${def(top).name} (${domain}) et la recycle.`, me)
      break
    }
    case 'vision': {
      if (s.players[me].deck.length === 0) break
      s.pending = {
        player: me,
        spec: { kind: 'vision' },
        vm: { bind: '__vision', optional: false },
      }
      return 'suspend'
    }
    case 'playToken': {
      const tokenDef = TOKENS[op.token]
      if (!tokenDef) break
      const n = op.n !== undefined ? evalAmount(s, ctx, op.n) : 1
      const p = resolveWho(ctx, op.who)[0]
      const here = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid)?.location : undefined
      const where = op.where === 'here' && here !== undefined ? here : 'base'
      for (let i = 0; i < n; i++) {
        s.units.push({
          uid: s.nextUid++,
          cardId: tokenDef.cardId,
          controller: p,
          kind: tokenDef.kind,
          location: where,
          ready: !(op.exhausted ?? false),
          damage: 0,
          buffed: false,
          stunned: false,
          combatRole: null,
          tempMight: 0,
          isChampion: false,
          grants: [],
          isToken: true,
        })
      }
      log(s, `${pname(s, p)} crée ${n} jeton(s) ${tokenDef.name}.`, p)
      break
    }

    case 'if': {
      const branch = evalCond(s, ctx, op.cond) ? op.then : (op.else ?? [])
      frame.pc++
      exec.frames.push({ ops: branch, pc: 0 })
      return 'ok'
    }
    case 'forEach': {
      const uids = unitsMatching(s, ctx, op.over).map((u) => u.uid)
      frame.pc++
      if (uids.length === 0) return 'ok'
      const first = uids.shift()!
      ctx.vars[op.bind] = first
      exec.frames.push({ ops: op.ops, pc: 0, loopBind: op.bind, loopRemaining: uids })
      return 'ok'
    }
    case 'mode': {
      const picks = ctx.vars.__mode as number[] | undefined
      if (picks === undefined) {
        s.pending = {
          player: me,
          spec: { kind: 'mode', options: op.options.map((o) => o.label), n: op.n },
          vm: { bind: '__mode', optional: false },
        }
        return 'suspend'
      }
      delete ctx.vars.__mode
      frame.pc++
      const ops = picks.flatMap((i) => op.options[i]?.ops ?? [])
      exec.frames.push({ ops, pc: 0 })
      return 'ok'
    }

    case 'unbuff':
      for (const u of resolveUnits(s, ctx, op.target)) {
        if (u.buffed) {
          u.buffed = false
          log(s, `Le buff de ${def(u.cardId).name} est dépensé.`)
        }
      }
      break
    case 'readyRunes': {
      const n = evalAmount(s, ctx, op.n)
      for (const p of resolveWho(ctx, op.who)) {
        let left = n
        for (const r of s.players[p].runes) {
          if (left <= 0) break
          if (!r.ready) {
            r.ready = true
            left--
          }
        }
        if (left < n) log(s, `${pname(s, p)} redresse ${n - left} rune(s).`, p)
      }
      break
    }
    case 'counterSpell': {
      // The countered spell is the current top of the chain (this spell
      // already popped). Countered cards go to the trash un-played.
      const target = s.chain[s.chain.length - 1]
      if (!target || target.kind !== 'spell' || !target.cardId) break
      const d = def(target.cardId)
      if (op.maxEnergy !== undefined && (d.energy ?? 0) > op.maxEnergy) break
      if (op.maxPower !== undefined && (d.power ?? 0) > op.maxPower) break
      s.chain.pop()
      s.players[target.controller].trash.push(target.cardId)
      log(s, `${target.label} est contré → défausse (sans effet).`, target.controller)
      break
    }

    case 'lookTop': {
      const pl = s.players[me]
      const n = Math.min(op.n, pl.deck.length)
      if (n === 0) break
      // The keep-choice is served as a card pick over the top N deck indices.
      const spec = {
        kind: 'card' as const,
        zone: 'deck' as const,
        player: me,
        legal: Array.from({ length: n }, (_, i) => i),
        min: Math.min(op.keep, n),
        max: Math.min(op.keep, n),
        prompt: `Garde ${Math.min(op.keep, n)} carte(s) sur le dessus`,
      }
      s.pending = {
        player: me,
        spec,
        vm: { bind: '__lookTop', optional: false, lookTop: { n, keep: op.keep, rest: op.rest } },
      }
      return 'suspend'
    }
    case 'atEndOfTurn': {
      s.delayed = s.delayed ?? []
      s.delayed.push({ ctx: { ...ctx, vars: { ...ctx.vars } }, ops: op.ops })
      log(s, `Effet programmé pour la fin du tour (${def(ctx.cardId).name}).`)
      break
    }
    case 'winGame': {
      const p = resolveWho(ctx, op.who)[0]
      s.winner = p
      s.phase = 'over'
      s.pending = null
      log(s, `🏆 ${pname(s, p)} gagne la partie (${def(ctx.cardId).name}) !`)
      break
    }
    case 'extraTurn': {
      const p = resolveWho(ctx, op.who)[0]
      s.turnQueue.unshift(p)
      log(s, `${pname(s, p)} jouera un tour supplémentaire après celui-ci.`, p)
      break
    }
    case 'banishSpell': {
      if (exec.trashOnDone) {
        s.players[exec.trashOnDone.player].banishment.push(exec.trashOnDone.cardId)
        log(s, `${def(exec.trashOnDone.cardId).name} est banni.`, exec.trashOnDone.player)
        exec.trashOnDone = undefined
      }
      break
    }

    case 'unitsEnterReadyThisTurn': {
      s.entryReady = s.entryReady ?? [0, 0]
      if (op.n === undefined) s.entryReady[me] = -1
      else if (s.entryReady[me] >= 0) s.entryReady[me] += op.n
      log(s, `Les prochaines unités de ${pname(s, me)} entrent redressées ce tour.`, me)
      break
    }
    case 'playUnitsFromTrash': {
      const picks = (ctx.vars[op.bind] as number[] | undefined) ?? []
      const trash = s.players[me].trash
      const cards = picks.map((i) => trash[i]).filter((c): c is string => c !== undefined)
      for (const c of cards) {
        trash.splice(trash.indexOf(c), 1)
        s.units.push({
          uid: s.nextUid++,
          cardId: c,
          controller: me,
          kind: def(c).type === 'Gear' ? 'gear' : 'unit',
          location: 'base',
          ready: op.exhausted === false,
          damage: 0,
          buffed: false,
          stunned: false,
          combatRole: null,
          tempMight: 0,
          isChampion: false,
          grants: [],
        })
        log(s, `${pname(s, me)} joue ${def(c).name} depuis sa défausse.`, me)
      }
      break
    }
    case 'playSelfFromTrash': {
      const trash = s.players[me].trash
      const ix = trash.indexOf(ctx.cardId)
      if (ix < 0) break
      trash.splice(ix, 1)
      s.units.push({
        uid: s.nextUid++,
        cardId: ctx.cardId,
        controller: me,
        kind: def(ctx.cardId).type === 'Gear' ? 'gear' : 'unit',
        location: 'base',
        ready: false,
        damage: 0,
        buffed: false,
        stunned: false,
        combatRole: null,
        tempMight: 0,
        isChampion: false,
        grants: [],
      })
      log(s, `${pname(s, me)} joue ${def(ctx.cardId).name} depuis sa défausse.`, me)
      break
    }
    case 'watch': {
      s.watchers = s.watchers ?? []
      for (const u of resolveUnits(s, ctx, op.target)) {
        s.watchers.push({ uid: u.uid, kind: op.kind, source: ctx.cardId })
        log(
          s,
          op.kind === 'preventDeathHeal'
            ? `${def(u.cardId).name} : la prochaine fois qu'elle mourrait ce tour, elle est soignée à la place.`
            : `${def(u.cardId).name} : la prochaine fois qu'elle subit des dégâts ce tour, elle est tuée.`
        )
      }
      break
    }

    case 'custom':
      runCustomOp(op.id, s, ctx)
      break
  }

  frame.pc++
  return 'ok'
}

// ---------------------------------------------------------------- choices

type EngineSpec = NonNullable<GameState['pending']>['spec']

/** Compile an IR choice into an engine ChoiceSpec with concrete legal options.
 *  Returns null when there is nothing to choose. */
export function compileChoice(s: GameState, ctx: EffectCtx, spec: ChoiceIR, chooser?: PlayerIx): EngineSpec | null {
  switch (spec.kind) {
    case 'unit': {
      // Deflect (809): the tax is a cost to choose — an enemy Deflect unit the
      // chooser cannot afford is not a legal pick at all.
      const who = chooser ?? ctx.controller
      const powerTotal = Object.values(s.players[who].pool.power).reduce((a, b) => a + (b ?? 0), 0)
      const legal = unitsMatching(s, ctx, spec.filter)
        .filter((u) => u.controller === who || effKeywords(s, u).deflect <= powerTotal)
        .map((u) => u.uid)
      if (legal.length === 0) return null
      const max = Math.min(spec.max, legal.length)
      const min = Math.min(spec.min, legal.length)
      return { kind: 'unit', legal, min, max }
    }
    case 'card': {
      const p = resolveWho(ctx, spec.who)[0]
      const zone = spec.zone === 'hand' ? s.players[p].hand : s.players[p].trash
      const legal = zone
        .map((cardId, i) => ({ cardId, i }))
        .filter(({ cardId }) => {
          if (!spec.filter) return true
          const d = def(cardId)
          if (spec.filter.type && !spec.filter.type.includes(d.type as 'Unit' | 'Spell' | 'Gear')) return false
          if (spec.filter.maxEnergy !== undefined && (d.energy ?? 0) > spec.filter.maxEnergy) return false
          if (spec.filter.tag && !d.tags.some((t) => t.toLowerCase() === spec.filter!.tag!.toLowerCase())) return false
          if (spec.filter.domain && !d.domains.includes(spec.filter.domain)) return false
          return true
        })
        .map(({ i }) => i)
      if (legal.length === 0) return null
      const max = Math.min(spec.max, legal.length)
      const min = Math.min(spec.min, legal.length)
      return { kind: 'card', zone: spec.zone, player: p, legal, min, max }
    }
    case 'mode':
      return { kind: 'mode', options: spec.options, n: spec.n }
    case 'mayPay':
      return { kind: 'yesNo', prompt: spec.prompt }
    case 'yesNo':
      return { kind: 'yesNo', prompt: spec.prompt }
    case 'battlefieldPick':
      return { kind: 'location', options: s.battlefields.map((_, ix) => ix) }
    case 'location': {
      const us = resolveUnits(s, ctx, spec.forUnit)
      if (us.length === 0) return null
      const current = us[0].location
      const options: ('base' | number)[] = ['base', ...s.battlefields.map((_, ix) => ix)].filter(
        (loc) => spec.allowSame || loc !== current
      ) as ('base' | number)[]
      if (options.length === 0) return null
      return { kind: 'location', options }
    }
  }
}

// ---------------------------------------------------------------- costs

export function canPayCost(s: GameState, p: PlayerIx, sourceUid: number | null, cost: Cost): boolean {
  const pl = s.players[p]
  const u = sourceUid !== null ? s.units.find((x) => x.uid === sourceUid) : undefined
  if (cost.exhaustSelf && (!u || !u.ready)) return false
  if (cost.killSelf && !u) return false
  if (cost.spendBuffSelf && (!u || !u.buffed)) return false
  if ((cost.energy ?? 0) > pl.pool.energy) return false
  if (cost.power) {
    const { n, domain } = cost.power
    let available = 0
    const pool = pl.pool.power
    if (domain === 'any') available = Object.values(pool).reduce((a, b) => a + (b ?? 0), 0)
    else if (domain === 'identity') {
      for (const d of def(pl.legendId).domains) available += pool[d] ?? 0
      available += pool.Universal ?? 0
    } else available = (pool[domain] ?? 0) + (pool.Universal ?? 0)
    if (available < n) return false
  }
  if ((cost.discard ?? 0) > pl.hand.length) return false
  return true
}

/** Pay every non-choice part of a cost. Discard costs are paid via a VM
 *  choose that the caller prepends to the program. */
export function payCostNow(s: GameState, p: PlayerIx, sourceUid: number | null, cost: Cost) {
  const pl = s.players[p]
  const u = sourceUid !== null ? s.units.find((x) => x.uid === sourceUid) : undefined
  if (cost.exhaustSelf && u) u.ready = false
  if (cost.spendBuffSelf && u) u.buffed = false
  if (cost.energy) pl.pool.energy -= cost.energy
  if (cost.power) {
    const { n, domain } = cost.power
    let need = n
    const pool = pl.pool.power
    const spendFrom = (d: Domain | 'Universal') => {
      const use = Math.min(pool[d] ?? 0, need)
      pool[d] = (pool[d] ?? 0) - use
      need -= use
    }
    if (domain === 'any') {
      for (const d of Object.keys(pool) as (Domain | 'Universal')[]) {
        if (d !== 'Universal') spendFrom(d)
        if (need === 0) break
      }
      if (need > 0) spendFrom('Universal')
    } else if (domain === 'identity') {
      for (const d of def(pl.legendId).domains) {
        spendFrom(d)
        if (need === 0) break
      }
      if (need > 0) spendFrom('Universal')
    } else {
      spendFrom(domain)
      if (need > 0) spendFrom('Universal')
    }
  }
  if (cost.killSelf && u) killUnit(s, u.uid, 'coût')
}

// ---------------------------------------------------------------- choose answers

/** Validate + apply a `choose` answer addressed to the VM, then resume. */
export function answerVmChoice(s: GameState, value: unknown) {
  const pending = s.pending
  const exec = s.exec as ExecState | null
  if (!pending || !('vm' in pending) || !pending.vm || !exec) throw new IllegalAction('Aucun choix VM en attente')
  const spec = pending.spec
  const vmMeta = pending.vm
  const v = value as { kind: string; uids?: number[]; indices?: number[]; picks?: number[]; yes?: boolean; recycle?: boolean }

  if (spec.kind === 'unit') {
    if (v.kind !== 'unit' || !Array.isArray(v.uids)) throw new IllegalAction('Réponse invalide')
    const picks = [...new Set(v.uids)]
    if (!picks.every((uid) => spec.legal.includes(uid))) throw new IllegalAction('Cible illégale')
    const min = vmMeta.optional ? 0 : spec.min
    if (picks.length < min || picks.length > spec.max) throw new IllegalAction(`Choisis entre ${min} et ${spec.max} cible(s)`)
    // Deflect (809): choosing an opposing Deflect unit costs extra Power (any domain).
    const chooser = pending.player
    let tax = 0
    for (const uid of picks) {
      const u = s.units.find((x) => x.uid === uid)
      if (u && u.controller !== chooser) tax += effKeywords(s, u).deflect
    }
    if (tax > 0) {
      const pool = s.players[chooser].pool
      const total = Object.values(pool.power).reduce((a, b) => a + (b ?? 0), 0)
      if (total < tax) throw new IllegalAction(`Deflect : ${tax} puissance requise pour choisir ces cibles`)
      let need = tax
      for (const d of Object.keys(pool.power) as (keyof typeof pool.power)[]) {
        const use = Math.min(pool.power[d] ?? 0, need)
        pool.power[d] = (pool.power[d] ?? 0) - use
        need -= use
        if (need === 0) break
      }
      log(s, `${pname(s, chooser)} paie ${tax} puissance (Deflect).`, chooser)
    }
    exec.ctx.vars[vmMeta.bind] = picks
  } else if (spec.kind === 'card') {
    if (v.kind !== 'card' || !Array.isArray(v.indices)) throw new IllegalAction('Réponse invalide')
    const picks = [...new Set(v.indices)]
    if (!picks.every((i) => spec.legal.includes(i))) throw new IllegalAction('Carte illégale')
    if (picks.length < spec.min || picks.length > spec.max) throw new IllegalAction(`Choisis ${spec.min} carte(s)`)
    if (vmMeta.lookTop !== undefined) {
      // Keep the picked cards on top (in pick order); recycle/trash the rest.
      const me2 = pending.player
      const pl = s.players[me2]
      const { n, rest } = vmMeta.lookTop
      const top = pl.deck.splice(0, Math.min(n, pl.deck.length))
      const kept = picks.map((i) => top[i]).filter((c): c is string => c !== undefined)
      const others = top.filter((_, i) => !picks.includes(i))
      pl.deck.unshift(...kept)
      if (rest === 'recycle') pl.deck.push(...others)
      else pl.trash.push(...others)
      log(s, `${pname(s, me2)} regarde le dessus de son deck (${top.length} carte(s)).`, me2)
    } else if (vmMeta.thenDiscard !== undefined) {
      const p = vmMeta.thenDiscard
      const hand = s.players[p].hand
      const cards = picks.map((i) => hand[i]).filter((c): c is string => c !== undefined)
      for (const c of cards) discardCard(s, p, c)
    } else {
      exec.ctx.vars[vmMeta.bind] = picks
      const zoneArr =
        spec.zone === 'hand'
          ? s.players[spec.player].hand
          : spec.zone === 'deck'
            ? s.players[spec.player].deck
            : s.players[spec.player].trash
      exec.ctx.vars[`${vmMeta.bind}__cards`] = picks.map((i) => zoneArr[i]).filter((c): c is string => c !== undefined)
    }
  } else if (spec.kind === 'mode') {
    if (v.kind !== 'mode' || !Array.isArray(v.picks)) throw new IllegalAction('Réponse invalide')
    const picks = [...new Set(v.picks)]
    if (picks.length !== spec.n || !picks.every((i) => i >= 0 && i < spec.options.length))
      throw new IllegalAction(`Choisis ${spec.n} mode(s)`)
    exec.ctx.vars[vmMeta.bind] = picks
  } else if (spec.kind === 'yesNo') {
    if (v.kind !== 'yesNo' || typeof v.yes !== 'boolean') throw new IllegalAction('Réponse invalide')
    exec.ctx.vars[vmMeta.bind] = v.yes
  } else if (spec.kind === 'location') {
    const lv = value as { kind: string; loc?: 'base' | number }
    if (lv.kind !== 'location' || lv.loc === undefined || !spec.options.includes(lv.loc))
      throw new IllegalAction('Destination invalide')
    exec.ctx.vars[vmMeta.bind] = lv.loc
  } else if (spec.kind === 'vision') {
    if (v.kind !== 'vision') throw new IllegalAction('Réponse invalide')
    const me = pending.player
    const pl = s.players[me]
    if (v.recycle && pl.deck.length > 0) {
      pl.deck.push(pl.deck.shift()!)
      log(s, `Vision : ${pname(s, me)} recycle la carte du dessus de son deck.`, me)
      fireBoardEvent(s, me, 'youRecycle')
    } else {
      log(s, `Vision : ${pname(s, me)} garde la carte du dessus.`, me)
    }
  } else {
    throw new IllegalAction('Réponse inattendue')
  }

  s.pending = null
  // Advance past the suspended op and keep running.
  const frame = exec.frames[exec.frames.length - 1]
  if (frame) frame.pc++
  runVm(s)
}
