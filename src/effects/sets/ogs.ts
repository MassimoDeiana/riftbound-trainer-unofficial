// Proving Grounds (OGS) card scripts.
import type { CardScript } from '../ir'

export const OGS_SCRIPTS: Record<string, CardScript> = {
  // "[Action] Deal 2 to a unit at a battlefield."
  'ogs-003-024': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'deal', n: 2, to: { var: 't' } }],
    },
  }, // Incinerate

  // "[Shield]" — keyword only, engine-native
  'ogs-005-024': { vanilla: true }, // Zephyr Sage

  // "[Assault 2], [Shield 2]" — keywords only, engine-native
  'ogs-007-024': { vanilla: true }, // Garen - Rugged

  // "[Action] Give a friendly unit +3 might this turn. Then choose an enemy unit.
  //  They deal damage equal to their Mights to each other."
  'ogs-008-024': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: 3, duration: 'turn' },
        { op: 'choose', bind: 'e', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
        { op: 'deal', n: { mightOf: { var: 't' } }, to: { var: 'e' } },
        { op: 'deal', n: { mightOf: { var: 'e' } }, to: { var: 't' } },
      ],
    },
  }, // Gentlemen's Duel

  // "[Ganking] I enter ready."
  'ogs-009-024': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'ready', target: { self: true } }] }],
  }, // Master Yi - Honed

  // "When you play me, return a spell from your trash to your hand."
  'ogs-010-024': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Spell'] }, min: 1, max: 1 } },
          { op: 'toHandFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Annie - Stubborn

  // "[Reaction] Move up to 2 friendly units to base."
  'ogs-011-024': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 2 }, optional: true }],
      ops: [{ op: 'moveTo', target: { var: 't' }, to: 'base' }],
    },
  }, // Flash

  // "[Action] Kill a unit at a battlefield."
  'ogs-012-024': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'kill', target: { var: 't' } }],
    },
  }, // Blast of Power

  // "Other friendly units have +1 might here."
  'ogs-013-024': {
    abilities: [
      { kind: 'passive', effect: { kind: 'mightAura', amount: 1, targets: { controller: 'you', location: 'here', notSelf: true } } },
    ],
  }, // Garen - Commander

  // "[Action] Play four 1 might Recruit unit tokens."
  'ogs-015-024': {
    spell: { ops: [{ op: 'playToken', token: 'recruit', n: 4, where: 'base' }] },
  }, // Recruit the Vanguard

  // "I enter ready."
  'ogs-016-024': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'ready', target: { self: true } }] }],
  }, // Vanguard Attendant

  // "When you play me, deal 3 to all units at battlefields."
  'ogs-018-024': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'deal', n: 3, to: { all: { location: 'battlefield' } } }] },
    ],
  }, // Tibbers

  // "[Action] Deal 8 to a unit."
  'ogs-022-024': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'deal', n: 8, to: { var: 't' } }],
    },
  }, // Final Spark

  // "[Action] Give friendly units +2 might this turn."
  'ogs-024-024': {
    spell: {
      ops: [{ op: 'give', target: { all: { controller: 'you' } }, might: 2, duration: 'turn' }],
    },
  }, // Decisive Strike

  // "Deal 3 to all enemy units at a battlefield."
  'ogs-002-024': {
    spell: {
      targets: [{ bind: 'bf', spec: { kind: 'battlefieldPick' } }],
      ops: [{ op: 'deal', n: 3, to: { all: { controller: 'opp', atVar: 'bf' } } }],
    },
  }, // Firestorm

  // "While you have 8+ runes, I have +4 might."
  'ogs-004-024': {
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'selfMight', amount: 4, while: { compare: [{ runesInPlay: 'you' }, '>=', 8] } },
      },
    ],
  }, // Master Yi - Meditative

  // "When you play a spell that costs 5 energy or more, give me +3 might this turn."
  'ogs-006-024': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Spell'], minEnergy: 5 } },
        ops: [{ op: 'give', target: { self: true }, might: 3, duration: 'turn' }],
      },
    ],
  }, // Lux - Illuminated

  // "[Reaction] Choose a friendly unit. The next time it would die this turn,
  //  heal it, exhaust it, and recall it instead."
  'ogs-020-024': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [{ op: 'watch', target: { var: 't' }, kind: 'preventDeathHeal' }],
    },
  }, // Highlander

  'ogs-001-024': { manual: true }, // Annie - Fiery — Bonus Damage
  'ogs-014-024': { manual: true }, // Lux - Crownguard — énergie restreinte aux sorts
}
