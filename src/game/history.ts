import { applyAction } from '../engine/reducer'
import { createGame } from '../engine/setup'
import type { GameAction, GameConfig, GameState } from '../engine/types'
import { applyActionV1, createGameV1, type GameActionV1 } from './legacy'

/** Replicated-protocol version. v1 games replay on the frozen legacy engine. */
export type ProtocolVersion = 1 | 2
export const PROTOCOL_VERSION: ProtocolVersion = 2

/** A self-contained, replayable record of a game: seed + decks + the action log. */
export interface GameRecord {
  v: ProtocolVersion
  id: string
  name: string
  savedAt: string
  config: GameConfig
  log: GameAction[]
  /** Cached summary for the list view. */
  result?: string
}

/** Deterministically rebuild the full sequence of states from a seed + action log.
 *  states[k] is the board after the first k actions (states[0] = fresh game). */
export function replayStates(config: GameConfig, log: GameAction[], v: ProtocolVersion = 2): GameState[] {
  if (v === 1) return replayStatesV1(config, log as unknown as GameActionV1[])
  const states: GameState[] = [createGame(config)]
  for (const a of log) {
    states.push(applyAction(states[states.length - 1], a))
  }
  return states
}

/** Replay a v1 archive on the frozen engine, shimmed to the v2 state shape
 *  (missing fields defaulted) so the current UI can render it read-only. */
function replayStatesV1(config: GameConfig, log: GameActionV1[]): GameState[] {
  let cur = createGameV1(config)
  const shim = (st: typeof cur): GameState =>
    ({ ...st, pending: null, turnQueue: [], chainOpener: null }) as unknown as GameState
  const states: GameState[] = [shim(cur)]
  for (const a of log) {
    cur = applyActionV1(cur, a)
    states.push(shim(cur))
  }
  return states
}

// ---------------------------------------------------------------- persistence

const CURRENT_KEY = 'rb.solo.current'
const LIST_KEY = 'rb.games'
const MAX_SAVED = 40

interface StoredGame {
  v?: ProtocolVersion
  config: GameConfig
  log: GameAction[]
}

export function saveCurrentSolo(config: GameConfig, log: GameAction[]) {
  try {
    localStorage.setItem(
      CURRENT_KEY,
      JSON.stringify({ v: PROTOCOL_VERSION, config, log } satisfies StoredGame)
    )
  } catch {
    /* quota — ignore */
  }
}

/** Resumable current solo game — only same-protocol saves can be resumed. */
export function loadCurrentSolo(): StoredGame | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredGame
    if ((stored.v ?? 1) !== PROTOCOL_VERSION) {
      localStorage.removeItem(CURRENT_KEY) // v1 in-progress game: not resumable
      return null
    }
    return stored
  } catch {
    return null
  }
}

export function clearCurrentSolo() {
  localStorage.removeItem(CURRENT_KEY)
}

export function listSavedGames(): GameRecord[] {
  try {
    const games = JSON.parse(localStorage.getItem(LIST_KEY) ?? '[]') as GameRecord[]
    return games.map((g) => ({ ...g, v: g.v ?? 1 }))
  } catch {
    return []
  }
}

function writeList(games: GameRecord[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(games.slice(0, MAX_SAVED)))
}

/** Save (or update) a game in the archive under a stable id. */
export function archiveGame(rec: Omit<GameRecord, 'v'> & { v?: ProtocolVersion }): GameRecord[] {
  const full: GameRecord = { ...rec, v: rec.v ?? PROTOCOL_VERSION }
  const games = listSavedGames().filter((g) => g.id !== full.id)
  games.unshift(full)
  writeList(games)
  return games
}

export function deleteSavedGame(id: string): GameRecord[] {
  const games = listSavedGames().filter((g) => g.id !== id)
  writeList(games)
  return games
}

export function makeGameId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------- export / import

export function exportGame(rec: { config: GameConfig; log: GameAction[]; name?: string }): string {
  return JSON.stringify(
    { v: PROTOCOL_VERSION, name: rec.name ?? 'Partie Riftbound', config: rec.config, log: rec.log },
    null,
    2
  )
}

export function parseImportedGame(text: string): StoredGame & { name?: string } {
  const obj = JSON.parse(text)
  if (!obj || typeof obj !== 'object' || !obj.config || !Array.isArray(obj.log)) {
    throw new Error('Fichier de partie invalide')
  }
  // Sanity: config must have decks + seed
  if (!obj.config.decks || obj.config.decks.length !== 2 || typeof obj.config.seed !== 'number') {
    throw new Error('Configuration de partie invalide')
  }
  return { v: (obj.v ?? 1) as ProtocolVersion, config: obj.config, log: obj.log, name: obj.name }
}
