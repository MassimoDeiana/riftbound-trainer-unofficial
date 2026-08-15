import { describe, expect, it } from 'vitest'
import type { Deck } from '../data/decks'
import { applyAction, IllegalAction } from '../engine/reducer'
import { createGame } from '../engine/setup'
import { might } from '../engine/queries'
import type { GameAction, GameState, PlayerIx, UnitEntity } from '../engine/types'

// Unscripted legend/battlefields keep the flow bare unless a test wants them.
const LEGEND = 'ogn-253-298' // Darius - Hand of Noxus (unscripted)
const CHAMP = 'opp-001-024' // Annie - Fiery
const SKULKER = 'ogn-175-298' // vanilla 3E M3
const FURY_RUNE = 'opp-007b-298'
const CHAOS_RUNE = 'opp-166b-298'
const PLAIN_BF = 'unl-205-219'

function mkDeck(main: Record<string, number>, opts: { legend?: string; battlefields?: string[] } = {}): Deck {
  return {
    id: 'test',
    name: 'Test',
    legendId: opts.legend ?? LEGEND,
    championId: CHAMP,
    battlefieldIds: opts.battlefields ?? [PLAIN_BF, PLAIN_BF, PLAIN_BF],
    runes: { [FURY_RUNE]: 6, [CHAOS_RUNE]: 6 },
    main: { ...main, [CHAMP]: 1 },
  }
}

function newGame(
  mainA: Record<string, number>,
  mainB: Record<string, number> = { [SKULKER]: 20 },
  opts: { legendA?: string; bfA?: string[] } = {}
): GameState {
  let s = createGame({
    seed: 7,
    decks: [mkDeck(mainA, { legend: opts.legendA, battlefields: opts.bfA }), mkDeck(mainB)],
    names: ['Alice', 'Bob'],
    first: 0,
  })
  s = applyAction(s, { t: 'mulligan', player: 0, cardIds: [] })
  s = applyAction(s, { t: 'mulligan', player: 1, cardIds: [] })
  return s
}

function run(s: GameState, ...actions: GameAction[]): GameState {
  for (const a of actions) s = applyAction(s, a)
  return s
}

/** Direct board surgery for scenario setup (tests own the state).
 *  Placing a unit at a battlefield grants its player control so the
 *  auto-showdown machinery stays quiet. */
function addUnit(s: GameState, p: PlayerIx, cardId: string, location: 'base' | number, opts: Partial<UnitEntity> = {}): number {
  const uid = s.nextUid++
  s.units.push({
    uid,
    cardId,
    controller: p,
    kind: 'unit',
    location,
    ready: true,
    damage: 0,
    buffed: false,
    stunned: false,
    combatRole: null,
    tempMight: 0,
    isChampion: false,
    grants: [],
    ...opts,
  })
  if (typeof location === 'number') s.battlefields[location].controller = p
  return uid
}

function giveHand(s: GameState, p: PlayerIx, cardId: string) {
  s.players[p].hand.push(cardId)
}

function energy(s: GameState, p: PlayerIx, n: number): GameState {
  return run(s, { t: 'manual', player: p, op: { k: 'energy', who: p, n } })
}

/** Play a scripted spell and answer its single unit target. */
function castAt(s: GameState, p: PlayerIx, cardId: string, targetUid: number): GameState {
  s = run(s, { t: 'playCard', player: p, cardId, from: 'hand' })
  expect(s.pending?.spec.kind).toBe('unit')
  s = run(s, { t: 'choose', player: p, choice: { kind: 'unit', uids: [targetUid] } })
  return s
}

const passBoth = (s: GameState, first: PlayerIx = 0): GameState =>
  run(s, { t: 'pass', player: first }, { t: 'pass', player: (1 - first) as PlayerIx })

