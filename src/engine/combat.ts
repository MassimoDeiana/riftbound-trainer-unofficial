// Combat damage assignment (Core Rules July 2026, rule 465.2.c).
// Pure helpers: no game-state mutation here.
import { keywords, unitMight } from './cardinfo'
import type { UnitEntity } from './types'

/** Minimum damage that constitutes lethal for this unit right now (≥1). */
export function minLethal(u: UnitEntity): number {
  return Math.max(1, unitMight(u) - u.damage)
}

/**
 * Assignment priority class: Tank must be assigned first (0), Backline last (2).
 * A unit carrying both is exclusionary (465.2.c.8) — the assigner picks either
 * end, which the validator models by accepting both classes for it.
 */
function classesOf(u: UnitEntity): number[] {
  const kw = keywords(u.cardId)
  const tank = kw.tank
  const backline = kw.unknown.some((k) => /^backline/i.test(k))
  if (tank && backline) return [0, 2]
  if (tank) return [0]
  if (backline) return [2]
  return [1]
}

export interface AssignmentProblem {
  pool: number
  targets: UnitEntity[]
}

/**
 * Validate a damage assignment per 465.2.c. Returns an error string (French)
 * or null when legal.
 */
export function validateAssignment(
  pool: number,
  targets: UnitEntity[],
  assign: Record<number, number>
): string | null {
  const uids = new Set(targets.map((u) => u.uid))
  for (const key of Object.keys(assign)) {
    if (!uids.has(Number(key))) return 'Cible invalide dans l’assignation'
    if (assign[Number(key)] < 0 || !Number.isInteger(assign[Number(key)]))
      return 'Quantité de dégâts invalide'
  }
  const total = targets.reduce((n, u) => n + (assign[u.uid] ?? 0), 0)
  if (total !== pool) return `Il faut assigner exactement ${pool} dégât(s) (assigné : ${total})`
  if (pool === 0) return null

  // Pick, for each exclusionary unit, the class that makes the assignment legal
  // (try both, per 465.2.c.8-9). With ≤2 such units brute force is fine.
  const flex = targets.filter((u) => classesOf(u).length > 1)
  const combos: Map<number, number>[] = []
  const build = (ix: number, acc: Map<number, number>) => {
    if (ix === flex.length) {
      combos.push(new Map(acc))
      return
    }
    for (const c of classesOf(flex[ix])) {
      acc.set(flex[ix].uid, c)
      build(ix + 1, acc)
    }
  }
  build(0, new Map())
  if (combos.length === 0) combos.push(new Map())

  outer: for (const combo of combos) {
    const clsOf = (u: UnitEntity) => combo.get(u.uid) ?? classesOf(u)[0]
    // 1. Full lethal before touching a later unit; over-assign only when all lethal.
    const partial = targets.filter((u) => (assign[u.uid] ?? 0) > 0 && (assign[u.uid] ?? 0) < minLethal(u))
    if (partial.length > 1) continue
    const over = targets.filter((u) => (assign[u.uid] ?? 0) > minLethal(u))
    const allLethal = targets.every((u) => (assign[u.uid] ?? 0) >= minLethal(u))
    if (over.length > 0 && !allLethal) continue
    // 2. Class ordering: a unit receiving damage requires every unit of a
    //    strictly lower class to be fully lethal; a partial unit blocks all
    //    same-or-later units from receiving damage after it.
    for (const u of targets) {
      const a = assign[u.uid] ?? 0
      if (a === 0) continue
      for (const v of targets) {
        if (v.uid === u.uid) continue
        if (clsOf(v) < clsOf(u) && (assign[v.uid] ?? 0) < minLethal(v)) continue outer
      }
    }
    if (partial.length === 1) {
      const pu = partial[0]
      for (const v of targets) {
        if (v.uid === pu.uid) continue
        // Units in an earlier or equal class with no damage are fine only if
        // equal class (assigner order within a class is free) — but then the
        // partial must be the last touched: no later-class unit may have damage.
        if (clsOf(v) > clsOf(pu) && (assign[v.uid] ?? 0) > 0) continue outer
      }
    }
    return null
  }
  return 'Assignation illégale : létal complet unité par unité, Tank d’abord, Backline en dernier'
}

/**
 * Canonical greedy assignment: full lethal in priority order (Tank → normal →
 * Backline; ties by descending Might then uid), remainder on the next unit,
 * excess dumped on the last unit. Always legal.
 */
export function greedyAssignment(pool: number, targets: UnitEntity[]): Record<number, number> {
  const ordered = [...targets].sort((a, b) => {
    const ca = classesOf(a)[0]
    const cb = classesOf(b)[0]
    if (ca !== cb) return ca - cb
    const ma = unitMight(b) - unitMight(a)
    if (ma !== 0) return ma
    return a.uid - b.uid
  })
  const out: Record<number, number> = {}
  let remaining = pool
  for (const u of ordered) {
    if (remaining <= 0) break
    const dealt = Math.min(minLethal(u), remaining)
    out[u.uid] = dealt
    remaining -= dealt
  }
  if (remaining > 0 && ordered.length > 0) {
    // Everything already lethal: dump the excess on the last unit (465.2.c.4).
    out[ordered[ordered.length - 1].uid] = (out[ordered[ordered.length - 1].uid] ?? 0) + remaining
  }
  return out
}

/**
 * Returns the forced assignment when the player has no real choice, else null
 * (a prompt is needed). No-choice cases: no damage, a single target, or the
 * pool covers lethal on every target (excess placement is irrelevant).
 * With Tank/Backline ordering, also forced when every priority tier holds at
 * most one unit.
 */
export function autoAssignment(pool: number, targets: UnitEntity[]): Record<number, number> | null {
  if (pool === 0 || targets.length === 0) return {}
  if (targets.length === 1) return greedyAssignment(pool, targets)
  const totalLethal = targets.reduce((n, u) => n + minLethal(u), 0)
  if (pool >= totalLethal) return greedyAssignment(pool, targets)
  const tiers = new Map<number, number>()
  for (const u of targets) {
    const cs = classesOf(u)
    if (cs.length > 1) return null // exclusionary unit: real choice
    tiers.set(cs[0], (tiers.get(cs[0]) ?? 0) + 1)
  }
  if ([...tiers.values()].every((n) => n <= 1)) return greedyAssignment(pool, targets)
  return null
}
