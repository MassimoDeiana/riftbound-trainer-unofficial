// Frozen v1 engine — used only to replay archived games recorded before the
// FEPR/choice rework (GameRecord.v === 1). Never import from src/engine here.
export { applyAction as applyActionV1 } from './reducer'
export { createGame as createGameV1 } from './setup'
export type { GameAction as GameActionV1, GameState as GameStateV1 } from './types'