describe('scripted spells', () => {
  it('Cleave grants [Assault 3] this turn (targeted, VM-suspended)', () => {
    let s = newGame({ 'ogn-004-298': 20 })
    const uid = addUnit(s, 0, SKULKER, 'base')
    giveHand(s, 0, 'ogn-004-298')
    s = energy(s, 0, 1)
    s = castAt(s, 0, 'ogn-004-298', uid)
    s = passBoth(s)
    const u = s.units.find((x) => x.uid === uid)!
    expect(u.grants.length).toBe(1)
    expect(u.grants[0].keywords).toEqual(['Assault 3'])
    // Assault applies only while attacking
    expect(might(s, u)).toBe(3)
    u.combatRole = 'attacker'
    expect(might(s, u)).toBe(6)
    u.combatRole = null
    // Spell went to the trash after resolving
    expect(s.players[0].trash).toContain('ogn-004-298')
    // Grant expires at end of turn
    s = run(s, { t: 'endTurn', player: 0 })
    expect(s.units.find((x) => x.uid === uid)!.grants.length).toBe(0)
  })

  it('Disintegrate: deal 3, draw only on kill', () => {
    let s = newGame({ 'ogn-005-298': 20 })
    const small = addUnit(s, 1, 'ogn-010-298', 0) // M2 at battlefield
    giveHand(s, 0, 'ogn-005-298')
    s = energy(s, 0, 4)
    const hand = s.players[0].hand.length - 1 // minus the spell being cast
    s = castAt(s, 0, 'ogn-005-298', small)
    s = passBoth(s)
    expect(s.units.find((x) => x.uid === small)).toBeUndefined()
    expect(s.players[0].hand.length).toBe(hand + 1) // killed → drew 1
  })

  it('Disintegrate does not draw when the target survives', () => {
    let s = newGame({ 'ogn-005-298': 20 })
    const big = addUnit(s, 1, 'ogn-001-298', 0) // Scorcher M5
    giveHand(s, 0, 'ogn-005-298')
    s = energy(s, 0, 4)
    const hand = s.players[0].hand.length - 1
    s = castAt(s, 0, 'ogn-005-298', big)
    s = passBoth(s)
    const u = s.units.find((x) => x.uid === big)!
    expect(u.damage).toBe(3)
    expect(s.players[0].hand.length).toBe(hand)
  })

  it('En Garde: +1, and +1 more only when alone at the location', () => {
    let s = newGame({ 'ogn-046-298': 20 })
    const lone = addUnit(s, 0, SKULKER, 0)
    giveHand(s, 0, 'ogn-046-298')
    s = energy(s, 0, 1)
    s = castAt(s, 0, 'ogn-046-298', lone)
    s = passBoth(s)
    expect(might(s, s.units.find((x) => x.uid === lone)!)).toBe(5) // 3 +1 +1
  })

  it('Gust only offers units with 3 or less Might', () => {
    let s = newGame({ 'ogn-169-298': 20 })
    addUnit(s, 1, 'ogn-001-298', 0) // M5 — illegal target
    const small = addUnit(s, 1, SKULKER, 0) // M3 — legal
    giveHand(s, 0, 'ogn-169-298')
    s = energy(s, 0, 1)
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-169-298', from: 'hand' })
    expect(s.pending?.spec.kind).toBe('unit')
    const spec = s.pending!.spec as { kind: 'unit'; legal: number[] }
    expect(spec.legal).toEqual([small])
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'unit', uids: [small] } })
    s = passBoth(s)
    expect(s.units.find((x) => x.uid === small)).toBeUndefined()
    expect(s.players[1].hand).toContain(SKULKER)
  })

  it('Wind Wall counters the spell below it on the chain', () => {
    let s = newGame({ 'ogn-005-298': 20 }, { 'ogn-064-298': 20 })
    const target = addUnit(s, 1, SKULKER, 0)
    giveHand(s, 0, 'ogn-005-298')
    giveHand(s, 1, 'ogn-064-298')
    s = energy(s, 0, 4)
    s = energy(s, 1, 5)
    s = run(s, { t: 'manual', player: 1, op: { k: 'power', who: 1, domain: 'Calm', n: 2 } })
    s = castAt(s, 0, 'ogn-005-298', target)
    // Alice holds priority first; she passes, Bob reacts with Wind Wall
    s = run(s, { t: 'pass', player: 0 })
    s = run(s, { t: 'playCard', player: 1, cardId: 'ogn-064-298', from: 'hand' })
    // Wind Wall on top; both pass → it resolves, countering Disintegrate
    s = passBoth(s, 1)
    expect(s.chain.length).toBe(0)
    expect(s.units.find((x) => x.uid === target)!.damage).toBe(0)
    expect(s.players[0].trash).toContain('ogn-005-298')
    expect(s.players[1].trash).toContain('ogn-064-298')
  })

  it('Morbid Return picks a unit card from the trash', () => {
    let s = newGame({ 'ogn-170-298': 20 })
    s.players[0].trash.push(SKULKER, 'ogn-004-298') // a unit and a spell
    giveHand(s, 0, 'ogn-170-298')
    s = energy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-170-298', from: 'hand' })
    s = passBoth(s)
    // resolution: card choice restricted to Unit cards
    expect(s.pending?.spec.kind).toBe('card')
    const spec = s.pending!.spec as { kind: 'card'; legal: number[] }
    expect(spec.legal.length).toBe(1)
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'card', indices: spec.legal } })
    expect(s.players[0].hand).toContain(SKULKER)
    expect(s.players[0].trash).not.toContain(SKULKER)
  })
})

