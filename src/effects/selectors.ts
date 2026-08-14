// Evaluation of IR filters, amounts, conditions and unit references against
// the live game state, relative to an effect context (source + bound vars).
import { def, keywords, unitMight } from '../engine/cardinfo'
import type { GameState, PlayerIx, UnitEntity } from '../engine/types'
import type { Amount, Cond, UnitFilter, UnitRef, Who } from './ir'

export interface EffectCtx {
  /** Card the effect comes from. */
  cardId: string
  /** Board entity of the source, when it is (still) a unit/gear on the board. */
  sourceUid: number | null
  /** Battlefield index when the source is a battlefield card. */
  sourceBattlefield: number | null
  controller: PlayerIx
  /** Unit uid the trigger fired for (died, arrived…), when applicable. */
  eventUid: number | null
  /** Variables bound by choose/forEach: uid lists, indices, locations, flags. */
  vars: Record<string, number | number[] | string[] | boolean | string>
}

export function resolveWho(ctx: EffectCtx, who: Who | undefined): PlayerIx[] {
  const me = ctx.controller
  const opp: PlayerIx = me === 0 ? 1 : 0
  if (who === 'opp') return [opp]
  if (who === 'each') return [me, opp]
  return [me]
}

function sourceLocation(s: GameState, ctx: EffectCtx): 'base' | number | null {
  if (ctx.sourceBattlefield !== null) return ctx.sourceBattlefield
  if (ctx.sourceUid === null) return null
  const u = s.units.find((x) => x.uid === ctx.sourceUid)
  return u ? u.location : null
}

export function matchesFilter(s: GameState, ctx: EffectCtx, u: UnitEntity, f: UnitFilter): boolean {
  if (f.self && u.uid !== ctx.sourceUid) return false
  const kind = f.kind ?? 'unit'
  if (kind !== 'any' && u.kind !== kind) return false
  if (f.controller === 'you' && u.controller !== ctx.controller) return false
  if (f.controller === 'opp' && u.controller === ctx.controller) return false
  const loc = f.location ?? 'anywhere'
  if (loc === 'base' && u.location !== 'base') return false
  if (loc === 'battlefield' && typeof u.location !== 'number') return false
  if (loc === 'here') {
    const here = sourceLocation(s, ctx)
    if (here === null || u.location !== here) return false
  }
  if (f.champion !== undefined && u.isChampion !== f.champion) return false
  if (f.tag && !def(u.cardId).tags.some((t) => t.toLowerCase() === f.tag!.toLowerCase())) return false
  if (f.keyword) {
    const kw = keywords(u.cardId) as unknown as Record<string, unknown>
    const flag = kw[f.keyword.toLowerCase()]
    const hasNative = flag === true || (typeof flag === 'number' && flag > 0)
    const hasUnknown = (kw.unknown as string[]).some((k) => k.toLowerCase().startsWith(f.keyword!.toLowerCase()))
    if (!hasNative && !hasUnknown) return false
  }
  if (f.maxEnergy !== undefined && (def(u.cardId).energy ?? 0) > f.maxEnergy) return false
  if (f.minMight !== undefined && unitMight(u) < f.minMight) return false
  if (f.maxMight !== undefined && unitMight(u) > f.maxMight) return false
  if (f.hasBuff !== undefined && u.buffed !== f.hasBuff) return false
  if (f.damaged !== undefined && (u.damage > 0) !== f.damaged) return false
  if (f.exhausted !== undefined && u.ready === f.exhausted) return false
  if (f.stunned !== undefined && u.stunned !== f.stunned) return false
  if (f.inCombat !== undefined && (u.combatRole !== null) !== f.inCombat) return false
  if (f.attachedToMe) {
    const src2 = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid) : undefined
    if (!src2 || src2.attachedTo !== u.uid) return false
  }
  if (f.hasAttachment !== undefined) {
    const has = s.units.some((g) => g.attachedTo === u.uid)
    if (has !== f.hasAttachment) return false
  }
  if (f.combatRole !== undefined && u.combatRole !== f.combatRole) return false
  if (f.notTag && def(u.cardId).tags.some((t) => t.toLowerCase() === f.notTag!.toLowerCase())) return false
  if (f.atVar !== undefined) {
    const v = ctx.vars[f.atVar]
    const loc = v === 'base' ? 'base' : typeof v === 'number' ? v : undefined
    if (loc === undefined || u.location !== loc) return false
  }
  if (f.atUnitVar !== undefined) {
    const v = ctx.vars[f.atUnitVar]
    const uid = Array.isArray(v) ? (v as number[])[0] : typeof v === 'number' ? v : undefined
    const other = uid !== undefined ? s.units.find((x) => x.uid === uid) : undefined
    if (!other || u.location !== other.location) return false
  }
  if (f.notSelf && u.uid === ctx.sourceUid) return false
  if (f.notVar !== undefined) {
    const v = ctx.vars[f.notVar]
    const excluded = Array.isArray(v) ? (v as number[]) : typeof v === 'number' ? [v] : []
    if (excluded.includes(u.uid)) return false
  }
  return true
}

export function unitsMatching(s: GameState, ctx: EffectCtx, f: UnitFilter): UnitEntity[] {
  return s.units.filter((u) => matchesFilter(s, ctx, u, f))
}

