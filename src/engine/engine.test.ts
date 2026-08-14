import { describe, expect, it } from 'vitest'
import type { Deck } from '../data/decks'
import { applyAction, IllegalAction } from './reducer'
import { createGame } from './setup'
import type { GameAction, GameState } from './types'

// Test cards (real data from cards.json):
// NB: the legend must be unscripted so turn transitions stay trigger-free here
// (scripted-legend flows are covered by the effect-engine tests).
const LEGEND = 'ogn-253-298' // Darius - Hand of Noxus (Fury/Body)
const CHAMP = 'opp-001-024' // Annie - Fiery, 5E 1P, Might 4
const ENFORCER = 'ogn-003-298' // Chemtech Enforcer, 2E, M2, [Assault 2] + "When you play me, discard 1."
const REARGUARD = 'ogn-010-298' // Legion Rearguard, 2E, M2, [Accelerate], no trigger
const SCORCHER = 'ogn-001-298' // Blazing Scorcher, 5E, M5, [Accelerate], no trigger
const SKULKER = 'ogn-175-298' // Shipyard Skulker, 3E, M3, vanilla
const CLEAVE = 'ogn-004-298' // Cleave, 1E spell (Fury)
const FURY_RUNE = 'opp-007b-298'
const CHAOS_RUNE = 'opp-166b-298'
const BF1 = 'unl-205-219'
const BF2 = 'unl-206-219'
const BF3 = 'sfd-207-221'

function mkDeck(mainCard: string, mainCount = 20): Deck {
  return {
    id: 'test',
    name: 'Test',
    legendId: LEGEND,
    championId: CHAMP,
    battlefieldIds: [BF1, BF2, BF3],
    runes: { [FURY_RUNE]: 6, [CHAOS_RUNE]: 6 },
    main: { [mainCard]: mainCount, [CHAMP]: 1 },
  }
}

function newGame(opts: { mainA?: string; mainB?: string; count?: number } = {}): GameState {
  return createGame({
    seed: 42,
    decks: [mkDeck(opts.mainA ?? REARGUARD, opts.count ?? 20), mkDeck(opts.mainB ?? SKULKER, opts.count ?? 20)],
    names: ['Alice', 'Bob'],
    first: 0,
  })
}

function run(s: GameState, ...actions: GameAction[]): GameState {
  for (const a of actions) s = applyAction(s, a)
  return s
}

function skipMulligans(s: GameState): GameState {
  return run(s, { t: 'mulligan', player: 0, cardIds: [] }, { t: 'mulligan', player: 1, cardIds: [] })
}

/** Exhaust n ready runes of player p for energy. */
function addEnergy(s: GameState, p: 0 | 1, n: number): GameState {
  const ready = s.players[p].runes.filter((r) => r.ready).slice(0, n)
  expect(ready.length).toBe(n)
  for (const r of ready) s = applyAction(s, { t: 'exhaustRune', player: p, runeUid: r.uid })
  return s
}

describe('setup & mulligan', () => {
  it('deals 4 cards, picks 2 battlefields, starts in mulligan', () => {
    const s = newGame()
    expect(s.phase).toBe('mulligan')
    expect(s.players[0].hand.length).toBe(4)
    expect(s.players[1].hand.length).toBe(4)
    expect(s.battlefields.length).toBe(2)
    expect(s.battlefields[0].owner).toBe(0)
    expect(s.battlefields[1].owner).toBe(1)
    expect(s.players[0].runeDeck.length).toBe(12)
    // Champion in zone, not in deck
    expect(s.players[0].championInZone).toBe(true)
    expect(s.players[0].deck.length).toBe(16) // 21 - 1 champion - 4 drawn
  })

  it('mulligan replaces cards and starts turn 1 (channel 2, draw 1)', () => {
    let s = newGame()
    const twoCards = s.players[0].hand.slice(0, 2)
    s = run(s, { t: 'mulligan', player: 0, cardIds: twoCards })
    expect(s.players[0].hand.length).toBe(4)
    s = run(s, { t: 'mulligan', player: 1, cardIds: [] })
    expect(s.phase).toBe('action')
    expect(s.turn).toBe(1)
    expect(s.turnPlayer).toBe(0)
    expect(s.players[0].runes.length).toBe(2)
    expect(s.players[0].hand.length).toBe(5)
    expect(s.players[0].pool.energy).toBe(0) // pool empties after draw phase
  })

  it('second player channels 3 runes on their first turn', () => {
    let s = skipMulligans(newGame())
    s = run(s, { t: 'endTurn', player: 0 })
    expect(s.turn).toBe(2)
    expect(s.turnPlayer).toBe(1)
    expect(s.players[1].runes.length).toBe(3)
  })
})

