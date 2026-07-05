import { describe, expect, it } from 'vitest'
import { STARTER_DECKS } from '../data/starterDecks'
import { applyAction } from '../engine/reducer'
import { createGame } from '../engine/setup'
import type { PlayerIx } from '../engine/types'
import { botAction } from './bot'

describe('bot vs bot', () => {
  for (const [a, b] of [
    [0, 4], // Annie starter vs Jinx champion deck
    [3, 5], // Master Yi vs Lee Sin
    [1, 6], // Lux vs Viktor
  ]) {
    it(`plays a full legal game to completion (${STARTER_DECKS[a].name} vs ${STARTER_DECKS[b].name})`, () => {
      let s = createGame({
        seed: 1234 + a * 10 + b,
        decks: [STARTER_DECKS[a], STARTER_DECKS[b]],
        names: ['Bot A', 'Bot B'],
        first: 0,
      })
      let iterations = 0
      while (s.winner === null && iterations < 5000) {
        const action = botAction(s, 0 as PlayerIx) ?? botAction(s, 1 as PlayerIx)
        if (!action) throw new Error(`Bots stalled at turn ${s.turn}, phase ${s.phase}`)
        s = applyAction(s, action) // throws on any illegal bot action
        iterations++
      }
      expect(s.winner).not.toBeNull()
      expect(iterations).toBeLessThan(5000)
    })
  }
})
