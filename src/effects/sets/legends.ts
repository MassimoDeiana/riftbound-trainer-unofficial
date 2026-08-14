// Legend card scripts — M1 pilot batch (the 7 precon legends).
import type { CardScript } from '../ir'

// "At the end of your turn, ready up to 2 runes."
const ANNIE: CardScript = {
  abilities: [{ kind: 'triggered', when: { on: 'endOfTurn' }, ops: [{ op: 'readyRunes', n: 2 }] }],
}

export const LEGEND_SCRIPTS: Record<string, CardScript> = {
  'ogs-017-024': ANNIE, // Annie - Dark Child (Starter)
  'opp-017-024': ANNIE, // Annie - Dark Child

  // "At start of your Beginning Phase, draw 1 if you have one or fewer cards in your hand."
  'ogn-251-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'startOfTurn' },
        ops: [{ op: 'if', cond: { compare: [{ handSize: 'you' }, '<=', 1] }, then: [{ op: 'draw', n: 1 }] }],
      },
    ],
  }, // Jinx - Loose Cannon

  // "1 energy, exhaust: Buff a friendly unit."
  'ogn-257-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Lee Sin - Blind Monk

  // "1 energy, exhaust: Play a 1 might Recruit unit token."
  'ogn-265-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, exhaustSelf: true },
        ops: [{ op: 'playToken', token: 'recruit', where: 'base' }],
      },
    ],
  }, // Viktor - Herald of the Arcane

  // "exhaust: [Reaction], [Legion] — Add 1 energy."
  'ogn-253-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'reaction',
        ops: [{ op: 'if', cond: { legion: true }, then: [{ op: 'addEnergy', n: 1 }] }],
      },
    ],
  }, // Darius - Hand of Noxus

  // "2 energy, exhaust: Move a friendly unit to or from its base."
  'ogn-259-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 2, exhaustSelf: true },
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              {
                label: 'Déplacer une unité alliée vers sa base',
                ops: [
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 } },
                  { op: 'moveTo', target: { var: 't' }, to: 'base' },
                ],
              },
              {
                label: 'Déplacer une unité alliée depuis sa base',
                ops: [
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'base' }, min: 1, max: 1 } },
                  { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 't' } } },
                  { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Yasuo - Unforgiven

  // "exhaust: Give a unit [Ganking] this turn."
  'ogn-267-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, keywords: ['Ganking'], duration: 'turn' }],
      },
    ],
  }, // Miss Fortune - Bounty Hunter

  // "When you play a spell that costs 5 energy or more, draw 1."
  'ogs-021-024': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Spell'], minEnergy: 5 } },
        ops: [{ op: 'draw', n: 1 }],
      },
    ],
  }, // Lux - Lady of Luminosity (Starter)

  // "While a friendly unit defends alone, it gets +2 might."
  'ogs-019-024': {
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'mightAura', amount: 2, targets: { controller: 'you', combatRole: 'defender' } },
        while: { not: { exists: { controller: 'you', combatRole: 'defender', notSelf: true } } },
      },
    ],
  }, // Master Yi - Wuju Bladesman (Starter) — approx : s'applique quand un seul défenseur allié

  // "When you conquer, if you have 4+ units at that battlefield, draw 2."
  'ogs-023-024': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquer' },
        ops: [
          {
            op: 'if',
            cond: { compare: [{ count: { controller: 'you', location: 'here' } }, '>=', 4] },
            then: [{ op: 'draw', n: 2 }],
          },
        ],
      },
    ],
  }, // Garen - Might of Demacia (Starter)
}