describe('scripted triggers', () => {
  it('Chemtech Enforcer: play trigger forces a discard', () => {
    let s = newGame({ 'ogn-003-298': 20 })
    giveHand(s, 0, 'ogn-003-298')
    s = energy(s, 0, 2)
    const handBefore = s.players[0].hand.length
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-003-298', from: 'hand', location: 'base' })
    expect(s.chain.length).toBe(1)
    s = passBoth(s)
    // resolution suspends on the discard choice
    expect(s.pending?.spec.kind).toBe('card')
    const spec = s.pending!.spec as { kind: 'card'; legal: number[] }
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'card', indices: [spec.legal[0]] } })
    expect(s.players[0].hand.length).toBe(handBefore - 2) // played + discarded
    expect(s.chain.length).toBe(0)
  })

  it('Undercover Agent: Deathknell discards 2 then draws 2', () => {
    let s = newGame({ [SKULKER]: 20 })
    const uid = addUnit(s, 0, 'ogn-178-298', 'base')
    const handBefore = s.players[0].hand.length
    s = run(s, { t: 'manual', player: 0, op: { k: 'kill', unitUid: uid } })
    expect(s.players[0].trash).toContain('ogn-178-298')
    expect(s.chain.length).toBe(1) // deathknell trigger
    s = passBoth(s)
    expect(s.pending?.spec.kind).toBe('card') // discard 2
    const spec = s.pending!.spec as { kind: 'card'; legal: number[] }
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'card', indices: spec.legal.slice(0, 2) } })
    expect(s.players[0].hand.length).toBe(handBefore - 2 + 2)
  })

  it('Traveling Merchant triggers on move', () => {
    let s = newGame({ [SKULKER]: 20 })
    const uid = addUnit(s, 0, 'ogn-185-298', 'base')
    s = run(s, { t: 'move', player: 0, unitUids: [uid], to: 0 })
    expect(s.chain.length).toBe(1)
    s = passBoth(s)
    expect(s.pending?.spec.kind).toBe('card') // discard 1
  })

  it('Mystic Poro: Vision looks at the top card', () => {
    let s = newGame({ 'ogn-171-298': 20 })
    giveHand(s, 0, 'ogn-171-298')
    s = energy(s, 0, 2)
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-171-298', from: 'hand', location: 'base' })
    s = passBoth(s)
    expect(s.pending?.spec.kind).toBe('vision')
    const top = s.players[0].deck[0]
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'vision', recycle: true } })
    expect(s.players[0].deck[s.players[0].deck.length - 1]).toBe(top)
    expect(s.chain.length).toBe(0)
  })
})

describe('activated abilities', () => {
  it('The Syren: pay 1 + exhaust to recall a friendly unit', () => {
    let s = newGame({ [SKULKER]: 20 })
    const gear = addUnit(s, 0, 'ogn-184-298', 'base', { kind: 'gear' })
    const uid = addUnit(s, 0, SKULKER, 0)
    s = energy(s, 0, 1)
    s = run(s, { t: 'activateAbility', player: 0, source: { kind: 'unit', uid: gear }, abilityIx: 0 })
    expect(s.players[0].pool.energy).toBe(0)
    expect(s.units.find((x) => x.uid === gear)!.ready).toBe(false)
    // ability on chain → both pass → target choice → recall
    s = passBoth(s)
    expect(s.pending?.spec.kind).toBe('unit')
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'unit', uids: [uid] } })
    expect(s.units.find((x) => x.uid === uid)!.location).toBe('base')
  })

  it('Vi - Destructive: recycle a trash card to gain +1 Might this turn', () => {
    let s = newGame({ [SKULKER]: 20 })
    const vi = addUnit(s, 0, 'ogn-036-298', 'base')
    s.players[0].trash.push(SKULKER)
    s = run(s, { t: 'activateAbility', player: 0, source: { kind: 'unit', uid: vi }, abilityIx: 0 })
    // recycle cost choice
    expect(s.pending?.spec.kind).toBe('card')
    const spec = s.pending!.spec as { kind: 'card'; legal: number[] }
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'card', indices: spec.legal } })
    expect(s.players[0].trash.length).toBe(0)
    s = passBoth(s)
    expect(might(s, s.units.find((x) => x.uid === vi)!)).toBe(4) // 3 + 1
  })

  it('rejects activation without the resources', () => {
    let s = newGame({ [SKULKER]: 20 })
    const gear = addUnit(s, 0, 'ogn-184-298', 'base', { kind: 'gear' })
    expect(() =>
      applyAction(s, { t: 'activateAbility', player: 0, source: { kind: 'unit', uid: gear }, abilityIx: 0 })
    ).toThrow(IllegalAction)
  })
})

