import { applyAction } from '../engine/reducer'
import { createGame } from '../engine/setup'
import type { GameAction, GameConfig, GameState } from '../engine/types'

/** A self-contained, replayable record of a game: seed + decks + the action log. */
export interface GameRecord {
  v: 1
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
export function replayStates(config: GameConfig, log: GameAction[]): GameState[] {
  const states: GameState[] = [createGame(config)]
  for (const a of log) {
    states.push(applyAction(states[states.length - 1], a))
  }
  return states
}

// ---------------------------------------------------------------- persistence

const CURRENT_KEY = 'rb.solo.current'
const LIST_KEY = 'rb.games'
const MAX_SAVED = 40

interface StoredGame {
  config: GameConfig
  log: GameAction[]
}

export function saveCurrentSolo(config: GameConfig, log: GameAction[]) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ config, log } satisfies StoredGame))
  } catch {
    /* quota — ignore */
  }
}

export function loadCurrentSolo(): StoredGame | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY)
    return raw ? (JSON.parse(raw) as StoredGame) : null
  } catch {
    return null
  }
}

export function clearCurrentSolo() {
  localStorage.removeItem(CURRENT_KEY)
}

export function listSavedGames(): GameRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) ?? '[]') as GameRecord[]
  } catch {
    return []
  }
}

function writeList(games: GameRecord[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(games.slice(0, MAX_SAVED)))
}

/** Save (or update) a game in the archive under a stable id. */
export function archiveGame(rec: Omit<GameRecord, 'v'> & { v?: 1 }): GameRecord[] {
  const full: GameRecord = { ...rec, v: 1 }
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
    { v: 1, name: rec.name ?? 'Partie Riftbound', config: rec.config, log: rec.log },
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
  return { config: obj.config, log: obj.log, name: obj.name }
}