describe('runes & costs', () => {
  it('exhaust rune = +1 energy; recycle rune = +1 power and back to rune deck', () => {
    let s = skipMulligans(newGame())
    const [r1, r2] = s.players[0].runes
    s = run(s, { t: 'exhaustRune', player: 0, runeUid: r1.uid })
    expect(s.players[0].pool.energy).toBe(1)
    const before = s.players[0].runeDeck.length
    s = run(s, { t: 'recycleRune', player: 0, runeUid: r2.uid })
    expect(s.players[0].runeDeck.length).toBe(before + 1)
    expect(s.players[0].runes.length).toBe(1)
    expect(Object.values(s.players[0].pool.power).reduce((a, b) => a + (b ?? 0), 0)).toBe(1)
  })

  it('rejects playing a card without enough energy', () => {
    const s = skipMulligans(newGame())
    expect(() =>
      applyAction(s, { t: 'playCard', player: 0, cardId: REARGUARD, from: 'hand', location: 'base' })
    ).toThrow(IllegalAction)
  })

  it('plays a unit at base, exhausted', () => {
    let s = skipMulligans(newGame())
    s = addEnergy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: REARGUARD, from: 'hand', location: 'base' })
    expect(s.units.length).toBe(1)
    expect(s.units[0].location).toBe('base')
    expect(s.units[0].ready).toBe(false)
    expect(s.players[0].pool.energy).toBe(0)
    expect(s.players[0].hand.length).toBe(4)
    expect(s.chain.length).toBe(0) // no played-trigger on Rearguard
  })

  it('"When you play me" triggers go on the chain and resolve after both pass', () => {
    let s = skipMulligans(newGame({ mainA: ENFORCER }))
    s = addEnergy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: ENFORCER, from: 'hand', location: 'base' })
    expect(s.chain.length).toBe(1)
    expect(s.chain[0].kind).toBe('trigger')
    // 337.4: priority goes to the newest item's controller first
    expect(s.chainActive).toBe(0)
    s = run(s, { t: 'pass', player: 0 }, { t: 'pass', player: 1 })
    // Both passed in sequence: the trigger resolves automatically (339-340)
    expect(s.chain.length).toBe(0)
  })
})

describe('movement, showdown, conquering, holding', () => {
  function playAndPark(): GameState {
    let s = skipMulligans(newGame())
    s = addEnergy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: REARGUARD, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 0 }) // turn 2 (Bob)
    s = run(s, { t: 'endTurn', player: 1 }) // turn 3 (Alice), unit awakens
    return s
  }

  it('moving to an empty battlefield triggers a showdown, then conquer scores 1 point', () => {
    let s = playAndPark()
    const uid = s.units[0].uid
    expect(s.units[0].ready).toBe(true)
    s = run(s, { t: 'move', player: 0, unitUids: [uid], to: 0 })
    expect(s.showdown).not.toBeNull()
    expect(s.showdown!.defender).toBeNull()
    expect(s.units[0].ready).toBe(false) // move cost
    s = run(s, { t: 'pass', player: 0 }, { t: 'pass', player: 1 })
    expect(s.showdown).toBeNull()
    expect(s.battlefields[0].controller).toBe(0)
    expect(s.players[0].points).toBe(1)
    expect(s.battlefields[0].scoredBy[0]).toBe(true)
  })

  it('holding at the start of your turn scores again', () => {
    let s = playAndPark()
    const uid = s.units[0].uid
    s = run(
      s,
      { t: 'move', player: 0, unitUids: [uid], to: 0 },
      { t: 'pass', player: 0 },
      { t: 'pass', player: 1 },
      { t: 'endTurn', player: 0 }, // turn 4 (Bob)
      { t: 'endTurn', player: 1 } // turn 5 (Alice): hold scoring
    )
    expect(s.players[0].points).toBe(2)
  })
})