describe('legends', () => {
  it('Lee Sin: 1 energy + exhaust legend buffs a friendly unit', () => {
    let s = newGame({ [SKULKER]: 20 }, undefined, { legendA: 'ogn-257-298' })
    const uid = addUnit(s, 0, SKULKER, 'base')
    s = energy(s, 0, 1)
    s = run(s, { t: 'activateAbility', player: 0, source: { kind: 'legend' }, abilityIx: 0 })
    expect(s.players[0].legendReady).toBe(false)
    s = passBoth(s)
    expect(s.pending?.spec.kind).toBe('unit')
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'unit', uids: [uid] } })
    expect(s.units.find((x) => x.uid === uid)!.buffed).toBe(true)
    // Second activation this turn: legend exhausted
    s = energy(s, 0, 1)
    expect(() =>
      applyAction(s, { t: 'activateAbility', player: 0, source: { kind: 'legend' }, abilityIx: 0 })
    ).toThrow(IllegalAction)
  })

  it('Viktor: token creation on the board', () => {
    let s = newGame({ [SKULKER]: 20 }, undefined, { legendA: 'ogn-265-298' })
    s = energy(s, 0, 1)
    s = run(s, { t: 'activateAbility', player: 0, source: { kind: 'legend' }, abilityIx: 0 })
    s = passBoth(s)
    const token = s.units.find((u) => u.isToken)
    expect(token).toBeDefined()
    expect(token!.controller).toBe(0)
    // Tokens cease to exist when killed (no trash)
    const trashBefore = s.players[0].trash.length
    s = run(s, { t: 'manual', player: 0, op: { k: 'kill', unitUid: token!.uid } })
    expect(s.players[0].trash.length).toBe(trashBefore)
  })

  it("Annie: end-of-turn trigger readies up to 2 runes, then the turn ends", () => {
    let s = newGame({ [SKULKER]: 20 }, undefined, { legendA: 'ogs-017-024' })
    // exhaust both runes for energy
    for (const r of [...s.players[0].runes]) {
      s = run(s, { t: 'exhaustRune', player: 0, runeUid: r.uid })
    }
    s = run(s, { t: 'endTurn', player: 0 })
    // Ending Step trigger chains; the turn completes after both pass
    expect(s.turn).toBe(1)
    s = passBoth(s)
    expect(s.turn).toBe(2)
    expect(s.turnPlayer).toBe(1)
    expect(s.players[0].runes.every((r) => r.ready)).toBe(true)
  })
})

describe('battlefield scripts & auras', () => {
  it('Trifarian War Camp gives +1 Might to units there', () => {
    let s = newGame({ [SKULKER]: 20 }, undefined, {
      bfA: ['ogn-294-298', 'ogn-294-298', 'ogn-294-298'],
    })
    const here = addUnit(s, 0, SKULKER, 0)
    const away = addUnit(s, 0, SKULKER, 'base')
    expect(might(s, s.units.find((x) => x.uid === here)!)).toBe(4)
    expect(might(s, s.units.find((x) => x.uid === away)!)).toBe(3)
  })

  it('Grove of the God-Willow draws on hold', () => {
    let s = newGame({ [SKULKER]: 20 }, undefined, {
      bfA: ['ogn-280-298', 'ogn-280-298', 'ogn-280-298'],
    })
    const uid = addUnit(s, 0, SKULKER, 'base')
    // Alice's battlefield is index 0
    s = run(s, { t: 'move', player: 0, unitUids: [uid], to: 0 })
    s = passBoth(s) // showdown → control + conquer
    expect(s.battlefields[0].controller).toBe(0)
    s = run(s, { t: 'endTurn', player: 0 }, { t: 'endTurn', player: 1 })
    // Hold trigger chained during Alice's start of turn
    expect(s.chain.length).toBe(1)
    const hand = s.players[0].hand.length
    s = passBoth(s)
    expect(s.players[0].hand.length).toBe(hand + 1)
  })
})

