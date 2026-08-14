import type { Domain } from '../../data/cards'
import type { Deck } from '../../data/decks'
import type { Rng } from './rng'

export type PlayerIx = 0 | 1

export type Phase =
  | 'mulligan'
  | 'action' // Action Phase (awaken/beginning/channel/draw run automatically at turn start)
  | 'over'

export type LocationRef = 'base' | number // number = battlefield index (0 or 1)

export interface UnitEntity {
  uid: number
  cardId: string
  controller: PlayerIx
  kind: 'unit' | 'gear'
  location: LocationRef
  ready: boolean
  damage: number
  buffed: boolean
  stunned: boolean
  /** Combat designation, cleared by cleanup when leaving the battlefield. */
  combatRole: 'attacker' | 'defender' | null
  /** +Might until end of turn from manual adjustments / effects. */
  tempMight: number
  /** True for the Chosen Champion unit. */
  isChampion: boolean
}

export interface RuneInPlay {
  uid: number
  cardId: string
  ready: boolean
}

export interface Pool {
  energy: number
  /** Power by domain; 'Universal' usable as any. */
  power: Partial<Record<Domain | 'Universal', number>>
}

export interface PlayerState {
  name: string
  points: number
  legendId: string
  championId: string
  /** Champion available in Champion Zone (playable from there). */
  championInZone: boolean
  deck: string[] // top = index 0
  hand: string[]
  trash: string[]
  banishment: string[]
  runeDeck: string[]
  runes: RuneInPlay[]
  pool: Pool
  mulliganed: boolean
}

export interface FacedownCard {
  cardId: string
  owner: PlayerIx
  /** Turn number when hidden; playable starting the next player's turn. */
  hiddenOnTurn: number
}

export interface BattlefieldState {
  cardId: string
  owner: PlayerIx
  controller: PlayerIx | null
  /** Which players already scored this battlefield this turn. */
  scoredBy: boolean[]
  facedown: FacedownCard | null
  /** Set while a non-controller has units here (until combat resolves). */
  contestedBy: PlayerIx | null
}

export interface ChainItem {
  uid: number
  cardId: string | null // null for abilities
  label: string
  controller: PlayerIx
  kind: 'spell' | 'trigger'
  /** Unit uids / targets chosen at play time (informational for manual resolution). */
  targets?: number[]
  /** If true the engine resolves it (scripted); otherwise manual resolution. */
  scripted: boolean
  /** Scripted resolution id (e.g. 'vision'). */
  script?: string
}

export interface ShowdownState {
  battlefield: number
  attacker: PlayerIx
  defender: PlayerIx | null // null = non-combat showdown (empty battlefield)
  focus: PlayerIx
  /** Consecutive passes; both relevant players passing ends the showdown. */
  passes: number
}

export interface LogEntry {
  turn: number
  player: PlayerIx | null
  text: string
}

export interface GameState {
  rng: Rng
  turn: number
  turnPlayer: PlayerIx
  phase: Phase
  players: [PlayerState, PlayerState]
  battlefields: BattlefieldState[]
  units: UnitEntity[]
  nextUid: number
  chain: ChainItem[]
  /** Passes on the current chain since the last item was added/resolved. */
  chainPasses: number
  /** Player currently allowed to act on the chain. */
  chainActive: PlayerIx | null
  showdown: ShowdownState | null
  /** Battlefields with combat pending, decided at cleanup. */
  pendingCombat: number[]
  winner: PlayerIx | null
  log: LogEntry[]
  /** Cards played from the main deck this turn, per player (for Legion). */
  cardsPlayedThisTurn: [number, number]
}

// ---- Actions (the replicated protocol; both peers apply the same log) ----

export type GameAction =
  | { t: 'mulligan'; player: PlayerIx; cardIds: string[] }
  | { t: 'exhaustRune'; player: PlayerIx; runeUid: number }
  | { t: 'recycleRune'; player: PlayerIx; runeUid: number }
  | {
      t: 'playCard'
      player: PlayerIx
      cardId: string
      from: 'hand' | 'champion' | 'hidden'
      location?: LocationRef // for units
      battlefield?: number // for hidden plays
      targets?: number[]
      accelerate?: boolean
    }
  | { t: 'move'; player: PlayerIx; unitUids: number[]; to: LocationRef }
  | { t: 'hide'; player: PlayerIx; cardId: string; battlefield: number }
  | { t: 'resolveChainTop'; player: PlayerIx; choice?: string }
  | { t: 'pass'; player: PlayerIx }
  | { t: 'chooseCombat'; player: PlayerIx; battlefield: number }
  | { t: 'endTurn'; player: PlayerIx }
  | { t: 'concede'; player: PlayerIx }
  // Manual adjustments for unscripted card text — always legal, visibly logged.
  | { t: 'manual'; player: PlayerIx; op: ManualOp }

export type ManualOp =
  | { k: 'draw'; who: PlayerIx; n: number }
  | { k: 'damage'; unitUid: number; n: number }
  | { k: 'heal'; unitUid: number; n: number }
  | { k: 'buff'; unitUid: number }
  | { k: 'unbuff'; unitUid: number }
  | { k: 'stun'; unitUid: number }
  | { k: 'kill'; unitUid: number }
  | { k: 'recallUnit'; unitUid: number }
  | { k: 'readyUnit'; unitUid: number; ready: boolean }
  | { k: 'tempMight'; unitUid: number; n: number }
  | { k: 'points'; who: PlayerIx; n: number }
  | { k: 'energy'; who: PlayerIx; n: number }
  | { k: 'power'; who: PlayerIx; domain: Domain | 'Universal'; n: number }
  | { k: 'discard'; who: PlayerIx; cardId: string }
  | { k: 'toHandFromTrash'; who: PlayerIx; cardId: string }
  | { k: 'channel'; who: PlayerIx; n: number }
  | { k: 'note'; text: string }

export interface GameConfig {
  seed: number
  decks: [Deck, Deck]
  names: [string, string]
  /** Player index who goes first (host randomizes). */
  first: PlayerIx
}

export const VICTORY_SCORE = 8
export const CHANNEL_PER_TURN = 2
export const STARTING_HAND = 4
export const MAX_MULLIGAN = 2