describe('combat', () => {
  it('full combat: lethal kills, conquer on wipe, damage cleared', () => {
    let s = skipMulligans(newGame({ mainA: SCORCHER }))
    // t1 Alice: nothing (only 2 runes, Scorcher costs 5)
    s = run(s, { t: 'endTurn', player: 0 })
    // t2 Bob (3 runes): plays Skulker (3E)
    s = addEnergy(s, 1, 3)
    s = run(s, { t: 'playCard', player: 1, cardId: SKULKER, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 1 })
    // t3 Alice: pass
    s = run(s, { t: 'endTurn', player: 0 })
    // t4 Bob: moves Skulker to battlefield 1, conquers it
    const skulker = s.units.find((u) => u.cardId === SKULKER)!
    s = run(
      s,
      { t: 'move', player: 1, unitUids: [skulker.uid], to: 1 },
      { t: 'pass', player: 1 },
      { t: 'pass', player: 0 }
    )
    expect(s.battlefields[1].controller).toBe(1)
    expect(s.players[1].points).toBe(1)
    s = run(s, { t: 'endTurn', player: 1 })
    // t5 Alice (6 runes): plays Scorcher (5E)
    s = addEnergy(s, 0, 5)
    s = run(s, { t: 'playCard', player: 0, cardId: SCORCHER, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 0 })
    // t6 Bob: holds battlefield 1 (+1 point)
    expect(s.players[1].points).toBe(2)
    s = run(s, { t: 'endTurn', player: 1 })
    // t7 Alice: moves Scorcher onto Skulker's battlefield -> combat
    const scorcher = s.units.find((u) => u.cardId === SCORCHER)!
    s = run(s, { t: 'move', player: 0, unitUids: [scorcher.uid], to: 1 })
    expect(s.showdown).not.toBeNull()
    expect(s.showdown!.attacker).toBe(0)
    expect(s.showdown!.defender).toBe(1)
    // Both pass -> damage: Scorcher M5 vs Skulker M3
    s = run(s, { t: 'pass', player: 0 }, { t: 'pass', player: 1 })
    expect(s.showdown).toBeNull()
    expect(s.units.find((u) => u.cardId === SKULKER)).toBeUndefined()
    expect(s.players[1].trash).toContain(SKULKER)
    const after = s.units.find((u) => u.cardId === SCORCHER)!
    expect(after.location).toBe(1)
    expect(after.damage).toBe(0) // cleared at end of combat
    expect(s.battlefields[1].controller).toBe(0) // conquered
    expect(s.players[0].points).toBe(1)
  })
})

describe('presence-based control (323.6)', () => {
  it('control is lost when the controller has no units at the battlefield', () => {
    let s = skipMulligans(newGame())
    s = addEnergy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: REARGUARD, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    const uid = s.units[0].uid
    s = run(
      s,
      { t: 'move', player: 0, unitUids: [uid], to: 0 },
      { t: 'pass', player: 0 },
      { t: 'pass', player: 1 }
    )
    expect(s.battlefields[0].controller).toBe(0)
    expect(s.players[0].points).toBe(1)
    // Leave: next turn, move the unit back to base → control drops at cleanup
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    expect(s.players[0].points).toBe(2) // held while garrisoned
    const unit = s.units[0]
    s = run(s, { t: 'move', player: 0, unitUids: [unit.uid], to: 'base' })
    expect(s.battlefields[0].controller).toBeNull()
    // No garrison → no hold next turn
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    expect(s.players[0].points).toBe(2)
  })
})