describe('deflect, cost mods & watchers', () => {
  it('Deflect taxes opposing targeted choices (1 power of any domain)', () => {
    let s = newGame({ 'ogn-004-298': 20 }) // Cleave
    const poro = addUnit(s, 1, 'ogn-013-298', 'base') // Pouty Poro [Deflect]
    giveHand(s, 0, 'ogn-004-298')
    s = energy(s, 0, 1)
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-004-298', from: 'hand' })
    // No power in pool → the Deflect unit is not a legal target at all (809):
    // the choice fizzles instead of opening.
    expect(s.pending).toBeFalsy()
    s = passBoth(s) // resolve the targetless Cleave
    expect(s.units.some((u) => u.uid === poro)).toBe(true)
    // With 1 power, the choice opens and the tax is consumed on pick
    giveHand(s, 0, 'ogn-004-298')
    s = energy(s, 0, 1)
    s = run(s, { t: 'manual', player: 0, op: { k: 'power', who: 0, domain: 'Body', n: 1 } })
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-004-298', from: 'hand' })
    expect(s.pending?.spec.kind).toBe('unit')
    s = run(s, { t: 'choose', player: 0, choice: { kind: 'unit', uids: [poro] } })
    expect(s.players[0].pool.power.Body ?? 0).toBe(0)
  })

  it('Noxus Hopeful costs 2 less with Legion active', () => {
    let s = newGame({ 'ogn-012-298': 20 })
    giveHand(s, 0, 'ogn-012-298')
    s = energy(s, 0, 2)
    // No other card played: full cost 4 → unaffordable with 2
    expect(() =>
      applyAction(s, { t: 'playCard', player: 0, cardId: 'ogn-012-298', from: 'hand', location: 'base' })
    ).toThrow(IllegalAction)
    // Play another card first: Legion active → costs 2
    giveHand(s, 0, SKULKER)
    s = energy(s, 0, 3)
    s = run(s, { t: 'playCard', player: 0, cardId: SKULKER, from: 'hand', location: 'base' })
    s = run(s, { t: 'playCard', player: 0, cardId: 'ogn-012-298', from: 'hand', location: 'base' })
    expect(s.units.some((u) => u.cardId === 'ogn-012-298')).toBe(true)
    expect(s.players[0].pool.energy).toBe(0)
  })

  it('Highlander: the unit heals/exhausts/recalls instead of dying (once)', () => {
    let s = newGame({ 'ogs-020-024': 20 })
    const uid = addUnit(s, 0, SKULKER, 0)
    giveHand(s, 0, 'ogs-020-024')
    s = energy(s, 0, 4)
    s = castAt(s, 0, 'ogs-020-024', uid)
    s = passBoth(s)
    expect(s.watchers?.length).toBe(1)
    // Kill attempt → replaced
    s = run(s, { t: 'manual', player: 1, op: { k: 'kill', unitUid: uid } })
    const u = s.units.find((x) => x.uid === uid)!
    expect(u).toBeDefined()
    expect(u.location).toBe('base')
    expect(u.ready).toBe(false)
    // Watcher consumed: a second kill goes through
    s = run(s, { t: 'manual', player: 1, op: { k: 'kill', unitUid: uid } })
    expect(s.units.find((x) => x.uid === uid)).toBeUndefined()
  })
})

describe('conditional passives', () => {
  it('Raging Soul gains Assault/Ganking only after a discard this turn', () => {
    let s = newGame({ [SKULKER]: 20 })
    const uid = addUnit(s, 0, 'ogn-019-298', 'base')
    const u = () => s.units.find((x) => x.uid === uid)!
    u().combatRole = 'attacker'
    expect(might(s, u())).toBe(4) // no assault yet
    const some = s.players[0].hand[0]
    s = run(s, { t: 'manual', player: 0, op: { k: 'discard', who: 0, cardId: some } })
    s.units.find((x) => x.uid === uid)!.combatRole = 'attacker'
    expect(might(s, s.units.find((x) => x.uid === uid)!)).toBe(5) // +1 Assault
  })
})