export function resolveUnits(s: GameState, ctx: EffectCtx, ref: UnitRef): UnitEntity[] {
  if ('self' in ref) {
    const u = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid) : undefined
    return u ? [u] : []
  }
  if ('event' in ref) {
    const u = ctx.eventUid !== null ? s.units.find((x) => x.uid === ctx.eventUid) : undefined
    return u ? [u] : []
  }
  if ('all' in ref) return unitsMatching(s, ctx, ref.all)
  const v = ctx.vars[ref.var]
  const uids = Array.isArray(v) ? (v as number[]) : typeof v === 'number' ? [v] : []
  // Mistargeting rule: units gone from the board are silently dropped.
  return uids
    .map((uid) => s.units.find((x) => x.uid === uid))
    .filter((u): u is UnitEntity => u !== undefined)
}

export function evalAmount(s: GameState, ctx: EffectCtx, a: Amount): number {
  if (typeof a === 'number') return a
  if ('count' in a) return unitsMatching(s, ctx, a.count).length
  if ('mightOf' in a) {
    const us = resolveUnits(s, ctx, a.mightOf)
    return us.length > 0 ? unitMight(us[0]) : 0
  }
  if ('handSize' in a) {
    return resolveWho(ctx, a.handSize).reduce((n: number, p) => n + s.players[p].hand.length, 0)
  }
  if ('trashSize' in a) {
    return resolveWho(ctx, a.trashSize).reduce((n: number, p) => n + s.players[p].trash.length, 0)
  }
  if ('pointsOf' in a) {
    return resolveWho(ctx, a.pointsOf).reduce((n: number, p) => n + s.players[p].points, 0)
  }
  if ('runesInPlay' in a) {
    return resolveWho(ctx, a.runesInPlay).reduce((n: number, p) => n + s.players[p].runes.length, 0)
  }
  if ('runeDeckSize' in a) {
    return resolveWho(ctx, a.runeDeckSize).reduce((n: number, p) => n + s.players[p].runeDeck.length, 0)
  }
  if ('negate' in a) return -evalAmount(s, ctx, a.negate)
  if ('maxMightAmong' in a) {
    const ms = unitsMatching(s, ctx, a.maxMightAmong).map((u) => unitMight(u))
    return ms.length > 0 ? Math.max(...ms) : 0
  }
  if ('energyOfBound' in a) {
    const ids = ctx.vars[`${a.energyOfBound}__cards`] as string[] | undefined
    return ids && ids.length > 0 ? (def(ids[0]).energy ?? 0) : 0
  }
  if ('xpOf' in a) {
    return resolveWho(ctx, a.xpOf).reduce((n: number, p) => n + (s.players[p].xp ?? 0), 0)
  }
  return 0
}

export function evalCond(s: GameState, ctx: EffectCtx, c: Cond): boolean {
  if ('legion' in c) return s.cardsPlayedThisTurn[ctx.controller] > 1
  if ('exists' in c) return unitsMatching(s, ctx, c.exists).length > 0
  if ('compare' in c) {
    const [l, cmp, r] = c.compare
    const lv = evalAmount(s, ctx, l)
    const rv = evalAmount(s, ctx, r)
    switch (cmp) {
      case '>=':
        return lv >= rv
      case '<=':
        return lv <= rv
      case '>':
        return lv > rv
      case '<':
        return lv < rv
      case '==':
        return lv === rv
    }
  }
  if ('youControlBattlefield' in c) return s.battlefields.some((bf) => bf.controller === ctx.controller)
  if ('controlsBattlefield' in c) {
    return resolveWho(ctx, c.controlsBattlefield).some((p) => s.battlefields.some((bf) => bf.controller === p))
  }
  if ('selfAt' in c) {
    const loc = sourceLocation(s, ctx)
    return c.selfAt === 'base' ? loc === 'base' : typeof loc === 'number'
  }
  if ('dead' in c) {
    if ('var' in c.dead || 'self' in c.dead || 'event' in c.dead) {
      const us = resolveUnits(s, ctx, c.dead)
      if (us.length === 0) return true
      return us.every((u) => u.damage > 0 && u.damage >= unitMight(u))
    }
    return false
  }
  if ('chose' in c) {
    const v = ctx.vars[c.chose]
    return Array.isArray(v) ? v.length > 0 : Boolean(v)
  }
  if ('var' in c) return Boolean(ctx.vars[c.var])
  if ('onlyFriendlyAt' in c) {
    const us = resolveUnits(s, ctx, c.onlyFriendlyAt)
    if (us.length === 0) return false
    const u = us[0]
    return s.units.filter((x) => x.location === u.location && x.controller === u.controller && x.kind === 'unit').length === 1
  }
  if ('discardedThisTurn' in c) return (s.discardsThisTurn?.[ctx.controller] ?? 0) > 0
  if ('xpAtLeast' in c) return (s.players[ctx.controller].xp ?? 0) >= c.xpAtLeast
  if ('selfEmpowered' in c) {
    const u = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid) : undefined
    return u?.empowered === true
  }
  if ('selfCombatAlone' in c) {
    const u = ctx.sourceUid !== null ? s.units.find((x) => x.uid === ctx.sourceUid) : undefined
    if (!u || u.combatRole === null) return false
    return !s.units.some(
      (x) => x.uid !== u.uid && x.controller === u.controller && x.location === u.location && x.kind === 'unit'
    )
  }
  if ('youHaveFacedown' in c) {
    return s.battlefields.some((bf) => bf.facedown?.owner === ctx.controller && bf.controller === ctx.controller)
  }
  if ('enemyDiedThisTurn' in c) {
    const opp = ctx.controller === 0 ? 1 : 0
    return (s.diedThisTurn?.[opp] ?? 0) > 0
  }
  if ('varEquals' in c) return ctx.vars[c.varEquals[0]] === c.varEquals[1]
  if ('not' in c) return !evalCond(s, ctx, c.not)
  if ('and' in c) return c.and.every((x) => evalCond(s, ctx, x))
  return false
}
