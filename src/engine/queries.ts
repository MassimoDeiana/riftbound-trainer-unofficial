// Derived-state queries: effective Might and keywords, folding base card
// data + buffs + granted effects + scripted auras. Never cached in state.
import { def, keywords, type Keywords } from './cardinfo'
import type { GameState, PlayerIx, UnitEntity } from './types'
import { scriptFor } from '../effects/registry'
import { evalAmount, evalCond, matchesFilter, type EffectCtx } from '../effects/selectors'

/**
 * Effective Energy cost of playing a card (self costMod passives).
 * Evaluated with a hand-context (no board source).
 */
export function effectiveEnergyCost(s: GameState, p: PlayerIx, cardId: string): number {
  const played = def(cardId)
  let cost = played.energy ?? 0
  // Self cost mods (from the card's own script, evaluated from hand).
  const script = scriptFor(cardId)
  for (const ab of script?.abilities ?? []) {
    if (ab.kind !== 'passive' || ab.effect.kind !== 'costMod' || ab.effect.appliesTo !== 'self') continue
    const eff = ab.effect
    const ctx: EffectCtx = { cardId, sourceUid: null, sourceBattlefield: null, controller: p, eventUid: null, vars: {} }
    if (eff.while !== undefined && !evalCond(s, ctx, eff.while)) continue
    cost += evalAmount(s, ctx, eff.energyDelta)
    if (eff.minEnergy !== undefined) cost = Math.max(eff.minEnergy, cost)
  }
  // Board auras modifying costs of your cards ("your spells cost 1 less").
  for (const src of s.units) {
    if (src.controller !== p) continue
    const sc = scriptFor(src.cardId)
    for (const ab of sc?.abilities ?? []) {
      if (ab.kind !== 'passive' || ab.effect.kind !== 'costMod') continue
      const eff = ab.effect
      if (eff.appliesTo === 'self') continue
      const f = eff.appliesTo.cards
      if (f.type && !f.type.includes(played.type as 'Unit' | 'Spell' | 'Gear')) continue
      if (f.maxEnergy !== undefined && (played.energy ?? 0) > f.maxEnergy) continue
      if (f.tag && !played.tags.some((t) => t.toLowerCase() === f.tag!.toLowerCase())) continue
      if (f.domain && !played.domains.includes(f.domain)) continue
      const ctx: EffectCtx = { cardId: src.cardId, sourceUid: src.uid, sourceBattlefield: null, controller: p, eventUid: null, vars: {} }
      if (eff.while !== undefined && !evalCond(s, ctx, eff.while)) continue
      cost += evalAmount(s, ctx, eff.energyDelta)
      if (eff.minEnergy !== undefined) cost = Math.max(eff.minEnergy, cost)
    }
  }
  return Math.max(0, cost)
}

/** Parse granted keyword strings ("Assault 3", "Tank", …) into a partial Keywords. */
function parseGrantKw(list: string[]): Partial<Keywords> {
  const out: Partial<Keywords> = {}
  for (const k of list) {
    const m = k.match(/^([A-Za-z-]+)\s*(\d+)?/)
    if (!m) continue
    const name = m[1].toLowerCase()
    const x = m[2] ? parseInt(m[2], 10) : 1
    if (name === 'assault') out.assault = (out.assault ?? 0) + x
    else if (name === 'shield') out.shield = (out.shield ?? 0) + x
    else if (name === 'tank') out.tank = true
    else if (name === 'ganking') out.ganking = true
    else if (name === 'temporary') out.temporary = true
    else if (name === 'deflect') out.deflect = (out.deflect ?? 0) + x
    else if (name === 'legion') out.legion = true
  }
  return out
}

function auraCtx(sourceUid: number | null, sourceBattlefield: number | null, controller: 0 | 1): EffectCtx {
  return { cardId: '', sourceUid, sourceBattlefield, controller, eventUid: null, vars: {} }
}

interface Aura {
  might: number
  keywords: string[]
  appliesTo: (u: UnitEntity) => boolean
}

