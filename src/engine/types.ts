import type { Domain } from '../data/cards'
import type { Deck } from '../data/decks'
import type { Rng } from './rng'

export type PlayerIx = 0 | 1

export type Phase =
  | 'mulligan'
  | 'action' // Main Phase (awaken/beginning/channel/draw run automatically at turn start)
  | 'over'

export type LocationRef = 'base' | number // number = battlefield index (0 or 1)

/** Might/keywords granted by an effect ("this turn" or while on the board). */
export interface GrantedEffect {
  might: number
  keywords: string[]
  duration: 'turn' | 'permanent'
}

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
  /** Granted might/keywords from scripted effects. */
  grants: GrantedEffect[]
  /** Tokens cease to exist when they leave the board. */
  isToken?: boolean
  /** Original owner when control was taken (defaults to controller). */
  owner?: PlayerIx
  /** Gear: uid of the unit this is attached to (Equip). */
  attachedTo?: number | null
  /** Empowered status (SFD/UNL Empower keyword). */
  empowered?: boolean
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
  /** Legend orientation (for legend activated abilities); readied at Awaken. */
  legendReady: boolean
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
  /** XP resource (SFD Hunt/Level). */
  xp?: number
}

export interface FacedownCard {
  cardId: string
  owner: PlayerIx
  /** Turn number when hidden; playable starting the next turn. */
  hiddenOnTurn: number
}

export interface BattlefieldState {
  cardId: string
  owner: PlayerIx
  controller: PlayerIx | null
  /** Which players already scored this battlefield this turn. */
  scoredBy: boolean[]
  facedown: FacedownCard | null
  /** Set while a non-controller has units here (until the showdown/combat resolves). */
  contestedBy: PlayerIx | null
}

export interface ChainItem {
  uid: number
  cardId: string | null // null for abilities
  label: string
  controller: PlayerIx
  kind: 'spell' | 'trigger' | 'ability'
  /** Unit uids / targets chosen at play time (informational for manual resolution). */
  targets?: number[]
  /** If true the engine resolves it (scripted); otherwise manual resolution. */
  scripted: boolean
  /** Scripted resolution id (legacy 'vision'). */
  script?: string
  /** Registry hook: which ability of cardId this item resolves. */
  abilityIx?: number
  /** Board source of the ability (unit/gear uid) when applicable. */
  sourceUid?: number | null
  /** Trigger context: unit uid the event fired for (e.g. the dead unit). */
  eventUid?: number | null
  /** Variables bound while finalizing (target choices). */
  targetVars?: Record<string, number | number[] | string[] | boolean | string>
}

export interface ShowdownState {
  battlefield: number
  attacker: PlayerIx
  defender: PlayerIx | null // null = non-combat showdown
  focus: PlayerIx
  /** Consecutive passes; all players passing in sequence closes the showdown. */
  passes: number
}

// ---- Pending choices (rule 465 damage assignment, cleanup steps 9-10, scripts) ----
// When set, the game is suspended until `pending.player` answers with a
// `choose` action. Every choice is part of the replicated action log.

export type ChoiceSpec =
  | {
      kind: 'assignDamage'
      /** Total damage to distribute (the assigner's summed Might). */
      pool: number
      /** Unit uids damage may be assigned to (the opposing side). */
      targets: number[]
      side: 'attacker' | 'defender'
    }
  | {
      /** Turn player picks which staged showdown/combat begins (cleanup 323.12-13). */
      kind: 'battlefield'
      options: number[]
      reason: 'showdown' | 'combat'
    }
  | {
      /** Vision: keep or recycle the top card of your deck. */
      kind: 'vision'
    }
  // ---- Scripted-effect choices (the VM suspends on these) ----
  | { kind: 'unit'; legal: number[]; min: number; max: number; prompt?: string }
  | { kind: 'card'; zone: 'hand' | 'trash' | 'deck'; player: PlayerIx; legal: number[]; min: number; max: number; prompt?: string }
  | { kind: 'mode'; options: string[]; n: number }
  | { kind: 'yesNo'; prompt: string }
  | { kind: 'location'; options: LocationRef[]; prompt?: string }

