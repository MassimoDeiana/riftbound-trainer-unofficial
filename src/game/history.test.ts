import { describe, expect, it } from 'vitest'
import { botAction } from '../ai/bot'
import { STARTER_DECKS } from '../data/starterDecks'
import { applyAction } from '../engine/reducer'
import { createGame } from '../engine/setup'
import type { GameAction, GameConfig } from '../engine/types'
import { exportGame, parseImportedGame, replayStates } from './history'

function playoutLog(config: GameConfig): GameAction[] {
  let s = createGame(config)
  const log: GameAction[] = []
  let i = 0
  while (s.winner === null && i < 4000) {
    const a = botAction(s, 0) ?? botAction(s, 1)
    if (!a) break
    s = applyAction(s, a)
    log.push(a)
    i++
  }
  return log
}

const config: GameConfig = {
  seed: 20260705,
  decks: [STARTER_DECKS[0], STARTER_DECKS[5]],
  names: ['A', 'B'],
  first: 0,
}

describe('history replay', () => {
  it('replays a full game deterministically to the same end state', () => {
    const log = playoutLog(config)
    expect(log.length).toBeGreaterThan(5)
    const a = replayStates(config, log)
    const b = replayStates(config, log)
    expect(a.length).toBe(log.length + 1)
    // Same seed + same log => identical final state every time
    expect(JSON.stringify(a[a.length - 1])).toBe(JSON.stringify(b[b.length - 1]))
    expect(a[a.length - 1].winner).not.toBeNull()
  })

  it('a cursor into the past matches replaying only that prefix (time-travel)', () => {
    const log = playoutLog(config)
    const states = replayStates(config, log)
    const k = Math.floor(log.length / 2)
    const prefix = replayStates(config, log.slice(0, k))
    expect(JSON.stringify(states[k])).toBe(JSON.stringify(prefix[k]))
  })

  it('export → import round-trips the config and log', () => {
    const log = playoutLog(config).slice(0, 10)
    const json = exportGame({ config, log, name: 'Test' })
    const back = parseImportedGame(json)
    expect(back.config.seed).toBe(config.seed)
    expect(back.log.length).toBe(10)
    // Imported record replays to the same states
    const a = replayStates(config, log)
    const b = replayStates(back.config, back.log)
    expect(JSON.stringify(a[a.length - 1])).toBe(JSON.stringify(b[b.length - 1]))
  })

  it('rejects invalid imported files', () => {
    expect(() => parseImportedGame('{"nope":true}')).toThrow()
    expect(() => parseImportedGame('not json')).toThrow()
  })
})