/** Collect active scripted auras from board units/gear and battlefields. */
function activeAuras(s: GameState): Aura[] {
  const out: Aura[] = []
  for (const src of s.units) {
    const script = scriptFor(src.cardId)
    if (!script?.abilities) continue
    // Equipment rules text is Inactive unless attached (720).
    if (src.kind === 'gear' && script.equip && (src.attachedTo === undefined || src.attachedTo === null)) continue
    for (const ab of script.abilities) {
      if (ab.kind !== 'passive') continue
      const ctx: EffectCtx = {
        cardId: src.cardId,
        sourceUid: src.uid,
        sourceBattlefield: null,
        controller: src.controller,
        eventUid: null,
        vars: {},
      }
      if (ab.while && !evalCond(s, ctx, ab.while)) continue
      const eff = ab.effect
      if (eff.kind === 'mightAura') {
        out.push({ might: eff.amount, keywords: [], appliesTo: (u) => matchesFilter(s, ctx, u, eff.targets) })
      } else if (eff.kind === 'grantKeywords') {
        out.push({ might: 0, keywords: eff.keywords, appliesTo: (u) => matchesFilter(s, ctx, u, eff.targets) })
      } else if (eff.kind === 'selfMight') {
        if (eff.while === undefined || evalCond(s, ctx, eff.while)) {
          const amount = typeof eff.amount === 'number' ? eff.amount : evalAmount(s, ctx, eff.amount)
          out.push({ might: amount, keywords: [], appliesTo: (u) => u.uid === src.uid })
        }
      }
    }
  }
  s.battlefields.forEach((bf, ix) => {
    const script = scriptFor(bf.cardId)
    if (!script?.abilities) return
    for (const ab of script.abilities) {
      if (ab.kind !== 'passive') continue
      const ctx = auraCtx(null, ix, (bf.controller ?? 0) as 0 | 1)
      if (ab.while && !evalCond(s, ctx, ab.while)) continue
      const eff = ab.effect
      if (eff.kind === 'mightAura') {
        out.push({ might: eff.amount, keywords: [], appliesTo: (u) => matchesFilter(s, ctx, u, eff.targets) })
      } else if (eff.kind === 'grantKeywords') {
        out.push({ might: 0, keywords: eff.keywords, appliesTo: (u) => matchesFilter(s, ctx, u, eff.targets) })
      }
    }
  })
  return out
}

/** Effective keywords: printed + granted + aura-granted. */
export function effKeywords(s: GameState, u: UnitEntity): Keywords {
  const base = keywords(u.cardId)
  const grantStrings = u.grants.flatMap((g) => g.keywords)
  for (const aura of activeAuras(s)) {
    if (aura.keywords.length > 0 && aura.appliesTo(u)) grantStrings.push(...aura.keywords)
  }
  if (grantStrings.length === 0) return base
  const extra = parseGrantKw(grantStrings)
  return {
    ...base,
    assault: base.assault + (extra.assault ?? 0),
    shield: base.shield + (extra.shield ?? 0),
    tank: base.tank || (extra.tank ?? false),
    ganking: base.ganking || (extra.ganking ?? false),
    temporary: base.temporary || (extra.temporary ?? false),
    deflect: base.deflect + (extra.deflect ?? 0),
    legion: base.legion || (extra.legion ?? false),
  }
}

/** Effective Might: printed + buff + temp + grants + auras + combat-role bonus. */
export function might(s: GameState, u: UnitEntity): number {
  const kw = effKeywords(s, u)
  let m = def(u.cardId).might ?? 0
  if (u.buffed) m += 1
  m += u.tempMight
  m += u.grants.reduce((n, g) => n + g.might, 0)
  // Attached Equipment Might Bonuses (137/716).
  for (const g of s.units) {
    if (g.kind === 'gear' && g.attachedTo === u.uid) {
      m += scriptFor(g.cardId)?.equip?.bonusMight ?? 0
    }
  }
  for (const aura of activeAuras(s)) {
    if (aura.might !== 0 && aura.appliesTo(u)) m += aura.might
  }
  if (u.combatRole === 'attacker') m += kw.assault
  if (u.combatRole === 'defender') m += kw.shield
  return Math.max(0, m)
}

/** Might contributed to combat damage (stunned deal 0). */
export function combatMightQ(s: GameState, u: UnitEntity): number {
  return u.stunned ? 0 : might(s, u)
}
