// Custom-op registry: deterministic functions for the ~10% of cards whose
// logic doesn't fit the declarative IR. Functions live here (never inside
// GameState) and are addressed by string id from `{ op: 'custom', id }`.
import type { GameState } from '../engine/types'
import type { EffectCtx } from './selectors'

type CustomOp = (s: GameState, ctx: EffectCtx) => void

const CUSTOM_OPS: Record<string, CustomOp> = {
  // Populated as sets are scripted (M2+).
}

export function runCustomOp(id: string, s: GameState, ctx: EffectCtx) {
  const fn = CUSTOM_OPS[id]
  if (!fn) throw new Error(`Custom op inconnu : ${id}`)
  fn(s, ctx)
}

export function customOpIds(): string[] {
  return Object.keys(CUSTOM_OPS)
}
