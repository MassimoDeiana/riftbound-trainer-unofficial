// Origins (OGN) card scripts — M1 pilot batch.
// Each entry is verified against the printed text (quoted in the comment).
import type { CardScript } from '../ir'

export const OGN_SCRIPTS: Record<string, CardScript> = {
  // "— " (vanilla)
  'ogn-175-298': { vanilla: true }, // Shipyard Skulker
  // "[Accelerate]" — keyword only, engine-native
  'ogn-001-298': { vanilla: true }, // Blazing Scorcher
  'ogn-010-298': { vanilla: true }, // Legion Rearguard
  // "[Deflect]" — keyword only (enforced with real targeting, M2)
  'ogn-013-298': { vanilla: true }, // Pouty Poro

  // "[Assault 2] When you play me, discard 1."
  'ogn-003-298': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'discard', n: 1, who: 'you' }] }],
  }, // Chemtech Enforcer
  // "[Accelerate][Assault 2] When you play me, discard 2."
  'ogn-030-298': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'discard', n: 2, who: 'you' }] }],
  }, // Jinx - Demolitionist

  // "[Action] Give a unit [Assault 3] this turn."
  'ogn-004-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, keywords: ['Assault 3'], duration: 'turn' }],
    },
  }, // Cleave

  // "[Action] Deal 3 to a unit at a battlefield. If this kills it, do this: draw 1."
  'ogn-005-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        { op: 'deal', n: 3, to: { var: 't' } },
        { op: 'if', cond: { dead: { var: 't' } }, then: [{ op: 'draw', n: 1 }] },
      ],
    },
  }, // Disintegrate

  // "[Action] Deal 4 to a unit at a battlefield. Draw 1."
  'ogn-024-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        { op: 'deal', n: 4, to: { var: 't' } },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Void Seeker

  // "[Reaction] Give a unit +2 might this turn. Draw 1."
  'ogn-058-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: 2, duration: 'turn' },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Discipline

  // "[Reaction] Give a friendly unit +1 might this turn, then an additional +1
  //  might this turn if it is the only unit you control there."
  'ogn-046-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: 1, duration: 'turn' },
        {
          op: 'if',
          cond: { onlyFriendlyAt: { var: 't' } },
          then: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }],
        },
      ],
    },
  }, // En Garde

  // "[Reaction] Return a unit at a battlefield with 3 might or less to its owner's hand."
  'ogn-169-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', maxMight: 3 }, min: 1, max: 1 } }],
      ops: [{ op: 'returnToHand', target: { var: 't' } }],
    },
  }, // Gust

  // "[Action] Return a unit at a battlefield to its owner's hand."
  'ogn-172-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'returnToHand', target: { var: 't' } }],
    },
  }, // Rebuke

  // "Move an enemy unit."
  'ogn-043-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 't' } } },
        { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' } },
      ],
    },
  }, // Charm

  // "[Action] Move a friendly unit and ready it."
  'ogn-173-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 't' } } },
        { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' }, ready: true },
      ],
    },
  }, // Ride The Wind

  // "[Reaction] Counter a spell that costs no more than 4 energy and no more than 1 power."
  'ogn-045-298': {
    spell: { ops: [{ op: 'counterSpell', maxEnergy: 4, maxPower: 1 }] },
  }, // Defy
  // "[Reaction] Counter a spell."
  'ogn-064-298': {
    spell: { ops: [{ op: 'counterSpell' }] },
  }, // Wind Wall

  // "[Action] Return a unit from your trash to your hand."
  'ogn-170-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'] }, min: 1, max: 1 } },
        { op: 'toHandFromTrash', bind: 'c' },
      ],
    },
  }, // Morbid Return

  // "When you play me, return a unit from your trash to your hand."
  'ogn-165-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'] }, min: 1, max: 1 } },
          { op: 'toHandFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Cemetery Attendant

  // "[Vision]" — when you play me, look at the top card; you may recycle it.
  'ogn-171-298': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] }],
  }, // Mystic Poro

  // "When I move, discard 1, then draw 1."
  'ogn-185-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          { op: 'discard', n: 1, who: 'you' },
          { op: 'draw', n: 1 },
        ],
      },
    ],
  }, // Traveling Merchant

  // "When this is played, discarded, or killed, draw 1." (Gear)
  'ogn-182-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'draw', n: 1 }] },
      { kind: 'triggered', when: { on: 'discardedSelf' }, ops: [{ op: 'draw', n: 1 }] },
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'draw', n: 1 }] },
    ],
  }, // Scrapheap

  // "[Deathknell] — Discard 2, then draw 2."
  'ogn-178-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [
          { op: 'discard', n: 2, who: 'you' },
          { op: 'draw', n: 2 },
        ],
      },
    ],
  }, // Undercover Agent

  // "[Tank] When you play me, move a unit from a battlefield to its base."
  'ogn-191-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [{ op: 'recall', target: { var: 't' } }],
      },
    ],
  }, // Maddened Marauder

  // "[Hidden][Action] Move a unit from a battlefield to its base."
  'ogn-168-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'recall', target: { var: 't' } }],
    },
  }, // Fight or Flight (banned in Standard; scripted for casual play)

  // "1 energy, exhaust: Move a friendly unit at a battlefield to its base." (Gear)
  'ogn-184-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [{ op: 'recall', target: { var: 't' } }],
      },
    ],
  }, // The Syren

  // "[Ganking] Recycle 1 from your trash: Give me +1 might this turn."
  'ogn-036-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { recycleTrash: 1 },
        ops: [{ op: 'give', target: { self: true }, might: 1, duration: 'turn' }],
      },
    ],
  }, // Vi - Destructive

  // "If you've discarded a card this turn, I have [Assault] and [Ganking]."
  'ogn-019-298': {
    keywords: [], // both keywords are conditional grants, not printed statics
    abilities: [
      {
        kind: 'passive',
        while: { discardedThisTurn: true },
        effect: { kind: 'grantKeywords', keywords: ['Assault 1', 'Ganking'], targets: { self: true } },
      },
    ],
  }, // Raging Soul

  // ---- batch 1 ----

  // "[Action] Deal 3 to a unit at a battlefield."
  'ogn-009-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'deal', n: 3, to: { var: 't' } }],
    },
  }, // Hextech Ray

  // "Other friendly units here have [Assault]."
  'ogn-015-298': {
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'grantKeywords', keywords: ['Assault 1'], targets: { controller: 'you', location: 'here', notSelf: true } },
      },
    ],
  }, // Captain Farron

  // "[Legion] — When you play me, give a unit +2 might this turn."
  'ogn-016-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'if',
            cond: { legion: true },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
              { op: 'give', target: { var: 't' }, might: 2, duration: 'turn' },
            ],
          },
        ],
      },
    ],
  }, // Dangerous Duo

  // "[Legion] — When you play me, discard 2, then draw 2."
  'ogn-020-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'if',
            cond: { legion: true },
            then: [
              { op: 'discard', n: 2, who: 'you' },
              { op: 'draw', n: 2 },
            ],
          },
        ],
      },
    ],
  }, // Scrapyard Champion

  // "[Action] Kill all gear."
  'ogn-022-298': {
    spell: { ops: [{ op: 'kill', target: { all: { kind: 'gear', controller: 'any' } } }] },
  }, // Thermo Beam

  // "Deal 3 to a unit. Deal 3 to a unit."
  'ogn-029-298': {
    spell: {
      targets: [
        { bind: 't1', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 't2', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'deal', n: 3, to: { var: 't1' } },
        { op: 'deal', n: 3, to: { var: 't2' } },
      ],
    },
  }, // Falling Star

  // "[Reaction] Choose an enemy unit. Deal 6 to it unless its controller has you draw 2."
  'ogn-033-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'pay', who: 'opp', spec: { kind: 'yesNo', prompt: 'Faire piocher 2 au lanceur pour éviter 6 dégâts ?' } },
        { op: 'if', cond: { var: 'pay' }, then: [{ op: 'draw', n: 2 }], else: [{ op: 'deal', n: 6, to: { var: 't' } }] },
      ],
    },
  }, // Shakedown

  // "When you play me, draw 1 for each of your [Mighty] units."
  'ogn-038-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'draw', n: { count: { controller: 'you', minMight: 5 } } }] },
    ],
  }, // Kadregrin the Infernal

  // "[Accelerate] When I conquer, draw 1."
  'ogn-039-298': {
    abilities: [{ kind: 'triggered', when: { on: 'conquer' }, ops: [{ op: 'draw', n: 1 }] }],
  }, // Kai'Sa - Survivor

  // "exhaust: [Reaction] — Add 1 Fury power."
  'ogn-040-298': {
    abilities: [
      { kind: 'activated', cost: { exhaustSelf: true }, timing: 'reaction', ops: [{ op: 'addPower', n: 1, domain: 'Fury' }] },
    ],
  }, // Seal of Rage

  'ogn-049-298': { vanilla: true }, // Playful Phantom

  // "[Action] Stun a unit."
  'ogn-050-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'stun', target: { var: 't' } }],
    },
  }, // Rune Prison

  // "When you play me, stun a unit."
  'ogn-051-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'stun', target: { var: 't' } }],
      },
    ],
  }, // Solari Shieldbearer

  'ogn-052-298': { vanilla: true }, // Stalwart Poro
  'ogn-054-298': { vanilla: true }, // Sunlit Guardian

  // "When I conquer, you may kill a gear. If you do, buff me."
  'ogn-056-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquer' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 }, optional: true }],
        ops: [
          {
            op: 'if',
            cond: { chose: 'g' },
            then: [
              { op: 'kill', target: { var: 'g' } },
              { op: 'buff', target: { self: true } },
            ],
          },
        ],
      },
    ],
  }, // Adaptatron

  // "[Hidden][Action] Give a unit [Shield 3] and [Tank] this turn."
  'ogn-057-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, keywords: ['Shield 3', 'Tank'], duration: 'turn' }],
    },
  }, // Block

  // "When you play me, if you control a Poro, buff me and draw 1."
  'ogn-061-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'if',
            cond: { exists: { controller: 'you', tag: 'Poro' } },
            then: [
              { op: 'buff', target: { self: true } },
              { op: 'draw', n: 1 },
            ],
          },
        ],
      },
    ],
  }, // Poro Herder

  // ---- batch 2 ----

  // "When you play this, buff a friendly unit. Friendly buffed units have [Deflect]…"
  'ogn-063-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Deflect'], targets: { controller: 'you', hasBuff: true } } },
    ],
  }, // Spirit's Refuge

  // "While I'm buffed, I have an additional +1 might."
  'ogn-065-298': {
    abilities: [{ kind: 'passive', effect: { kind: 'selfMight', amount: 1, while: { exists: { self: true, hasBuff: true } } } }],
  }, // Wizened Elder

  // "When I hold, you score 1 point."
  'ogn-066-298': {
    abilities: [{ kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'gainPoints', n: 1 }] }],
  }, // Ahri - Alluring

  // "[Tank] When you play me to a battlefield, you may move an enemy unit to here.
  //  When I hold, return me to my owner's hand."
  'ogn-067-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'if',
            cond: { selfAt: 'battlefield' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 }, optional: true },
              { op: 'if', cond: { chose: 't' }, then: [{ op: 'moveTo', target: { var: 't' }, to: 'here' }] },
            ],
          },
        ],
      },
      { kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'returnToHand', target: { self: true } }] },
    ],
  }, // Blitzcrank - Impassive

  // "[Action] Double a friendly unit's Might this turn. Give it [Temporary]."
  'ogn-069-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: { mightOf: { var: 't' } }, duration: 'turn' },
        { op: 'give', target: { var: 't' }, keywords: ['Temporary'], duration: 'permanent' },
      ],
    },
  }, // Last Stand

  // "Each other player chooses Cards or Runes…" (réduction 1v1)
  'ogn-071-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'm', who: 'opp', spec: { kind: 'yesNo', prompt: 'Choisir Cartes ? (Non = Runes)' } },
        {
          op: 'if',
          cond: { var: 'm' },
          then: [{ op: 'draw', n: 1, who: 'each' }],
          else: [{ op: 'channel', n: 1, who: 'each', exhausted: true }],
        },
      ],
    },
  }, // Party Favors

  // "At the end of your turn, if I'm at a battlefield, ready up to 4 friendly runes."
  'ogn-073-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'endOfTurn' },
        ops: [{ op: 'if', cond: { selfAt: 'battlefield' }, then: [{ op: 'readyRunes', n: 4 }] }],
      },
    ],
  }, // Sona - Harmonious

  // "[Shield][Tank] Other friendly units here have [Shield]."
  'ogn-074-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Shield 1'], targets: { controller: 'you', location: 'here', notSelf: true } } },
    ],
  }, // Taric - Protector

  // "[Accelerate] [Deathknell] — Channel 2 runes exhausted and draw 1."
  'ogn-075-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [
          { op: 'channel', n: 2, exhausted: true },
          { op: 'draw', n: 1 },
        ],
      },
    ],
  }, // Tasty Faefolk

  // "When I attack, deal damage equal to my Might to an enemy unit here."
  'ogn-076-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: { mightOf: { self: true } }, to: { var: 't' } }],
      },
    ],
  }, // Yasuo - Remorseful

  // "exhaust: [Reaction] — Add 1 Calm power."
  'ogn-081-298': {
    abilities: [
      { kind: 'activated', cost: { exhaustSelf: true }, timing: 'reaction', ops: [{ op: 'addPower', n: 1, domain: 'Calm' }] },
    ],
  }, // Seal of Focus

  // "When you play me, give a unit +8 might this turn."
  'ogn-082-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 8, duration: 'turn' }],
      },
    ],
  }, // Whiteflame Protector

  // "[Hidden][Reaction] Draw 2."
  'ogn-083-298': {
    spell: { ops: [{ op: 'draw', n: 2 }] },
  }, // Consult the Past

  // "[Action] Deal 6 to a unit at a battlefield."
  'ogn-085-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'deal', n: 6, to: { var: 't' } }],
    },
  }, // Falling Comet

  // "[Vision][Shield]"
  'ogn-086-298': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] }],
  }, // Jeweled Colossus

  // "[Tank] When you play me, draw 1."
  'ogn-087-298': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'draw', n: 1 }] }],
  }, // Lecturing Yordle

  'ogn-088-298': { vanilla: true }, // Mega-Mech

  // "exhaust: Give a unit -1 might this turn, to a minimum of 1 might."
  'ogn-090-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: -1, duration: 'turn' }],
      },
    ],
  }, // Orb of Regret

  // "When you play me, deal 6 to an enemy unit at a battlefield."
  'ogn-092-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: 6, to: { var: 't' } }],
      },
    ],
  }, // Riptide Rex

  // "[Reaction] Give a unit -4 might this turn, to a minimum of 1 might."
  'ogn-093-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: -4, duration: 'turn' }],
    },
  }, // Smoke Screen

  // "[Hidden][Action] Play a ready 3 might Sprite unit token with [Temporary]."
  'ogn-094-298': {
    spell: { ops: [{ op: 'playToken', token: 'sprite', where: 'base' }] },
  }, // Sprite Call

  // "[Reaction] Give a unit -1 might this turn… Draw 1."
  'ogn-095-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: -1, duration: 'turn' },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Stupefy

  // "[Deathknell] — Draw 1."
  'ogn-096-298': {
    abilities: [{ kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'draw', n: 1 }] }],
  }, // Watchful Sentry

  // "[Hidden] When you play me, give a unit -2 might this turn…"
  'ogn-097-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: -2, duration: 'turn' }],
      },
    ],
  }, // Blastcone Fae

  // "exhaust: [Reaction] — Add 1 energy."
  'ogn-098-298': {
    abilities: [
      { kind: 'activated', cost: { exhaustSelf: true }, timing: 'reaction', ops: [{ op: 'addEnergy', n: 1 }] },
    ],
  }, // Energy Conduit

  // "Recycle 3 from your trash, 1 energy, exhaust: Draw 1."
  'ogn-099-298': {
    abilities: [
      { kind: 'activated', cost: { recycleTrash: 3, energy: 1, exhaustSelf: true }, ops: [{ op: 'draw', n: 1 }] },
    ],
  }, // Garbage Grabber

  // "[Vision] Other friendly units have [Vision]." (aura non fonctionnelle : voir M3)
  'ogn-100-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] },
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Vision'], targets: { controller: 'you', notSelf: true } } },
    ],
  }, // Gemcraft Seer

  // "[Reaction] Return a friendly unit to its owner's hand. Its owner channels 1 rune exhausted."
  'ogn-104-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'returnToHand', target: { var: 't' } },
        { op: 'channel', n: 1, exhausted: true },
      ],
    },
  }, // Retreat

  // "Deal 6 to each of up to two units."
  'ogn-105-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 2 }, optional: true }],
      ops: [{ op: 'deal', n: 6, to: { var: 't' } }],
    },
  }, // Singularity

  // "When you play me, play a ready 3 might Sprite unit token with [Temporary] here."
  'ogn-106-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'sprite', where: 'here' }] },
    ],
  }, // Sprite Mother

  // ---- batch 3 ----

  // "Draw 4."
  'ogn-114-298': {
    spell: { ops: [{ op: 'draw', n: 4 }] },
  }, // Progress Day

  // "exhaust: [Reaction] — Add 1 Mind power."
  'ogn-120-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'reaction',
        ops: [{ op: 'addPower', n: 1, domain: 'Mind' }],
      },
    ],
  }, // Seal of Insight

  // "Exhaust all friendly units, then deal 12 to ALL units at battlefields."
  'ogn-123-298': {
    spell: {
      ops: [
        { op: 'exhaust', target: { all: { controller: 'you' } } },
        { op: 'deal', n: 12, to: { all: { location: 'battlefield' } } },
      ],
    },
  }, // Unchecked Power

  // "exhaust: Buff an exhausted friendly unit."
  'ogn-124-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', exhausted: true }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Arena Bar

  // "While I'm buffed, I have [Ganking]."
  'ogn-125-298': {
    keywords: [],
    abilities: [
      {
        kind: 'passive',
        while: { exists: { self: true, hasBuff: true } },
        effect: { kind: 'grantKeywords', keywords: ['Ganking'], targets: { self: true } },
      },
    ],
  }, // Bilgewater Bully

  // "[Action] Choose a friendly unit and an enemy unit. They deal damage equal to their Mights to each other."
  'ogn-128-298': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'deal', n: { mightOf: { var: 'a' } }, to: { var: 'b' } },
        { op: 'deal', n: { mightOf: { var: 'b' } }, to: { var: 'a' } },
      ],
    },
  }, // Challenge

  // "When I attack, deal 1 to an enemy unit here."
  'ogn-130-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: 1, to: { var: 't' } }],
      },
    ],
  }, // Crackshot Corsair

  // "When I attack, give me +2 might this turn if there is a ready enemy unit here."
  'ogn-131-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          {
            op: 'if',
            cond: { exists: { controller: 'opp', location: 'here', exhausted: false } },
            then: [{ op: 'give', target: { self: true }, might: 2, duration: 'turn' }],
          },
        ],
      },
    ],
  }, // Dune Drake

  // "When you play me, ready another unit."
  'ogn-132-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'ready', target: { var: 't' } }],
      },
    ],
  }, // First Mate

  // "[Reaction] Deal 1 to all units at battlefields."
  'ogn-133-298': {
    spell: { ops: [{ op: 'deal', n: 1, to: { all: { location: 'battlefield' } } }] },
  }, // Flurry of Blades

  'ogn-135-298': { vanilla: true }, // Pakaa Cub

  // "When you play me, buff another friendly unit."
  'ogn-136-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Pit Rookie

  // "[Tank] When you play me, channel 1 rune exhausted."
  'ogn-137-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'channel', n: 1, exhausted: true }] },
    ],
  }, // Stormclaw Ursine

  // "When you play me, buff up to two other friendly units."
  'ogn-141-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [
          {
            bind: 't',
            spec: { kind: 'unit', filter: { controller: 'you', notSelf: true }, min: 1, max: 2 },
            optional: true,
          },
        ],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Kinkou Monk

  'ogn-142-298': { vanilla: true }, // Mountain Drake

  // "[Action] Give a unit +7 might this turn."
  'ogn-154-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: 7, duration: 'turn' }],
    },
  }, // Primal Strength

  // "When you play me, you may spend a buff to buff me and ready me."
  'ogn-147-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [
          {
            bind: 'b',
            spec: { kind: 'unit', filter: { controller: 'you', hasBuff: true }, min: 1, max: 1 },
            optional: true,
          },
        ],
        ops: [
          {
            op: 'if',
            cond: { chose: 'b' },
            then: [
              { op: 'unbuff', target: { var: 'b' } },
              { op: 'buff', target: { self: true } },
              { op: 'ready', target: { self: true } },
            ],
          },
        ],
      },
    ],
  }, // Wildclaw Shaman

  // "When I attack, deal 3 to all enemy units here."
  'ogn-148-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [{ op: 'deal', n: 3, to: { all: { controller: 'opp', location: 'here' } } }],
      },
    ],
  }, // Anivia - Primal

  // "When you play me, choose an enemy unit at a battlefield. We deal damage equal to our Mights to each other."
  'ogn-149-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [
          { op: 'deal', n: { mightOf: { self: true } }, to: { var: 't' } },
          { op: 'deal', n: { mightOf: { var: 't' } }, to: { self: true } },
        ],
      },
    ],
  }, // Carnivorous Snapvine

  // "[Accelerate] Other buffed friendly units at my battlefield have +2 might."
  'ogn-151-298': {
    abilities: [
      {
        kind: 'passive',
        while: { selfAt: 'battlefield' },
        effect: { kind: 'mightAura', amount: 2, targets: { controller: 'you', location: 'here', hasBuff: true, notSelf: true } },
      },
    ],
  }, // Lee Sin - Centered

  // "[Action] For each friendly unit, you may spend its buff to ready it. Then buff all friendly units."
  'ogn-153-298': {
    spell: {
      ops: [
        {
          op: 'forEach',
          over: { controller: 'you', hasBuff: true },
          bind: 'u',
          ops: [
            { op: 'choose', bind: 'p', spec: { kind: 'yesNo', prompt: 'Dépenser le buff de cette unité pour la redresser ?' } },
            {
              op: 'if',
              cond: { var: 'p' },
              then: [
                { op: 'unbuff', target: { var: 'u' } },
                { op: 'ready', target: { var: 'u' } },
              ],
            },
          ],
        },
        { op: 'buff', target: { all: { controller: 'you' } } },
      ],
    },
  }, // Overt Operation

  // ---- batch 4 ----

  // "[Deflect] When I conquer, draw 1 or channel 1 rune exhausted."
  'ogn-155-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquer' },
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              { label: 'Piocher 1', ops: [{ op: 'draw', n: 1 }] },
              { label: 'Canaliser 1 rune engagée', ops: [{ op: 'channel', n: 1, exhausted: true }] },
            ],
          },
        ],
      },
    ],
  }, // Qiyana - Victorious

  // "exhaust: [Reaction] — Add 1 Body power."
  'ogn-163-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'reaction',
        ops: [{ op: 'addPower', n: 1, domain: 'Body' }],
      },
    ],
  }, // Seal of Strength

  // "When I'm played and when I conquer, buff me. Spend my buff: Give me +4 might this turn."
  'ogn-164-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'buff', target: { self: true } }] },
      { kind: 'triggered', when: { on: 'conquer' }, ops: [{ op: 'buff', target: { self: true } }] },
      {
        kind: 'activated',
        cost: { spendBuffSelf: true },
        ops: [{ op: 'give', target: { self: true }, might: 4, duration: 'turn' }],
      },
    ],
  }, // Sett - Brawler

  // "[Action] Each player kills one of their gear."
  'ogn-179-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'a', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 } },
        { op: 'choose', bind: 'b', who: 'opp', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'opp' }, min: 1, max: 1 } },
        { op: 'kill', target: { var: 'a' } },
        { op: 'kill', target: { var: 'b' } },
      ],
    },
  }, // Acceptable Losses

  // "Give a unit at a battlefield or a gear [Temporary]."
  'ogn-180-298': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            {
              label: 'Une unité sur un champ de bataille',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } },
                { op: 'give', target: { var: 't' }, keywords: ['Temporary'], duration: 'permanent' },
              ],
            },
            {
              label: 'Un équipement',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 } },
                { op: 'give', target: { var: 't' }, keywords: ['Temporary'], duration: 'permanent' },
              ],
            },
          ],
        },
      ],
    },
  }, // Fading Memories

  // "When this leaves the board, draw 1 and channel 1 rune exhausted. Chaos, exhaust: Kill this."
  // NB: « leaves the board » scripté comme deathknell (couvre les morts, pas les renvois).
  'ogn-186-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [
          { op: 'draw', n: 1 },
          { op: 'channel', n: 1, exhausted: true },
        ],
      },
      {
        kind: 'activated',
        cost: { power: { n: 1, domain: 'Chaos' }, exhaustSelf: true },
        ops: [{ op: 'kill', target: { self: true } }],
      },
    ],
  }, // Treasure Trove

  // "Starting with the next player, each player may return a unit to its owner's hand."
  'ogn-187-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'a', who: 'opp', spec: { kind: 'unit', filter: {}, min: 1, max: 1 }, optional: true },
        { op: 'if', cond: { chose: 'a' }, then: [{ op: 'returnToHand', target: { var: 'a' } }] },
        { op: 'choose', bind: 'b', who: 'you', spec: { kind: 'unit', filter: {}, min: 1, max: 1 }, optional: true },
        { op: 'if', cond: { chose: 'b' }, then: [{ op: 'returnToHand', target: { var: 'b' } }] },
      ],
    },
  }, // Whirlwind

  // "When you play me, return another unit at a battlefield to its owner's hand."
  'ogn-188-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'returnToHand', target: { var: 't' } }],
      },
    ],
  }, // Zaunite Bouncer

  // "[Deathknell] — Deal 4 to all units at my battlefield."
  'ogn-190-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [{ op: 'deal', n: 4, to: { all: { controller: 'any', location: 'here' } } }],
      },
    ],
  }, // Kog'Maw - Caustic

  // "[Hidden] When you play me, give me +3 might this turn."
  'ogn-197-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'give', target: { self: true }, might: 3, duration: 'turn' }],
      },
    ],
  }, // Teemo - Scout

  // "Each player discards their hand, then draws 4."
  'ogn-201-298': {
    spell: {
      ops: [
        { op: 'discard', n: { handSize: 'you' }, who: 'you' },
        { op: 'discard', n: { handSize: 'opp' }, who: 'opp' },
        { op: 'draw', n: 4, who: 'each' },
      ],
    },
  }, // Invert Timelines

  // "exhaust: [Reaction] — Add 1 Chaos power."
  'ogn-204-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'reaction',
        ops: [{ op: 'addPower', n: 1, domain: 'Chaos' }],
      },
    ],
  }, // Seal of Discord

  // "[Reaction] Give two friendly units each +2 might this turn."
  'ogn-206-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 2, max: 2 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: 2, duration: 'turn' }],
    },
  }, // Back to Back

  // "Each player kills one of their units."
  'ogn-209-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { op: 'choose', bind: 'b', who: 'opp', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
        { op: 'kill', target: { var: 'a' } },
        { op: 'kill', target: { var: 'b' } },
      ],
    },
  }, // Cull the Weak

  'ogn-210-298': { vanilla: true }, // Daring Poro

  // "When you play me, play a 1 might Recruit unit token here."
  'ogn-211-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'playToken', token: 'recruit', where: 'here' }],
      },
    ],
  }, // Faithful Manufactor

  // "When you play this, play a 1 might Recruit unit token at your base.
  //  Kill this: Recycle up to 4 cards from trashes." (limité à ta défausse)
  'ogn-212-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'playToken', token: 'recruit', where: 'base' }],
      },
      {
        kind: 'activated',
        cost: { killSelf: true },
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', min: 0, max: 4 } },
          { op: 'recycleFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Forge of the Future

  // ---- batch 5 ----

  'ogn-215-298': { vanilla: true }, // Petty Officer

  // "[Deathknell] — Channel 1 rune exhausted."
  'ogn-216-298': {
    abilities: [{ kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'channel', n: 1, exhausted: true }] }],
  }, // Soaring Scout

  // "[Legion] — When you play me, buff me."
  'ogn-217-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'if', cond: { legion: true }, then: [{ op: 'buff', target: { self: true } }] }],
      },
    ],
  }, // Trifarian Gloryseeker

  // "[Legion] — When you play me, play two 1 might Recruit unit tokens here."
  'ogn-218-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'if', cond: { legion: true }, then: [{ op: 'playToken', token: 'recruit', n: 2, where: 'here' }] }],
      },
    ],
  }, // Vanguard Captain

  'ogn-219-298': { vanilla: true }, // Vanguard Sergeant

  // "When I move to a battlefield, play a 1 might Recruit unit token here."
  'ogn-222-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [{ op: 'if', cond: { selfAt: 'battlefield' }, then: [{ op: 'playToken', token: 'recruit', where: 'here' }] }],
      },
    ],
  }, // Noxian Drummer

  // "When you play me, buff me. Then, if I am at a battlefield, buff all other friendly units there."
  'ogn-223-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'buff', target: { self: true } },
          {
            op: 'if',
            cond: { selfAt: 'battlefield' },
            then: [{ op: 'buff', target: { all: { controller: 'you', location: 'here', notSelf: true } } }],
          },
        ],
      },
    ],
  }, // Peak Guardian

  // "[Action] You may kill up to one gear. Draw 1."
  'ogn-224-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 }, optional: true }],
      ops: [
        { op: 'if', cond: { chose: 't' }, then: [{ op: 'kill', target: { var: 't' } }] },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Salvage

  // "When a buffed friendly unit dies, buff another friendly unit."
  'ogn-228-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'you', hasBuff: true } },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Vanguard Helm

  // "Kill a unit."
  'ogn-229-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'kill', target: { var: 't' } }],
    },
  }, // Vengeance

  // "When you play me, spend any number of buffs. For each buff spent, channel 1 rune exhausted."
  'ogn-230-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'forEach',
            over: { controller: 'you', hasBuff: true },
            bind: 'u',
            ops: [
              { op: 'choose', bind: 'yn', spec: { kind: 'yesNo', prompt: 'Dépenser le buff de cette unité ?' } },
              {
                op: 'if',
                cond: { var: 'yn' },
                then: [
                  { op: 'unbuff', target: { var: 'u' } },
                  { op: 'channel', n: 1, exhausted: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Albus Ferros

  // "While I'm [Mighty], I have [Deflect], [Ganking], and [Shield]."
  'ogn-232-298': {
    keywords: [],
    abilities: [
      {
        kind: 'passive',
        while: { compare: [{ mightOf: { self: true } }, '>=', 5] },
        effect: { kind: 'grantKeywords', keywords: ['Deflect', 'Ganking', 'Shield 1'], targets: { self: true } },
      },
    ],
  }, // Fiora - Victorious

  // "[Action] Give friendly units +5 might this turn."
  'ogn-233-298': {
    spell: {
      ops: [{ op: 'give', target: { all: { controller: 'you' } }, might: 5, duration: 'turn' }],
    },
  }, // Grand Strategem

  // "When you play me, kill an enemy unit."
  'ogn-234-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
        ops: [{ op: 'kill', target: { var: 't' } }],
      },
    ],
  }, // Harnessed Dragon

  // "…each other player chooses a unit you don't control… Kill those units." (1v1)
  'ogn-237-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 't', who: 'opp', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
        { op: 'kill', target: { var: 't' } },
      ],
    },
  }, // King's Edict

  // "[Shield] When I attack, stun an enemy unit here."
  'ogn-238-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'stun', target: { var: 't' } }],
      },
    ],
  }, // Leona - Determined

  // "[Deathknell] — Play three 1 might Recruit unit tokens into your base."
  'ogn-239-298': {
    abilities: [{ kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'playToken', token: 'recruit', n: 3, where: 'base' }] }],
  }, // Machine Evangel

  'ogn-241-298': { vanilla: true }, // Shen - Kinkou

  // "[Legion] — When you play me, ready me. Other friendly units have +1 might here."
  'ogn-243-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'if', cond: { legion: true }, then: [{ op: 'ready', target: { self: true } }] }],
      },
      { kind: 'passive', effect: { kind: 'mightAura', amount: 1, targets: { controller: 'you', location: 'here', notSelf: true } } },
    ],
  }, // Darius - Executioner

  // "exhaust: [Reaction] — Add 1 Order power."
  'ogn-245-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'reaction',
        ops: [{ op: 'addPower', n: 1, domain: 'Order' }],
      },
    ],
  }, // Seal of Unity

  // "Deal 2 to a unit. (x6)"
  'ogn-248-298': {
    spell: {
      targets: [
        { bind: 't1', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 't2', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 't3', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 't4', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 't5', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 't6', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'deal', n: 2, to: { var: 't1' } },
        { op: 'deal', n: 2, to: { var: 't2' } },
        { op: 'deal', n: 2, to: { var: 't3' } },
        { op: 'deal', n: 2, to: { var: 't4' } },
        { op: 'deal', n: 2, to: { var: 't5' } },
        { op: 'deal', n: 2, to: { var: 't6' } },
      ],
    },
  }, // Icathian Rain

  // "[Action] Ready a friendly unit. It deals damage equal to its Might to an enemy unit at a battlefield."
  'ogn-260-298': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'ready', target: { var: 'a' } },
        { op: 'deal', n: { mightOf: { var: 'a' } }, to: { var: 'b' } },
      ],
    },
  }, // Last Breath

  // "Buff a friendly unit in your base, then move it to a battlefield."
  'ogn-270-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'base' }, min: 1, max: 1 } }],
      ops: [
        { op: 'buff', target: { var: 't' } },
        { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 't' } } },
        { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' } },
      ],
    },
  }, // Showstopper

  // ---- round 2, batches 1-2 ----

  // "[Legion] — I cost 2 energy less."
  'ogn-012-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -2, while: { legion: true } } },
    ],
  }, // Noxus Hopeful

  // "My Might is increased by your points."
  'ogn-028-298': {
    abilities: [{ kind: 'passive', effect: { kind: 'selfMight', amount: { pointsOf: 'you' } } }],
  }, // Draven - Showboat

  // "You may pay 1 Calm power as an additional cost to play me. If you paid, draw 1."
  'ogn-044-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 1, domain: 'Calm' } }, prompt: 'Payer 1 puissance Calm pour piocher 1 ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'draw', n: 1 }] },
        ],
      },
    ],
  }, // Clockwork Keeper

  // "When you stun an enemy unit, ready me and give me +1 might this turn."
  'ogn-059-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youStun' },
        ops: [
          { op: 'ready', target: { self: true } },
          { op: 'give', target: { self: true }, might: 1, duration: 'turn' },
        ],
      },
    ],
  }, // Eclipse Herald

  // "When you kill a stunned enemy unit, you may exhaust this to draw 1."
  'ogn-072-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'opp', stunned: true } },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { exhaustSelf: true }, prompt: 'Engager cet équipement pour piocher 1 ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'draw', n: 1 }] },
        ],
      },
    ],
  }, // Solari Shrine

  // "When you play a gear, ready me."
  'ogn-091-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Gear'] } },
        ops: [{ op: 'ready', target: { self: true } }],
      },
    ],
  }, // Pit Crew

  // "When you play a spell, give me +1 might this turn."
  'ogn-103-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Spell'] } },
        ops: [{ op: 'give', target: { self: true }, might: 1, duration: 'turn' }],
      },
    ],
  }, // Ravenbloom Student

  // "My Might is increased by the number of cards in your trash.
  //  At the start of your Beginning Phase, recycle 3 from your trash."
  'ogn-109-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'selfMight', amount: { trashSize: 'you' } } },
      {
        kind: 'triggered',
        when: { on: 'startOfTurn' },
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', min: 3, max: 3 } },
          { op: 'recycleFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Dr. Mundo - Expert

  // "Kill a friendly unit or gear, exhaust: [Action] — Add 2 power of any domain."
  'ogn-113-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'action',
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { kind: 'any', controller: 'you' }, min: 1, max: 1 } }],
        ops: [
          { op: 'kill', target: { var: 't' } },
          { op: 'addPower', n: 2, domain: 'any' },
        ],
      },
    ],
  }, // Malzahar - Fanatic

  // "[Accelerate] When you play me, give enemy units -3 might this turn…"
  'ogn-116-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'give', target: { all: { controller: 'opp' } }, might: -3, duration: 'turn' }],
      },
    ],
  }, // Thousand-Tailed Watcher

  // "The first time a friendly unit dies each turn, draw 1."
  'ogn-118-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'you' } },
        oncePerTurn: true,
        ops: [{ op: 'draw', n: 1 }],
      },
    ],
  }, // Wraith of Echoes

  // "When I attack or defend, give an enemy unit here -2 might this turn…"
  'ogn-119-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: -2, duration: 'turn' }],
      },
      {
        kind: 'triggered',
        when: { on: 'defend' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: -2, duration: 'turn' }],
      },
    ],
  }, // Ahri - Inquisitive

  // "When you play another unit, buff me."
  'ogn-139-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Unit'] } },
        ops: [{ op: 'buff', target: { self: true } }],
      },
    ],
  }, // Cithria of Cloudfield

  // "When you buff a friendly unit, you may pay 1 Body and exhaust this to ready it."
  'ogn-152-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youBuff' },
        ops: [
          {
            op: 'choose',
            bind: 'p',
            spec: {
              kind: 'mayPay',
              cost: { power: { n: 1, domain: 'Body' }, exhaustSelf: true },
              prompt: 'Payer 1 Corps et engager Mistfall pour redresser cette unité ?',
            },
          },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'ready', target: { event: true } }] },
        ],
      },
    ],
  }, // Mistfall

  // "I enter ready. When I attack, kill all damaged enemy units here."
  'ogn-159-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'ready', target: { self: true } }] },
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [{ op: 'kill', target: { all: { controller: 'opp', location: 'here', damaged: true } } }],
      },
    ],
  }, // Warwick - Hunter

  // "[Accelerate][Ganking] The first time I move each turn, you may ready something else."
  'ogn-162-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        oncePerTurn: true,
        optional: true,
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              {
                label: 'Redresser une unité ou un équipement épuisé',
                ops: [
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { kind: 'any', exhausted: true, notSelf: true }, min: 1, max: 1 } },
                  { op: 'ready', target: { var: 't' } },
                ],
              },
              { label: 'Redresser une rune épuisée', ops: [{ op: 'readyRunes', n: 1 }] },
            ],
          },
        ],
      },
    ],
  }, // Miss Fortune - Captain

  // "exhaust: Return another friendly gear or unit to its owner's hand."
  'ogn-181-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { kind: 'any', controller: 'you', notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'returnToHand', target: { var: 't' } }],
      },
    ],
  }, // Pack of Wonders

  // "[Action] Look at the top 3, put 1 into your hand, recycle the rest."
  'ogn-183-298': {
    spell: {
      ops: [
        { op: 'lookTop', n: 3, keep: 1, rest: 'recycle' },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Stacked Deck

  // ---- round 2, batch 3 ----

  // "When you discard one or more cards, ready me and give me +1 might this turn."
  'ogn-202-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youDiscard' },
        ops: [
          { op: 'ready', target: { self: true } },
          { op: 'give', target: { self: true }, might: 1, duration: 'turn' },
        ],
      },
    ],
  }, // Jinx - Rebel

  // "[Hidden][Action] Stun a friendly unit and an enemy unit at the same battlefield."
  'ogn-220-298': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp', atUnitVar: 'a' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'stun', target: { var: 'a' } },
        { op: 'stun', target: { var: 'b' } },
      ],
    },
  }, // Facebreaker

  // "When you play me, choose an enemy unit. If it is stunned, kill it. Otherwise, stun it."
  'ogn-225-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              {
                label: 'Tuer une unité ennemie étourdie',
                ops: [
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', stunned: true }, min: 1, max: 1 } },
                  { op: 'kill', target: { var: 't' } },
                ],
              },
              {
                label: 'Étourdir une unité ennemie non étourdie',
                ops: [
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', stunned: false }, min: 1, max: 1 } },
                  { op: 'stun', target: { var: 't' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Solari Chief

  // "[Tank] I get +1 might for each buffed friendly unit at my battlefield."
  'ogn-240-298': {
    abilities: [
      {
        kind: 'passive',
        effect: {
          kind: 'selfMight',
          amount: { count: { controller: 'you', hasBuff: true, location: 'here' } },
          while: { selfAt: 'battlefield' },
        },
      },
    ],
  }, // Sett - Kingpin

  // "When another non-Recruit unit you control dies, play a 1 might Recruit unit token into your base."
  'ogn-246-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'you', notTag: 'Recruit', notSelf: true } },
        ops: [{ op: 'playToken', token: 'recruit', where: 'base' }],
      },
    ],
  }, // Viktor - Leader

  // "Choose a friendly unit in your base. Deal damage equal to its Might to all enemy units
  //  at a battlefield, then move your unit there."
  'ogn-250-298': {
    spell: {
      targets: [{ bind: 'u', spec: { kind: 'unit', filter: { controller: 'you', location: 'base' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'bf', spec: { kind: 'battlefieldPick' } },
        { op: 'deal', n: { mightOf: { var: 'u' } }, to: { all: { controller: 'opp', atVar: 'bf' } } },
        { op: 'moveTo', target: { var: 'u' }, to: { var: 'bf' } },
      ],
    },
  }, // Stormbringer

  // "Move an enemy unit. Then: choose another enemy unit at its destination.
  //  They deal damage equal to their Mights to each other."
  'ogn-258-298': {
    spell: {
      targets: [{ bind: 'a', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 'a' } } },
        { op: 'moveTo', target: { var: 'a' }, to: { var: 'loc' } },
        { op: 'choose', bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp', atUnitVar: 'a', notVar: 'a' }, min: 1, max: 1 } },
        { op: 'deal', n: { mightOf: { var: 'a' } }, to: { var: 'b' } },
        { op: 'deal', n: { mightOf: { var: 'b' } }, to: { var: 'a' } },
      ],
    },
  }, // Dragon's Rage

  // "When you stun one or more enemy units, buff a friendly unit."
  'ogn-261-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youStun' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Leona - Radiant Dawn

  // "[Action] Stun an enemy unit at a battlefield. You may move a friendly unit to that battlefield."
  'ogn-262-298': {
    spell: {
      targets: [
        { bind: 'e', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } },
        { bind: 'f', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 }, optional: true },
      ],
      ops: [
        { op: 'stun', target: { var: 'e' } },
        { op: 'if', cond: { chose: 'f' }, then: [{ op: 'moveTo', target: { var: 'f' }, to: { atUnit: 'e' } }] },
      ],
    },
  }, // Zenith Blade

  // "[Reaction] Choose a battlefield. Friendly units there +1, enemy units there -1 this turn."
  'ogn-266-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'bf', spec: { kind: 'battlefieldPick' } },
        { op: 'give', target: { all: { controller: 'you', atVar: 'bf' } }, might: 1, duration: 'turn' },
        { op: 'give', target: { all: { controller: 'opp', atVar: 'bf' } }, might: -1, duration: 'turn' },
      ],
    },
  }, // Siphon Power

  // ---- wave 3 : mécaniques d'entrée, permissions de jeu, watchers, coûts ----

  // "This enters exhausted. exhaust: Deal 2 to a unit at a battlefield." (Gear)
  'ogn-017-298': {
    entersExhausted: true,
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: 2, to: { var: 't' } }],
      },
    ],
  }, // Iron Ballista

  // "[Assault 3] If an opponent controls a battlefield, I enter ready.
  //  When I conquer, you may pay 1 to return me to my owner's hand."
  'ogn-035-298': {
    entersReady: { controlsBattlefield: 'opp' },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquer' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour renvoyer Vayne en main ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'returnToHand', target: { self: true } }] },
        ],
      },
    ],
  }, // Vayne - Hunter

  // "If an opponent's score is within 3 of the Victory Score, I enter ready.
  //  Stunned enemy units here have -8 might, to a minimum of 1."
  'ogn-079-298': {
    entersReady: { compare: [{ pointsOf: 'opp' }, '>=', 5] },
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'mightAura', amount: -8, targets: { controller: 'opp', location: 'here', stunned: true } },
      },
    ],
  }, // Leona - Zealot

  // "Other friendly units enter ready."
  'ogn-011-298': {
    abilities: [{ kind: 'passive', effect: { kind: 'entryReady', targets: 'yourUnits' } }],
  }, // Magma Wurm

  // "exhaust: [Legion] — The next unit you play this turn enters ready." (Gear)
  'ogn-021-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        ops: [{ op: 'if', cond: { legion: true }, then: [{ op: 'unitsEnterReadyThisTurn', n: 1 }] }],
      },
    ],
  }, // Sun Disc

  // "[Action] Units you play this turn enter ready. Draw 1."
  'ogn-129-298': {
    spell: {
      ops: [
        { op: 'unitsEnterReadyThisTurn' },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Confront

  // "You may play me to an open battlefield."
  'ogn-176-298': { playTo: 'openBattlefield', vanilla: true }, // Sneaky Deckhand

  // "[Vision] You may play me to an open battlefield."
  'ogn-174-298': {
    playTo: 'openBattlefield',
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] }],
  }, // Sai Scout

  // "[Deflect] You may play me to an occupied enemy battlefield."
  'ogn-161-298': { playTo: 'enemyBattlefield', vanilla: true }, // Deadbloom Predator

  // "When you play me, you may play a unit from your trash, ignoring its Energy cost."
  // (approximation : la Puissance n'est pas non plus payée)
  'ogn-196-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        optional: true,
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'] }, min: 1, max: 1 } },
          { op: 'playUnitsFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Soulgorger

  // "Play a unit from your trash, ignoring its Energy cost."
  'ogn-198-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'] }, min: 1, max: 1 } },
        { op: 'playUnitsFromTrash', bind: 'c' },
      ],
    },
  }, // The Harrowing

  // "When you discard me, you may pay 1 Fury to play me."
  'ogn-006-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'discardedSelf' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 1, domain: 'Fury' } }, prompt: 'Payer 1 Fury pour jouer Flame Chompers ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'playSelfFromTrash' }] },
        ],
      },
    ],
  }, // Flame Chompers

  // "[Action] Choose a unit. Kill it the next time it takes damage this turn.
  //  [Legion] — Kill it now instead."
  'ogn-254-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [
        {
          op: 'if',
          cond: { legion: true },
          then: [{ op: 'kill', target: { var: 't' } }],
          else: [{ op: 'watch', target: { var: 't' }, kind: 'killOnDamage' }],
        },
      ],
    },
  }, // Noxian Guillotine

  // "[Action] When any unit takes damage this turn, kill it."
  'ogn-221-298': {
    spell: { ops: [{ op: 'watch', target: { all: {} }, kind: 'killOnDamage' }] },
  }, // Imperial Decree

  // "Discard 1, exhaust: The next time a friendly unit would die this turn,
  //  heal/exhaust/recall it instead." (approx : le paiement Fury est intégré au coût)
  'ogn-023-298': {
    abilities: [
      {
        kind: 'activated',
        cost: { discard: 1, exhaustSelf: true, power: { n: 1, domain: 'Fury' } },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'watch', target: { var: 't' }, kind: 'preventDeathHeal' }],
      },
    ],
  }, // Unlicensed Armory

  // "While I'm at a battlefield, your spells cost 1 less (minimum 1)."
  'ogn-084-298': {
    abilities: [
      {
        kind: 'passive',
        while: { selfAt: 'battlefield' },
        effect: { kind: 'costMod', appliesTo: { cards: { type: ['Spell'] } }, energyDelta: -1, minEnergy: 1 },
      },
    ],
  }, // Eager Apprentice

  // "Your Dragons' Energy costs are reduced by 2, to a minimum of 1."
  'ogn-140-298': {
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'costMod', appliesTo: { cards: { type: ['Unit'], tag: 'Dragon' } }, energyDelta: -2, minEnergy: 1 },
      },
    ],
  }, // Herald of Scales

  // "I cost 1 less for each card in your trash."
  'ogn-195-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: { negate: { trashSize: 'you' } } } },
    ],
  }, // Rhasa the Sunderer

  // "Take a turn after this one. Banish this."
  'ogn-122-298': {
    spell: {
      ops: [
        { op: 'extraTurn' },
        { op: 'banishSpell' },
      ],
    },
  }, // Time Warp

  // "Channel 1 rune exhausted. If you can't, draw 1."
  'ogn-134-298': {
    spell: {
      ops: [
        {
          op: 'if',
          cond: { compare: [{ runeDeckSize: 'you' }, '>=', 1] },
          then: [{ op: 'channel', n: 1, exhausted: true }],
          else: [{ op: 'draw', n: 1 }],
        },
      ],
    },
  }, // Mobilize

  // "Channel 2 runes exhausted. If you couldn't channel 2 this way, draw 1."
  'ogn-138-298': {
    spell: {
      ops: [
        {
          op: 'if',
          cond: { compare: [{ runeDeckSize: 'you' }, '>=', 2] },
          then: [{ op: 'channel', n: 2, exhausted: true }],
          else: [
            { op: 'channel', n: 2, exhausted: true },
            { op: 'draw', n: 1 },
          ],
        },
      ],
    },
  }, // Catalyst of Aeons

  // "[Action] If an opponent's score is within 3 of the Victory Score, this costs
  //  2 less. Draw 1 and channel 1 rune exhausted."
  'ogn-047-298': {
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -2, while: { compare: [{ pointsOf: 'opp' }, '>=', 5] } },
      },
    ],
    spell: {
      ops: [
        { op: 'draw', n: 1 },
        { op: 'channel', n: 1, exhausted: true },
      ],
    },
  }, // Find Your Center

  // ---- vague finale : dernières cartes scriptables ----

  // "[Action] Discard 1. Deal its Energy cost as damage to a unit at a battlefield."
  'ogn-008-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'd', spec: { kind: 'card', zone: 'hand', who: 'you', min: 1, max: 1 } },
        { op: 'deal', n: { energyOfBound: 'd' }, to: { var: 't' } },
        { op: 'discardBound', bind: 'd', who: 'you' },
      ],
    },
  }, // Get Excited!

  // "This spell's Energy cost is reduced by the highest Might among units you control.
  //  Deal 5 to a unit at a battlefield."
  'ogn-014-298': {
    abilities: [
      {
        kind: 'passive',
        effect: { kind: 'costMod', appliesTo: 'self', energyDelta: { negate: { maxMightAmong: { controller: 'you' } } } },
      },
    ],
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'deal', n: 5, to: { var: 't' } }],
    },
  }, // Sky Splitter

  // "While I'm attacking or defending alone, I have +2 might."
  'ogn-055-298': {
    abilities: [{ kind: 'passive', effect: { kind: 'selfMight', amount: 2, while: { selfCombatAlone: true } } }],
  }, // Wielder of Water

  // "I must be assigned combat damage last. exhaust: Deal damage equal to my Might
  //  to a unit at a battlefield. Only while I'm at a battlefield."
  'ogn-068-298': {
    keywords: ['Backline'],
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        restriction: { selfAt: 'battlefield' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: { mightOf: { self: true } }, to: { var: 't' } }],
      },
    ],
  }, // Caitlyn - Patrolling

  // "At the start of your Beginning Phase, if you control a facedown card at a
  //  battlefield, draw 1."
  'ogn-101-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'startOfTurn' },
        ops: [{ op: 'if', cond: { youHaveFacedown: true }, then: [{ op: 'draw', n: 1 }] }],
      },
    ],
  }, // Mushroom Pouch

  // "[Accelerate] [Deathknell] — Recycle me to ready your runes."
  'ogn-110-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        optional: true,
        ops: [
          { op: 'selfFromTrash', to: 'deckBottom' },
          { op: 'readyRunes', n: 99 },
        ],
      },
    ],
  }, // Ekko - Recurrent

  // "[Reaction] Deal 2 to all enemy units in combat."
  'ogn-127-298': {
    spell: { ops: [{ op: 'deal', n: 2, to: { all: { controller: 'opp', inCombat: true } } }] },
  }, // Cannon Barrage

  // "[Reaction] If an enemy unit has died this turn, this costs 2 less. Draw 2."
  'ogn-144-298': {
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -2, while: { enemyDiedThisTurn: true } } },
    ],
    spell: { ops: [{ op: 'draw', n: 2 }] },
  }, // Spoils of War

  // "Choose an opponent. They reveal their hand. Choose a non-unit card, recycle it."
  'ogn-156-298': {
    spell: {
      ops: [
        { op: 'choose', bind: 'c', who: 'you', spec: { kind: 'card', zone: 'hand', who: 'opp', filter: { type: ['Spell', 'Gear'] }, min: 1, max: 1 } },
        { op: 'recycleFromHand', bind: 'c', who: 'opp' },
      ],
    },
  }, // Sabotage

  // "When you play me, choose an opponent. They reveal their hand. Choose a card
  //  from it; they discard it."
  'ogn-192-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'c', who: 'you', spec: { kind: 'card', zone: 'hand', who: 'opp', min: 1, max: 1 } },
          { op: 'discardBound', bind: 'c', who: 'opp' },
        ],
      },
    ],
  }, // Mindsplitter

  // "When you play a card from [Hidden], give me +2 might this turn."
  'ogn-167-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youPlayFromHidden' },
        ops: [{ op: 'give', target: { self: true }, might: 2, duration: 'turn' }],
      },
    ],
  }, // Ember Monk

  // "[Hidden][Action] Kill a unit at a battlefield. Its controller draws 2."
  'ogn-213-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        { op: 'draw', n: 2, who: { controllerOf: 't' } },
        { op: 'kill', target: { var: 't' } },
      ],
    },
  }, // Hidden Blade

  // "[Vision] When you recycle one or more cards to your Main Deck, buff a friendly unit."
  'ogn-235-298': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] },
      {
        kind: 'triggered',
        when: { on: 'youRecycle' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'buff', target: { var: 't' } }],
      },
    ],
  }, // Karma - Channeler

  // "Deal 5 to a unit. — When you conquer, you may discard 1 to return this from
  //  your trash to your hand." (déclencheur depuis la défausse)
  'ogn-252-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'deal', n: 5, to: { var: 't' } }],
    },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquer' },
        zone: 'trash',
        optional: true,
        ops: [
          { op: 'discard', n: 1, who: 'you' },
          { op: 'selfFromTrash', to: 'hand' },
        ],
      },
    ],
  }, // Super Mega Death Rocket!

  // "[Action] Choose an enemy unit at a battlefield. Take control of it and recall it."
  'ogn-203-298': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'takeControl', target: { var: 't' }, recall: true }],
    },
  }, // Possession

  // "When I attack, reveal the top rune of your rune deck, recycle it, then:
  //  Fury — deal 2 to an enemy unit here / autres domaines…"
  'ogn-200-298': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          { op: 'revealTopRune', bind: 'd' },
          {
            op: 'if',
            cond: { varEquals: ['d', 'Fury'] },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 }, optional: true },
              { op: 'if', cond: { chose: 't' }, then: [{ op: 'deal', n: 2, to: { var: 't' } }] },
            ],
            else: [{ op: 'draw', n: 1 }],
          },
        ],
      },
    ],
  }, // Twisted Fate - Gambler (approx. : branche non-Fury = pioche 1)

  // ---- cartes volontairement manuelles (mécaniques hors moteur ou bannies) ----
  'ogn-002-298': { manual: true }, // Brazen Buccaneer — coût additionnel au moment de jouer
  'ogn-018-298': { manual: true }, // Noxus Saboteur — restriction de révélation
  'ogn-025-298': { manual: true }, // Blind Fury — jeu gratuit depuis le deck adverse
  'ogn-026-298': { manual: true }, // Brynhir Thundersong — restriction de jeu
  'ogn-027-298': { manual: true }, // Darius - Trifarian — « 2e carte du tour » sans compteur dédié
  'ogn-031-298': { manual: true }, // Raging Firebrand — réduction du prochain sort
  'ogn-032-298': { manual: true }, // Ravenborn Tome — Bonus Damage
  'ogn-034-298': { manual: true }, // Tryndamere - Barbarian — suivi des dégâts excédentaires
  'ogn-037-298': { manual: true }, // Immortal Phoenix — déclencheur de zone complexe
  'ogn-041-298': { manual: true }, // Volibear - Furious — répartition libre de dégâts
  'ogn-048-298': { manual: true }, // Meditation — coût additionnel (engager une unité)
  'ogn-053-298': { manual: true }, // Stand United — modificateur global des buffs
  'ogn-060-298': { manual: true }, // Mask of Foresight — déclencheur attaque/défense seule (autre unité)
  'ogn-062-298': { manual: true }, // Reinforce — jeu depuis le deck à coût réduit
  'ogn-070-298': { manual: true }, // Mageseeker Warden — restrictions de jeu/redressement
  'ogn-077-298': { manual: true }, // Zhonya's Hourglass — remplacement de mort redirigé
  'ogn-078-298': { manual: true }, // Lee Sin - Ascetic — cap de buffs modifié
  'ogn-080-298': { manual: true }, // Mystic Reversal — vol de sort sur la chaîne
  'ogn-102-298': { manual: true }, // Portal Rescue — rejeu gratuit après bannissement
  'ogn-107-298': { manual: true }, // Ava Achiever — jeu gratuit d'une carte Hidden
  'ogn-108-298': { manual: true }, // Convergent Mutation — égalisation de Might
  'ogn-111-298': { manual: true }, // Heimerdinger - Inventor — copie de capacités
  'ogn-112-298': { manual: true }, // Kai'Sa - Evolutionary — sort joué depuis la défausse
  'ogn-115-298': { manual: true }, // Promising Future — jeux gratuits multi-joueurs
  'ogn-117-298': { manual: true }, // Viktor - Innovator — « carte jouée pendant le tour adverse »
  'ogn-121-298': { manual: true }, // Teemo - Strategist — révélation/comptage du deck
  'ogn-143-298': { manual: true }, // Pirate's Haven — déclencheur générique de redressement
  'ogn-145-298': { manual: true }, // Unyielding Spirit — prévention de dégâts
  'ogn-146-298': { manual: true }, // Wallop — coût alternatif (buff)
  'ogn-150-298': { manual: true }, // Kraken Hunter — réduction dynamique au jeu
  'ogn-157-298': { manual: true }, // Udyr - Wildman — mémoire de modes par tour
  'ogn-158-298': { manual: true }, // Volibear - Imposing — déclencheur de mouvement adverse
  'ogn-160-298': { manual: true }, // Dazzling Aurora — révélation + jeu gratuit
  'ogn-177-298': { manual: true }, // Stealthy Pursuer — BANNIE + déplacement accompagné
  'ogn-189-298': { manual: true }, // Kayn - Unleashed — prévention conditionnelle
  'ogn-193-298': { manual: true }, // Miss Fortune - Buccaneer — permission étendue aux autres
  'ogn-194-298': { manual: true }, // Nocturne - Horrifying — jeu depuis le dessus du deck
  'ogn-199-298': { manual: true }, // Tideturner — échange de positions
  'ogn-205-298': { manual: true }, // Yasuo - Windrider — compteur de déplacements
  'ogn-207-298': { manual: true }, // Call to Glory — coût alternatif (buff)
  'ogn-208-298': { manual: true }, // Cruel Patron — coût additionnel (tuer une unité)
  'ogn-226-298': { manual: true }, // Spectral Matron — jeu gratuit contraint depuis la défausse
  'ogn-227-298': { manual: true }, // Symbol of the Solari — remplacement d'égalité de combat
  'ogn-231-298': { manual: true }, // Commander Ledros — sacrifice réducteur de coût
  'ogn-236-298': { manual: true }, // Karthus - Eternal — double déclenchement des Deathknell
  'ogn-242-298': { manual: true }, // Baited Hook — sélection contrainte dans le deck
  'ogn-244-298': { manual: true }, // Divine Judgment — recyclage massif multi-zones
  'ogn-247-298': { manual: true }, // Kai'Sa (légende) — ressource restreinte aux sorts
  'ogn-249-298': { manual: true }, // Volibear (légende) — coût d'engagement sur déclencheur
  'ogn-255-298': { manual: true }, // Ahri (légende) — déclencheur d'attaque adverse
  'ogn-256-298': { manual: true }, // Fox-Fire — somme de Might contrainte
  'ogn-263-298': { manual: true }, // Teemo (légende) — coût de Hide alternatif + zone champion
  'ogn-264-298': { manual: true }, // Guerilla Warfare — filtre Hidden + hide gratuit
  'ogn-268-298': { manual: true }, // Bullet Time — paiement X variable
  'ogn-269-298': { manual: true }, // Sett - The Boss (légende) — remplacement de mort
}