describe('combat damage assignment (465.2.c)', () => {
  /** Bob garrisons two Skulkers on battlefield 0; Alice attacks with a Scorcher. */
  function twoDefenders(): GameState {
    let s = skipMulligans(newGame({ mainA: SCORCHER, mainB: SKULKER }))
    s = run(s, { t: 'endTurn', player: 0 })
    // t2 Bob: play two Skulkers (3E each)
    s = run(s, { t: 'manual', player: 1, op: { k: 'energy', who: 1, n: 6 } })
    s = run(s, { t: 'playCard', player: 1, cardId: SKULKER, from: 'hand', location: 'base' })
    s = run(s, { t: 'playCard', player: 1, cardId: SKULKER, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 1 }, { t: 'endTurn', player: 0 })
    // t4 Bob: move both to battlefield 0, conquer through the showdown
    const skulkers = s.units.filter((u) => u.cardId === SKULKER).map((u) => u.uid)
    s = run(
      s,
      { t: 'move', player: 1, unitUids: skulkers, to: 0 },
      { t: 'pass', player: 1 },
      { t: 'pass', player: 0 },
      { t: 'endTurn', player: 1 }
    )
    expect(s.battlefields[0].controller).toBe(1)
    // t5 Alice: play the Scorcher (5E)
    s = run(s, { t: 'manual', player: 0, op: { k: 'energy', who: 0, n: 5 } })
    s = run(s, { t: 'playCard', player: 0, cardId: SCORCHER, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    // t7 Alice: attack — combat begins automatically
    const scorcher = s.units.find((u) => u.cardId === SCORCHER)!
    s = run(s, { t: 'move', player: 0, unitUids: [scorcher.uid], to: 0 })
    expect(s.showdown).not.toBeNull()
    expect(s.showdown!.defender).toBe(1)
    s = run(s, { t: 'pass', player: 0 }, { t: 'pass', player: 1 })
    return s
  }

  it('suspends on a real assignment choice, validates, and deals simultaneously', () => {
    let s = twoDefenders()
    // 5 damage among two 3-Might Skulkers: a genuine choice → pending for Alice
    expect(s.pending).not.toBeNull()
    expect(s.pending!.player).toBe(0)
    expect(s.pending!.spec.kind).toBe('assignDamage')
    const spec = s.pending!.spec as Extract<GameState['pending'], { spec: { kind: 'assignDamage' } }>['spec']
    expect(spec.pool).toBe(5)
    expect(spec.targets.length).toBe(2)
    const [d1, d2] = spec.targets
    // Illegal: partial damage on both (465.2.c.3)
    expect(() =>
      applyAction(s, {
        t: 'choose',
        player: 0,
        choice: { kind: 'assignDamage', assignments: { [d1]: 1, [d2]: 4 } },
      })
    ).toThrow(IllegalAction)
    // Other actions are locked while the choice is pending
    expect(() => applyAction(s, { t: 'endTurn', player: 0 })).toThrow(IllegalAction)
    // Legal: full lethal (3) on one, remainder (2) on the other
    s = applyAction(s, {
      t: 'choose',
      player: 0,
      choice: { kind: 'assignDamage', assignments: { [d1]: 3, [d2]: 2 } },
    })
    // Defenders' 6 damage auto-assigned to the lone Scorcher (kills it);
    // one Skulker dies, the survivor is healed by the Combat Cleanup.
    expect(s.pending).toBeNull()
    expect(s.units.filter((u) => u.cardId === SKULKER).length).toBe(1)
    expect(s.units.find((u) => u.cardId === SCORCHER)).toBeUndefined()
    expect(s.units[0].damage).toBe(0)
    expect(s.battlefields[0].controller).toBe(1) // defenders held
  })
})

describe('combat resolution (466)', () => {
  it('recalls the attackers when both sides survive', () => {
    let s = skipMulligans(newGame({ mainA: REARGUARD, mainB: SKULKER }))
    s = run(s, { t: 'endTurn', player: 0 })
    s = run(s, { t: 'manual', player: 1, op: { k: 'energy', who: 1, n: 3 } })
    s = run(s, { t: 'playCard', player: 1, cardId: SKULKER, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 1 }, { t: 'endTurn', player: 0 })
    const skulker = s.units.find((u) => u.cardId === SKULKER)!
    s = run(
      s,
      { t: 'move', player: 1, unitUids: [skulker.uid], to: 0 },
      { t: 'pass', player: 1 },
      { t: 'pass', player: 0 },
      { t: 'endTurn', player: 1 }
    )
    // t5 Alice: play Rearguard (M2), then attack the stunned Skulker (M3) next turn
    s = run(s, { t: 'manual', player: 0, op: { k: 'energy', who: 0, n: 2 } })
    s = run(s, { t: 'playCard', player: 0, cardId: REARGUARD, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    const rearguard = s.units.find((u) => u.cardId === REARGUARD)!
    // Stun the defender: it deals 0 combat damage but still needs 3 to die
    s = run(s, { t: 'manual', player: 0, op: { k: 'stun', unitUid: skulker.uid } })
    s = run(s, { t: 'move', player: 0, unitUids: [rearguard.uid], to: 0 })
    s = run(s, { t: 'pass', player: 0 }, { t: 'pass', player: 1 })
    // 2 damage < 3 Might: both survive → attackers recalled, defender keeps control
    const rg = s.units.find((u) => u.cardId === REARGUARD)!
    expect(rg.location).toBe('base')
    expect(s.units.find((u) => u.cardId === SKULKER)!.location).toBe(0)
    expect(s.battlefields[0].controller).toBe(1)
  })
})

describe('hide (811)', () => {
  const TIDETURNER = 'ogn-199-298' // [Hidden] unit

  it('hiding costs 1 power of ANY domain and sets the facedown card', () => {
    let s = skipMulligans(newGame({ mainA: TIDETURNER }))
    s = run(s, { t: 'manual', player: 0, op: { k: 'energy', who: 0, n: 3 } })
    s = run(s, { t: 'playCard', player: 0, cardId: TIDETURNER, from: 'hand', location: 'base' })
    // Tideturner's play trigger chains; both pass to resolve it
    if (s.chain.length > 0) s = run(s, { t: 'pass', player: 0 }, { t: 'pass', player: 1 })
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    const unit = s.units[0]
    s = run(
      s,
      { t: 'move', player: 0, unitUids: [unit.uid], to: 0 },
      { t: 'pass', player: 0 },
      { t: 'pass', player: 1 }
    )
    expect(s.battlefields[0].controller).toBe(0)
    // Off-identity power (Body, not Fury/Chaos) is a legal Hide payment
    s = run(s, { t: 'manual', player: 0, op: { k: 'power', who: 0, domain: 'Body', n: 1 } })
    s = run(s, { t: 'hide', player: 0, cardId: TIDETURNER, battlefield: 0 })
    expect(s.battlefields[0].facedown).not.toBeNull()
    expect(s.battlefields[0].facedown!.owner).toBe(0)
    expect(s.players[0].pool.power.Body ?? 0).toBe(0)
  })
})

describe('scoring edge rules', () => {
  function playParked(): GameState {
    let s = skipMulligans(newGame())
    s = addEnergy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: REARGUARD, from: 'hand', location: 'base' })
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    return s
  }

  it('final point via conquer requires having scored every battlefield this turn (draws instead)', () => {
    let s = playParked()
    s = run(s, { t: 'manual', player: 0, op: { k: 'points', who: 0, n: 7 } })
    expect(s.players[0].points).toBe(7)
    const uid = s.units[0].uid
    const hand = s.players[0].hand.length
    s = run(
      s,
      { t: 'move', player: 0, unitUids: [uid], to: 0 },
      { t: 'pass', player: 0 },
      { t: 'pass', player: 1 }
    )
    expect(s.players[0].points).toBe(7) // no final point
    expect(s.players[0].hand.length).toBe(hand + 1) // drew instead
    expect(s.winner).toBeNull()
  })

  it('burn out: drawing from an empty deck gives the opponent a point', () => {
    // deck: 5 cards - 1 champion - 4 drawn = 0 left; the turn-1 draw burns out
    let s = skipMulligans(newGame({ count: 4 }))
    expect(s.players[0].deck.length).toBe(0)
    expect(s.players[1].points).toBe(1)
    s = run(s, { t: 'manual', player: 0, op: { k: 'draw', who: 0, n: 1 } })
    expect(s.players[1].points).toBe(2) // burns out again (deck & trash empty)
  })

  it('victory at 8 points ends the game', () => {
    let s = skipMulligans(newGame())
    s = run(s, { t: 'manual', player: 0, op: { k: 'points', who: 0, n: 8 } })
    expect(s.winner).toBe(0)
    expect(s.phase).toBe('over')
  })
})

describe('spells & the chain', () => {
  it('a spell goes on the chain; both passing resolves it to the trash', () => {
    let s = skipMulligans(newGame({ mainA: CLEAVE }))
    s = run(s, { t: 'manual', player: 0, op: { k: 'energy', who: 0, n: 2 } })
    const spell = s.players[0].hand.find((c) => c === CLEAVE)!
    s = run(s, { t: 'playCard', player: 0, cardId: spell, from: 'hand' })
    expect(s.chain.length).toBe(1)
    // Caster holds priority first (337.4) and may stack another card
    expect(s.chainActive).toBe(0)
    s = run(s, { t: 'pass', player: 0 })
    expect(s.chainActive).toBe(1)
    s = run(s, { t: 'pass', player: 1 })
    // All passed: automatic resolution, spell to its controller's trash
    expect(s.chain.length).toBe(0)
    expect(s.players[0].trash).toContain(CLEAVE)
  })

  it('a reaction window: only the priority holder may pass', () => {
    let s = skipMulligans(newGame({ mainA: CLEAVE }))
    s = run(s, { t: 'manual', player: 0, op: { k: 'energy', who: 0, n: 2 } })
    s = run(s, { t: 'playCard', player: 0, cardId: CLEAVE, from: 'hand' })
    expect(() => applyAction(s, { t: 'pass', player: 1 })).toThrow(IllegalAction)
  })
})