export type ChoiceValue =
  | { kind: 'assignDamage'; assignments: Record<number, number> }
  | { kind: 'battlefield'; battlefield: number }
  | { kind: 'vision'; recycle: boolean }
  | { kind: 'unit'; uids: number[] }
  | { kind: 'card'; indices: number[] }
  | { kind: 'mode'; picks: number[] }
  | { kind: 'yesNo'; yes: boolean }
  | { kind: 'location'; loc: LocationRef }

export interface PendingChoice {
  player: PlayerIx
  spec: ChoiceSpec
  /** Combat-damage context (assignDamage): battlefield + attacker's answer. */
  battlefield?: number
  attackerAssign?: Record<number, number> | null
  /** Effect-VM resume context. */
  vm?: {
    bind: string
    optional: boolean
    thenDiscard?: PlayerIx
    lookTop?: { n: number; keep: number; rest: 'recycle' | 'trash' }
  }
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
  /** Consecutive priority passes on the chain since the last item was added. */
  chainPasses: number
  /** Player currently holding priority on the chain. */
  chainActive: PlayerIx | null
  /**
   * How the current chain was opened: focus does NOT pass when a chain opened
   * by a triggered ability (or an Add ability) resolves during a showdown (346.1).
   */
  chainOpener: 'play' | 'trigger' | null
  showdown: ShowdownState | null
  /** Suspended waiting for this player's choice (answered via `choose`). */
  pending: PendingChoice | null
  /** Effect-VM execution state (frames/pc/vars) — see src/effects/vm.ts. */
  exec: unknown | null
  /** Extra turns queue (Time Warp etc.); empty = alternate normally. */
  turnQueue: PlayerIx[]
  /** Once-per-turn ability uses, keyed `${uid}:${abilityIx}`. */
  onceUsed: Record<string, number>
  /** Triggers queued while another resolution is in progress. */
  queuedTriggers: ChainItem[]
  /** The Ending Step chained triggers: finish the turn once they resolve. */
  endingTurn?: boolean
  /** Effects scheduled for this turn's Ending Step ({op:'atEndOfTurn'}). */
  delayed?: { ctx: unknown; ops: unknown[] }[]
  /** Simple replacement watchers on units (expire at end of turn, fire once). */
  watchers?: { uid: number; kind: 'preventDeathHeal' | 'killOnDamage'; source: string }[]
  /** "Units you play this turn enter ready" charges (-1 = unlimited this turn). */
  entryReady?: [number, number]
  winner: PlayerIx | null
  log: LogEntry[]
  /** Cards played from the main deck this turn, per player (for Legion). */
  cardsPlayedThisTurn: [number, number]
  /** Cards discarded this turn, per player (Raging Soul-style conditions). */
  discardsThisTurn: [number, number]
  /** Units that died this turn, per controller (Spoils of War). */
  diedThisTurn?: [number, number]
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
      from: 'hand' | 'champion' | 'hidden' | 'trash'
      location?: LocationRef // for units
      battlefield?: number // for hidden plays
      targets?: number[]
      accelerate?: boolean
    }
  | { t: 'move'; player: PlayerIx; unitUids: number[]; to: LocationRef }
  | { t: 'hide'; player: PlayerIx; cardId: string; battlefield: number }
  | { t: 'pass'; player: PlayerIx }
  /** Answer the current pending choice. */
  | { t: 'choose'; player: PlayerIx; choice: ChoiceValue }
  /** Activate a scripted ability of a unit/gear, your legend, or a battlefield. */
  | {
      t: 'activateAbility'
      player: PlayerIx
      source:
        | { kind: 'unit'; uid: number }
        | { kind: 'legend' }
        | { kind: 'battlefield'; ix: number }
      abilityIx: number
    }
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
  | { k: 'banish'; unitUid: number }
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
