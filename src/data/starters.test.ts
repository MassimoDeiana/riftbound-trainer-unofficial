import { describe, expect, it } from 'vitest'
import { createGame } from '../engine/setup'
import { mainDeckCount, runeCount, validateDeck } from './decks'
import { STARTER_DECKS } from './starterDecks'

describe('official starter decks', () => {
  it('there are 8 and they are all legal', () => {
    expect(STARTER_DECKS.length).toBe(8)
    for (const deck of STARTER_DECKS) {
      expect(validateDeck(deck), deck.name).toEqual([])
      expect(mainDeckCount(deck), deck.name).toBe(40)
      expect(runeCount(deck), deck.name).toBe(12)
    }
  })

  it('any two starter decks can start a game', () => {
    const s = createGame({
      seed: 7,
      decks: [STARTER_DECKS[0], STARTER_DECKS[3]],
      names: ['A', 'B'],
      first: 0,
    })
    expect(s.phase).toBe('mulligan')
    expect(s.players[0].hand.length).toBe(4)
    expect(s.players[0].deck.length).toBe(35) // 40 - 1 champion - 4 drawn
    expect(s.battlefields.length).toBe(2)
  })
})
