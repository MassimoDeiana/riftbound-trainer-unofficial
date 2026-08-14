// Battlefield card scripts — M1 pilot batch.
import type { CardScript } from '../ir'

export const BATTLEFIELD_SCRIPTS: Record<string, CardScript> = {
  // "Units here have +1 might."
  'ogn-294-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'mightAura', amount: 1, targets: { location: 'here', controller: 'any' } } },
    ],
  }, // Trifarian War Camp

  // "When you hold here, you may channel 1 rune exhausted."
  'ogn-288-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'holdHere' },
        optional: true,
        ops: [{ op: 'channel', n: 1, exhausted: true }],
      },
    ],
  }, // Startipped Peak

  // "When you conquer here, discard 1, then draw 1."
  'ogn-298-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquerHere' },
        ops: [
          { op: 'discard', n: 1, who: 'you' },
          { op: 'draw', n: 1 },
        ],
      },
    ],
  }, // Zaun Warrens

  // "When you hold here, draw 1."
  'ogn-280-298': {
    abilities: [{ kind: 'triggered', when: { on: 'holdHere' }, ops: [{ op: 'draw', n: 1 }] }],
  }, // Grove of the God-Willow

  // "When you conquer here, you may spend a buff to draw 1."
  'ogn-282-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquerHere' },
        ops: [
          {
            op: 'choose',
            bind: 'b',
            spec: { kind: 'unit', filter: { controller: 'you', hasBuff: true }, min: 1, max: 1 },
            optional: true,
          },
          {
            op: 'if',
            cond: { chose: 'b' },
            then: [
              { op: 'unbuff', target: { var: 'b' } },
              { op: 'draw', n: 1 },
            ],
          },
        ],
      },
    ],
  }, // Monastery of Hirana

  // "When you defend here, choose a unit. It gains [Shield 2] this combat."
  'ogn-279-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'defendHere' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, keywords: ['Shield 2'], duration: 'turn' }],
      },
    ],
  }, // Fortified Position

  // "When you hold here, play a 1 might Recruit unit token in your base."
  'ogn-275-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'holdHere' }, ops: [{ op: 'playToken', token: 'recruit', where: 'base' }] },
    ],
  }, // Altar to Unity

  // "When you hold here, buff a unit here."
  'ogn-283-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'holdHere' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Navori Fighting Pit

  // "When you defend here, you may move a friendly unit here to base."
  'ogn-285-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'defendHere' },
        optional: true,
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'moveTo', target: { var: 't' }, to: 'base' }],
      },
    ],
  }, // Reaver's Row

  // "Units here have [Ganking]."
  'ogn-297-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Ganking'], targets: { location: 'here', controller: 'any' } } },
    ],
  }, // Windswept Hillock

  // "When you conquer here, ready up to 2 runes at the end of this turn."
  'ogn-289-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquerHere' },
        ops: [{ op: 'atEndOfTurn', ops: [{ op: 'readyRunes', n: 2 }] }],
      },
    ],
  }, // Targon's Peak

  // "When you conquer here, look at the top two cards; recycle any; put back in any order."
  'ogn-291-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'conquerHere' }, ops: [{ op: 'lookTop', n: 2, keep: 2, rest: 'recycle' }] },
    ],
  }, // The Candlelit Sanctum

  // "When you hold here, if you have 7+ units here, you win the game."
  'ogn-293-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'holdHere' },
        ops: [
          {
            op: 'if',
            cond: { compare: [{ count: { controller: 'you', location: 'here' } }, '>=', 7] },
            then: [{ op: 'winGame' }],
          },
        ],
      },
    ],
  }, // The Grand Plaza

  // "When a unit moves from here, give it +1 might this turn."
  'ogn-277-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'moveFromHere' },
        ops: [{ op: 'give', target: { event: true }, might: 1, duration: 'turn' }],
      },
    ],
  }, // Back-Alley Bar

  // "When you hold here, you may return your Chosen Champion from your trash to
  //  your Champion Zone if it is empty."
  'ogn-281-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'holdHere' }, optional: true, ops: [{ op: 'championFromTrashToZone' }] },
    ],
  }, // Hallowed Tomb

  // ---- battlefields volontairement manuels ----
  'ogn-276-298': { manual: true }, // Aspirant's Climb — BANNIE + seuil de victoire modifié
  'ogn-278-298': { manual: true }, // Bandle Tree — emplacement caché supplémentaire
  'ogn-284-298': { manual: true }, // Obelisk of Power — BANNIE + « premier tour de chaque joueur »
  'ogn-286-298': { manual: true }, // Reckoner's Arena — réactivation d'effets de conquête
  'ogn-287-298': { manual: true }, // Sigil of the Storm — recyclage de runes forcé
  'ogn-290-298': { manual: true }, // The Arena's Greatest — BANNIE + points de départ
  'ogn-292-298': { manual: true }, // The Dreaming Tree — BANNIE + déclencheur de ciblage
  'ogn-295-298': { manual: true }, // Vilemaw's Lair — restriction de mouvement
  'ogn-296-298': { manual: true }, // Void Gate — Bonus Damage
}
