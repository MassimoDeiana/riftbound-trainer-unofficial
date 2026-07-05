import { makeRng, nextInt, shuffle } from './rng'
import type { Deck } from '../data/decks'
import type { GameConfig, GameState, PlayerIx, PlayerState } from './types'
import { STARTING_HAND } from './types'

function expand(map: Record<string, number>): string[] {
  const out: string[] = []
  for (const [id, n] of Object.entries(map)) for (let i = 0; i < n; i++) out.push(id)
  return out
}

function makePlayer(name: string, deck: Deck): PlayerState {
  const main = expand(deck.main)
  // The Chosen Champion starts in the Champion Zone: remove one copy from the main deck.
  const champIx = main.indexOf(deck.championId!)
  if (champIx >= 0) main.splice(champIx, 1)
  return {
    name,
    points: 0,
    legendId: deck.legendId!,
    championId: deck.championId!,
    championInZone: true,
    deck: main,
    hand: [],
    trash: [],
    banishment: [],
    runeDeck: expand(deck.runes),
    runes: [],
    pool: { energy: 0, power: {} },
    mulliganed: false,
  }
}

export function createGame(config: GameConfig): GameState {
  const rng = makeRng(config.seed)
  const players = [
    makePlayer(config.names[0], config.decks[0]),
    makePlayer(config.names[1], config.decks[1]),
  ] as [PlayerState, PlayerState]

  for (const p of players) {
    shuffle(rng, p.deck)
    shuffle(rng, p.runeDeck)
    p.hand = p.deck.splice(0, STARTING_HAND)
  }

  // 1v1: each player randomly brings 1 of their 3 registered battlefields.
  const battlefields = ([0, 1] as PlayerIx[]).map((ix) => {
    const options = config.decks[ix].battlefieldIds
    const cardId = options[nextInt(rng, options.length)]
    return {
      cardId,
      owner: ix,
      controller: null,
      scoredBy: [false, false],
      facedown: null,
      contestedBy: null,
    }
  })

  return {
    rng,
    turn: 0,
    turnPlayer: config.first,
    phase: 'mulligan',
    players,
    battlefields,
    units: [],
    nextUid: 1,
    chain: [],
    chainPasses: 0,
    chainActive: null,
    showdown: null,
    pendingCombat: [],
    winner: null,
    log: [
      {
        turn: 0,
        player: null,
        text: `Partie créée — ${players[0].name} vs ${players[1].name}. ${players[config.first].name} commence. Mulligan : jusqu'à 2 cartes.`,
      },
    ],
    cardsPlayedThisTurn: [0, 0],
  }
}
