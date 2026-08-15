// Unleashed (UNL) card scripts.
import type { CardScript } from '../ir'

export const UNL_SCRIPTS: Record<string, CardScript> = {
  // "I enter ready. :rb_exhaust:: Give a unit +3 might this turn."
  'unl-001-219': {
    entersReady: true,
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 3, duration: 'turn' }],
      },
    ],
  }, // Arena Kingpin

  // "[Ambush][Assault 2]" — Ambush = playTo + Reaction dans les statiques
  'unl-002-219': {
    keywords: ['Assault 2', 'Reaction'],
    playTo: 'whereYouControlUnits',
  }, // Inferna

  // "[Hidden] When you play me to a battlefield, deal 2 to an enemy unit here."
  'unl-003-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'if',
            cond: { selfAt: 'battlefield' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } },
              { op: 'deal', n: 2, to: { var: 't' } },
            ],
          },
        ],
      },
    ],
  }, // Mischevious Marai

  'unl-004-219': { manual: true }, // Prepared Neophyte — condition « 4+ énergie dépensée pour un sort ce tour » : aucun Cond/Amount de suivi des dépenses

  // "[Ganking] When you play a spell, if you spent 4 or more energy, ready me."
  // (approx. : minEnergy filtre le coût imprimé du sort, pas l'énergie réellement dépensée)
  'unl-005-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Spell'], minEnergy: 4 } },
        ops: [{ op: 'ready', target: { self: true } }],
      },
    ],
  }, // Revna the Lorekeeper

  // "[Accelerate][Assault 4]" — mots-clés seulement
  'unl-006-219': { vanilla: true }, // Sharkling

  'unl-007-219': { manual: true }, // Smite — remplacement « if it would die this turn, banish it instead » : watch ne connaît pas banish-on-death

  'unl-008-219': { manual: true }, // Towering Pairofant — « if a unit died this turn » (n'importe laquelle) : seul enemyDiedThisTurn existe dans Cond

  // "[Repeat 2] Ready a unit."
  'unl-009-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'ready', target: { var: 't' } }],
      repeat: { energy: 2 },
    },
  }, // Upstage Comedy

  // "[Action] Give a unit [Assault 2] and [Ganking] this turn."
  'unl-010-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, keywords: ['Assault 2', 'Ganking'], duration: 'turn' }],
    },
  }, // Vault Breaker

  'unl-011-219': { manual: true }, // Fresh Beans — restriction « during a showdown » : aucun Cond de contexte showdown (playCard déclencherait à chaque unité jouée)

  // "[Ambush] When you play me, give your other units here [Assault] this turn."
  'unl-012-219': {
    keywords: ['Reaction'],
    playTo: 'whereYouControlUnits',
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'give', target: { all: { controller: 'you', location: 'here', notSelf: true } }, keywords: ['Assault 1'], duration: 'turn' }],
      },
    ],
  }, // Lord Broadmane

  'unl-013-219': { manual: true }, // Lotus Trap — « double all damage that would be dealt to it this turn » : remplacement/amplification de dégâts hors vocabulaire

  // "[Action] Deal 2 to a unit at a battlefield. If you control a facedown card, deal 4 to it instead."
  'unl-014-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        {
          op: 'if',
          cond: { youHaveFacedown: true },
          then: [{ op: 'deal', n: 4, to: { var: 't' } }],
          else: [{ op: 'deal', n: 2, to: { var: 't' } }],
        },
      ],
    },
  }, // Monster Harpoon

  'unl-015-219': { manual: true }, // Right of Conquest — « draw 1 for each battlefield you control » : aucun Amount pour le nombre de champs de bataille contrôlés (cf. Seat of Power)

  // "[Hunt 2][Level 3] — I have +1 might and enter ready."
  'unl-016-219': {
    entersReady: { xpAtLeast: 3 },
    abilities: [
      { kind: 'passive', while: { xpAtLeast: 3 }, effect: { kind: 'selfMight', amount: 1 } },
    ],
  }, // Scorchclaw

  // "[Repeat — Discard 1] Give a unit [Assault 4] this turn."
  'unl-017-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, keywords: ['Assault 4'], duration: 'turn' }],
      repeat: { discard: 1 },
    },
  }, // Square Up

  'unl-018-219': { manual: true }, // Yeti Brawler — « if you assigned 3 or more excess damage » : les dégâts excédentaires ne sont pas trackables (cf. Sivir - Ambitious)

  // "[Equip] 1 energy + Fury"
  'unl-019-219': { equip: { bonusMight: 4, cost: { energy: 1, power: { n: 1, domain: 'Fury' } } } }, // Blighted Battleaxe

  'unl-020-219': { manual: true }, // Dancing Grenade — l'ADVERSAIRE rejoue ton sort + Bonus Damage cumulatif par occurrence : hors vocabulaire

  // "[Ambush] When you play me, you may return a friendly unit at a battlefield to its owner's hand."
  'unl-021-219': {
    keywords: ['Reaction'],
    playTo: 'whereYouControlUnits',
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 't' }, then: [{ op: 'returnToHand', target: { var: 't' } }] }],
      },
    ],
  }, // Grim Apothecary

  // "[Deflect][Ganking] When I move, [Add] 1 energy + 1 any power."
  'unl-022-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          { op: 'addEnergy', n: 1 },
          { op: 'addPower', n: 1, domain: 'any' },
        ],
      },
    ],
  }, // Jhin - Murderous Artist

  'unl-023-219': { manual: true }, // Katarina - Reckless — pas de déclencheur « quand tu caches une carte » (le second effet seul serait scriptable, la carte ne peut pas être semi-automatisée)

  // "[Accelerate][Assault 2][Deflect][Ganking]" — mots-clés seulement
  'unl-024-219': { vanilla: true }, // Rengar - Unseen

  // "[Legion] — You may play me from your trash for 3 + Fury."
  // (approx. Flow : coûts normaux, la porte Legion et le surcoût Fury ne sont pas modélisés)
  'unl-025-219': { playFromTrash: true }, // Undying Legion

  // "Fury, exhaust: Deal 3 to a unit. Use this ability only while I'm at a battlefield."
  'unl-026-219': {
    abilities: [
      {
        kind: 'activated',
        cost: { power: { n: 1, domain: 'Fury' }, exhaustSelf: true },
        restriction: { selfAt: 'battlefield' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: 3, to: { var: 't' } }],
      },
    ],
  }, // Xerath - Freed

  // "When I conquer, give a friendly unit +8 might this turn."
  'unl-027-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquer' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 8, duration: 'turn' }],
      },
    ],
  }, // Inviolus Vox

  // "[Hidden][Ganking] You may pay Fury as an additional cost. When you play me, if you paid, ready me and give me +2 might this turn."
  'unl-028-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 1, domain: 'Fury' } }, prompt: 'Payer 1 Fury (coût additionnel) pour redresser Pyke et lui donner +2 might ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'ready', target: { self: true } },
              { op: 'give', target: { self: true }, might: 2, duration: 'turn' },
            ],
          },
        ],
      },
    ],
  }, // Pyke - Dockside Butcher

  'unl-029-219': { manual: true }, // Red Brambleback — « your conquer effects trigger an additional time » : modification des déclencheurs d'autres cartes (le Buff au conquer seul serait scriptable, carte non semi-automatisable)

  // "[Deflect] 2 energy + Fury: Double my Might this turn."
  'unl-030-219': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 2, power: { n: 1, domain: 'Fury' } },
        ops: [{ op: 'give', target: { self: true }, might: { mightOf: { self: true } }, duration: 'turn' }],
      },
    ],
  }, // Vi - Hotheaded

  // "[Reaction] Give a unit +1 might this turn. [Level 6] — +3 instead."
  'unl-031-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [
        {
          op: 'if',
          cond: { xpAtLeast: 6 },
          then: [{ op: 'give', target: { var: 't' }, might: 3, duration: 'turn' }],
          else: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }],
        },
      ],
    },
  }, // Combat Experience

  // "[Repeat 2] Look at the top 3. You may reveal a unit and draw it. Recycle the rest."
  'unl-032-219': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            {
              label: 'Révéler une unité parmi les 3 et la piocher',
              ops: [
                { op: 'lookTop', n: 3, keep: 1, rest: 'recycle' },
                { op: 'draw', n: 1 },
              ],
            },
            { label: 'Aucune unité : tout recycler', ops: [{ op: 'lookTop', n: 3, keep: 0, rest: 'recycle' }] },
          ],
        },
      ],
      repeat: { energy: 2 },
    },
  }, // Double Trouble

  // "When you play me, play a 1 might Bird unit token with [Deflect] here."
  'unl-033-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'bird', where: 'here' }] },
    ],
  }, // Frisky Hunter

  // "[Hunt] When you play me, gain 2 XP."
  'unl-034-219': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'gainXp', n: 2 }] }],
  }, // Herald of Spring

  // "If an opponent controls a stunned unit, I cost 2 less and enter ready."
  'unl-035-219': {
    entersReady: { exists: { controller: 'opp', stunned: true } },
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -2, while: { exists: { controller: 'opp', stunned: true } } } },
    ],
  }, // Monch

  // "[Shield 2][Tank]" — mots-clés seulement
  'unl-036-219': { vanilla: true }, // Mutated Mouser

  'unl-037-219': { manual: true }, // Shadow Watcher — « friendly unit died during your Beginning Phase this turn » : aucun Cond de mort alliée ni de phase

  // "Move an enemy unit. [Level 6] — Stun an enemy unit."
  'unl-038-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 't' } } },
        { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' } },
        {
          op: 'if',
          cond: { xpAtLeast: 6 },
          then: [
            { op: 'choose', bind: 's', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
            { op: 'stun', target: { var: 's' } },
          ],
        },
      ],
    },
  }, // Skyward Strike

  // "[Equip] Calm"
  'unl-039-219': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Calm' } } } }, // Soul Sword

  // "[Hunt][Level 6] — When you play me, draw 1."
  'unl-040-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, requires: { xpAtLeast: 6 }, ops: [{ op: 'draw', n: 1 }] },
    ],
  }, // Wuju Apprentice

  // "[Deflect] While I'm at a battlefield, your other units here have [Deflect]."
  'unl-041-219': {
    keywords: ['Deflect'],
    abilities: [
      {
        kind: 'passive',
        while: { selfAt: 'battlefield' },
        effect: { kind: 'grantKeywords', keywords: ['Deflect'], targets: { controller: 'you', location: 'here', notSelf: true } },
      },
    ],
  }, // Allay, Eager Admirer

  'unl-042-219': { manual: true }, // Back Off — condition « if you played this from your hand » (vs face cachée) : aucun Cond sur la zone d'origine du sort

  // "[Backline] When I hold, [Buff] all units here."
  'unl-043-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'buff', target: { all: { controller: 'any', location: 'here' } } }] },
    ],
  }, // Enthusiastic Promoter

  // "[Reaction] Choose one — Counter a spell. / Play four 1 might Bird unit tokens with [Deflect]."
  'unl-044-219': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            { label: 'Contrer un sort', ops: [{ op: 'counterSpell' }] },
            { label: 'Jouer quatre jetons Bird 1 might', ops: [{ op: 'playToken', token: 'bird', n: 4, where: 'base' }] },
          ],
        },
      ],
    },
  }, // Flurry of Feathers

  // ---- UNL batch 2 ----

  // "[Action] Exhaust a unit you control, exhaust: Move a different unit you control to the location of the unit you exhausted."
  // NB: le coût « engager une unité » est modélisé comme premier effet (Cost ne couvre pas l'engagement d'une autre unité).
  'unl-045-219': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'action',
        ops: [
          { op: 'choose', bind: 'a', spec: { kind: 'unit', filter: { controller: 'you', exhausted: false }, min: 1, max: 1 } },
          { op: 'exhaust', target: { var: 'a' } },
          { op: 'choose', bind: 'b', spec: { kind: 'unit', filter: { controller: 'you', notVar: 'a' }, min: 1, max: 1 } },
          { op: 'moveTo', target: { var: 'b' }, to: { atUnit: 'a' } },
        ],
      },
    ],
  }, // Forgotten Signpost

  // "[Reaction] Choose a unit. Give it +1 might this turn for each of the following tags among your units — Bird, Cat, Dog, and Poro."
  'unl-046-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [
        { op: 'if', cond: { exists: { controller: 'you', tag: 'Bird' } }, then: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }] },
        { op: 'if', cond: { exists: { controller: 'you', tag: 'Cat' } }, then: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }] },
        { op: 'if', cond: { exists: { controller: 'you', tag: 'Dog' } }, then: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }] },
        { op: 'if', cond: { exists: { controller: 'you', tag: 'Poro' } }, then: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }] },
      ],
    },
  }, // Friendship

  // "[Hunt 2] [Level 3] — I have +1 might and [Deflect]."
  'unl-047-219': {
    keywords: ['Hunt 2'],
    abilities: [
      { kind: 'passive', while: { xpAtLeast: 3 }, effect: { kind: 'selfMight', amount: 1 } },
      { kind: 'passive', while: { xpAtLeast: 3 }, effect: { kind: 'grantKeywords', keywords: ['Deflect'], targets: { self: true } } },
    ],
  }, // Mosstomper

  // "[Shield] When I hold, play a ready 3 might Sprite unit token with [Temporary] here."
  'unl-048-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'playToken', token: 'sprite', where: 'here', exhausted: false }] },
    ],
  }, // Trevor Snoozebottom

  // "This enters exhausted. [Reaction] exhaust: [Add] rainbow. [Level 6] — [Reaction] exhaust: [Add] 1 energy + rainbow."
  'unl-049-219': {
    entersExhausted: true,
    abilities: [
      { kind: 'activated', cost: { exhaustSelf: true }, timing: 'reaction', ops: [{ op: 'addPower', n: 1, domain: 'any' }] },
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        timing: 'reaction',
        restriction: { xpAtLeast: 6 },
        ops: [
          { op: 'addEnergy', n: 1 },
          { op: 'addPower', n: 1, domain: 'any' },
        ],
      },
    ],
  }, // Honeyfruit

  // "When I hold, at the start of your next Main Phase, you may move an enemy unit to this battlefield."
  // NB: approximation — déplacement immédiat au hold (pas de planification « début de la prochaine Main Phase »).
  'unl-050-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'hold' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 }, optional: true },
          { op: 'if', cond: { chose: 't' }, then: [{ op: 'moveTo', target: { var: 't' }, to: 'here' }] },
        ],
      },
    ],
  }, // Iascylla

  // "When you play me or when I hold, look at the top 3… may reveal a unit and draw it. Recycle the rest.
  //  Then if you revealed a Bird, Cat, Dog, or Poro: Buff a friendly unit."
  // NB: branche sur la carte révélée rendue par un mode déclaratif (comme Ornn - Blacksmith, sfd-058).
  'unl-051-219': {
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
                label: 'Révéler un Bird/Cat/Dog/Poro et le piocher, puis buffer une unité alliée',
                ops: [
                  { op: 'lookTop', n: 3, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                  { op: 'choose', bind: 'b', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
                  { op: 'buff', target: { var: 'b' } },
                ],
              },
              {
                label: 'Révéler une autre unité et la piocher',
                ops: [
                  { op: 'lookTop', n: 3, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                ],
              },
              { label: 'Ne rien révéler : tout recycler', ops: [{ op: 'lookTop', n: 3, keep: 0, rest: 'recycle' }] },
            ],
          },
        ],
      },
      {
        kind: 'triggered',
        when: { on: 'hold' },
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              {
                label: 'Révéler un Bird/Cat/Dog/Poro et le piocher, puis buffer une unité alliée',
                ops: [
                  { op: 'lookTop', n: 3, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                  { op: 'choose', bind: 'b', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
                  { op: 'buff', target: { var: 'b' } },
                ],
              },
              {
                label: 'Révéler une autre unité et la piocher',
                ops: [
                  { op: 'lookTop', n: 3, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                ],
              },
              { label: 'Ne rien révéler : tout recycler', ops: [{ op: 'lookTop', n: 3, keep: 0, rest: 'recycle' }] },
            ],
          },
        ],
      },
    ],
  }, // Ivern - Nurturer

  'unl-052-219': { manual: true }, // Nami - Headstrong — « the next time you play a unit this turn, ready it and buff it » : watcher différé sur un futur jeu de carte inexprimable (cf. Rally the Troops), et la carte ne peut pas être à moitié automatisée

  // "When you play me, draw 1. [Deathknell] — Choose an opponent. They reveal their hand… Gain 1 XP."
  // NB: partiel — la révélation de la main et la lecture des cartes face cachée ne sont pas automatisables (voir NOTES).
  'unl-053-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'draw', n: 1 }] },
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'gainXp', n: 1 }] },
    ],
  }, // Scuttle Crab (partiel)

  'unl-054-219': { manual: true }, // Tricksy Tentacles — sélection multi-cibles contrainte par une somme (« total Might of 8 or less ») : explicitement hors IR

  // "[Shield][Tank] When you Stun an enemy unit at a battlefield, you may move me to that battlefield."
  // NB: « that battlefield » approximé — on choisit une unité ennemie étourdie à un champ de bataille.
  'unl-055-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youStun' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', stunned: true, location: 'battlefield' }, min: 1, max: 1 }, optional: true },
          { op: 'if', cond: { chose: 't' }, then: [{ op: 'moveTo', target: { self: true }, to: { atUnit: 't' } }] },
        ],
      },
    ],
  }, // Vex - Mocking

  // "When I attack or defend, give one of your other units here +3 might and [Tank] this turn."
  'unl-056-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'here', notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 3, keywords: ['Tank'], duration: 'turn' }],
      },
      {
        kind: 'triggered',
        when: { on: 'defend' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'here', notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 3, keywords: ['Tank'], duration: 'turn' }],
      },
    ],
  }, // Yuumi - Magical Cat

  'unl-057-219': { manual: true }, // Alpha Wildclaw — protection de ciblage (« can't be chosen by enemy spells and abilities ») inexprimable (cf. Ruin Runner)

  'unl-058-219': { manual: true }, // Lillia - Protector of Dreams — aucun prédicat « jeton » dans UnitFilter ni déclencheur « quand tu joues un jeton » (cf. Azir - Sovereign)

  'unl-059-219': { manual: true }, // Master Yi - Unstoppable — réductions de coût en PUISSANCE (costMod = énergie seulement) + protection de ciblage au Level 16

  'unl-060-219': {
    manual: true, // Vilemaw — « les unités ennemies ici avec moins de Might que moi n'infligent pas de dégâts de combat » : prévention de dégâts inexprimable ; l'Ambush et le hold-draw seuls seraient scriptables
    playTo: 'whereYouControlUnits',
    keywords: ['Reaction'],
  }, // Vilemaw

  // "[Reaction][Repeat 2] Draw 1."
  'unl-061-219': {
    spell: {
      ops: [{ op: 'draw', n: 1 }],
      repeat: { energy: 2 },
    },
  }, // Downstage Dramatics

  // "[Deathknell] — [Predict 2]."
  'unl-062-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'lookTop', n: 2, keep: 2, rest: 'recycle' }] },
    ],
  }, // Dramatic Visionary

  // "[Reaction] Give a unit -4 might this turn. [Predict]."
  'unl-063-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: -4, duration: 'turn' },
        { op: 'lookTop', n: 1, keep: 1, rest: 'recycle' },
      ],
    },
  }, // Eclipse

  // "When you play me, look at the top 4… may reveal a spell with Energy cost 4+ and draw it. Recycle the rest."
  'unl-064-219': {
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
                label: 'Révéler un sort à coût 4+ parmi les 4 et le piocher',
                ops: [
                  { op: 'lookTop', n: 4, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                ],
              },
              { label: 'Aucun sort valide : tout recycler', ops: [{ op: 'lookTop', n: 4, keep: 0, rest: 'recycle' }] },
            ],
          },
        ],
      },
    ],
  }, // Fate Weaver

  // "When I attack, you may pay 1 energy to give a unit here -1 might this turn."
  'unl-065-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour donner -1 might à une unité ici ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'here' }, min: 1, max: 1 } },
              { op: 'give', target: { var: 't' }, might: -1, duration: 'turn' },
            ],
          },
        ],
      },
    ],
  }, // Icevale Archer

  // "[Reaction] Give a unit -10 might this turn."
  'unl-066-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: -10, duration: 'turn' }],
    },
  }, // Moonlight Affliction

  // "[Deathknell] — Deal 4 to an enemy unit."
  'unl-067-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: 4, to: { var: 't' } }],
      },
    ],
  }, // Ruined Rex

  // "When another friendly unit dies, give me +2 might this turn."
  'unl-068-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'you', notSelf: true } },
        ops: [{ op: 'give', target: { self: true }, might: 2, duration: 'turn' }],
      },
    ],
  }, // Spectral Centaur

  // "Play two ready 3 might Sprite unit tokens with [Temporary]."
  'unl-069-219': {
    spell: {
      ops: [{ op: 'playToken', token: 'sprite', n: 2, where: 'base', exhausted: false }],
    },
  }, // Sprite Burst

  // "Give a gear [Temporary]."
  'unl-070-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, keywords: ['Temporary'], duration: 'permanent' }],
    },
  }, // Turn to Dust

  // "[Ambush] When you play me, give your other units here [Shield] this turn."
  'unl-071-219': {
    keywords: ['Reaction'],
    playTo: 'whereYouControlUnits',
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'give', target: { all: { controller: 'you', location: 'here', notSelf: true } }, keywords: ['Shield 1'], duration: 'turn' }],
      },
    ],
  }, // Chakram Dancer

  // "[Action] Choose a battlefield and an enemy unit there. Deal 4 to that unit and 1 to each other enemy unit there."
  'unl-072-219': {
    spell: {
      targets: [
        { bind: 'bf', spec: { kind: 'battlefieldPick' } },
        { bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', atVar: 'bf' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'deal', n: 4, to: { var: 't' } },
        { op: 'deal', n: 1, to: { all: { controller: 'opp', atVar: 'bf', notVar: 't' } } },
      ],
    },
  }, // Crescent Strike

  // "Deal 3 to an enemy unit. When it dies this turn, play a Gold gear token exhausted."
  // NB: approximation — « quand elle meurt ce tour » réduit à « si ces 3 dégâts la tuent » (cf. NOTES).
  'unl-073-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
      ops: [
        { op: 'deal', n: 3, to: { var: 't' } },
        { op: 'if', cond: { dead: { var: 't' } }, then: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }] },
      ],
    },
  }, // Deadly Flourish

  'unl-074-219': { manual: true }, // Frigid Jewel — aucun déclencheur « quand tu pioches » (a fortiori « la deuxième carte chaque tour »)

  // "[Hunt 2] [Level 3] — I have +1 might and [Ganking]."
  'unl-075-219': {
    keywords: ['Hunt 2'],
    abilities: [
      { kind: 'passive', while: { xpAtLeast: 3 }, effect: { kind: 'selfMight', amount: 1 } },
      { kind: 'passive', while: { xpAtLeast: 3 }, effect: { kind: 'grantKeywords', keywords: ['Ganking'], targets: { self: true } } },
    ],
  }, // Gustwalker

  // "I have +1 might for each of your units with [Temporary] at my battlefield."
  'unl-076-219': {
    abilities: [
      { kind: 'passive', effect: { kind: 'selfMight', amount: { count: { controller: 'you', keyword: 'Temporary', location: 'here' } } } },
    ],
  }, // Petal Pixie

  'unl-077-219': { manual: true }, // Soul Shepherd — « your token units have +1 might » : aucun prédicat « jeton » dans UnitFilter (cf. Azir - Sovereign)

  // "[Temporary] When you play this, play a ready 3 might Sprite token with [Temporary] to your base.
  //  [Deathknell] — Repeat this gear's play effect."
  'unl-078-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'sprite', where: 'base', exhausted: false }] },
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'playToken', token: 'sprite', where: 'base', exhausted: false }] },
    ],
  }, // Sprite Fountain

  'unl-079-219': { manual: true }, // Diana - Lunari — aucun déclencheur « quand un showdown commence ici » ; révélation du dessus du deck avec branche par type également hors IR

  // "When I move, draw 1, then discard 1. Then based on the discarded card's type: Spell — Draw 1. Gear — Ready up to 2 runes. Unit — +3 might this turn."
  // NB: branche sur le type de la carte défaussée (info publique en défausse) rendue par un mode déclaratif.
  'unl-080-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          { op: 'draw', n: 1 },
          { op: 'discard', n: 1, who: 'you' },
          {
            op: 'mode',
            n: 1,
            options: [
              { label: 'Sort défaussé : piocher 1', ops: [{ op: 'draw', n: 1 }] },
              { label: 'Équipement défaussé : redresser jusqu\'à 2 runes', ops: [{ op: 'readyRunes', n: 2 }] },
              { label: 'Unité défaussée : +3 might ce tour', ops: [{ op: 'give', target: { self: true }, might: 3, duration: 'turn' }] },
            ],
          },
        ],
      },
    ],
  }, // Hwei - Brooding Painter

  'unl-081-219': { manual: true }, // Keeper of Masks — jetons Reflection qui « deviennent des copies de moi » : la copie d'unités/capacités est hors IR

  'unl-082-219': { manual: true }, // Lillia - Fae Fawn — « when I move from a location, play a token THERE » : l'origine d'un déplacement n'est pas observable (cf. Harpoon Squad)

  'unl-083-219': { manual: true }, // Smoke and Mirrors — échange de positions de deux unités (les deux origines simultanées sont nécessaires, cf. Azir - Ascendant)

  // "When you play me or at the start of your Beginning Phase, play a ready 3 might Sprite token with [Temporary] to your base."
  'unl-084-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'sprite', where: 'base', exhausted: false }] },
      { kind: 'triggered', when: { on: 'startOfTurn' }, ops: [{ op: 'playToken', token: 'sprite', where: 'base', exhausted: false }] },
    ],
  }, // Sprite Queen

  'unl-085-219': { manual: true }, // Sumpworks Map — aucun déclencheur « quand un adversaire marque des points » (conquer/hold ne couvrent que VOS scorings)

  'unl-086-219': { manual: true }, // Zilean - Time Mage — effet de remplacement sur le jeu de jetons (« you may play that token and an additional copy instead »)

  'unl-087-219': { manual: true }, // Blue Sentinel — « vos effets de hold ici se déclenchent une fois de plus » modifie les effets d'autres cartes ; [Add] différé « au début de ta prochaine Main Phase » également hors IR

  // "At the start of your Beginning Phase, if you have exactly 4 cards in hand and exactly 4 units at battlefields, you win.
  //  Discard 1, exhaust: Play a 1 might Bird unit token with [Deflect]."
  'unl-088-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'startOfTurn' },
        ops: [
          {
            op: 'if',
            cond: {
              and: [
                { compare: [{ handSize: 'you' }, '==', 4] },
                { compare: [{ count: { controller: 'you', location: 'battlefield' } }, '==', 4] },
              ],
            },
            then: [{ op: 'winGame' }],
          },
        ],
      },
      { kind: 'activated', cost: { discard: 1, exhaustSelf: true }, ops: [{ op: 'playToken', token: 'bird', where: 'base' }] },
    ],
  }, // Gutter Palace

  // ---- UNL batch 4 ----

  // "When you play this, you may move an enemy unit. When you move an enemy unit, you may exhaust this to [Stun] it."
  // manual pour le second déclencheur (« when you move an enemy unit » : aucun trigger joueur de déplacement) — le trigger de jeu reste scripté
  'unl-133-219': {
    manual: true,
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 }, optional: true }],
        ops: [
          {
            op: 'if',
            cond: { chose: 't' },
            then: [
              { op: 'choose', bind: 'loc', spec: { kind: 'location', forUnit: { var: 't' } } },
              { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' } },
            ],
          },
        ],
      },
    ],
  }, // Blast Cone

  // "[Action][Repeat 2] Stun an attacking enemy unit. If it's already stunned, return it to its owner's hand instead."
  // (split en modes par état — précédent Sudden Storm)
  'unl-134-219': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            {
              label: 'Étourdir un attaquant ennemi non étourdi',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', combatRole: 'attacker', stunned: false }, min: 1, max: 1 } },
                { op: 'stun', target: { var: 't' } },
              ],
            },
            {
              label: 'Renvoyer en main un attaquant ennemi déjà étourdi',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', combatRole: 'attacker', stunned: true }, min: 1, max: 1 } },
                { op: 'returnToHand', target: { var: 't' } },
              ],
            },
          ],
        },
      ],
      repeat: { energy: 2 },
    },
  }, // Existential Dread

  // "When you play me, choose an opponent. They reveal their hand. You may pay 2 XP to choose a card from their hand.
  //  If you do, they discard that card and draw 1." (réduit au 1v1 ; dépense d'XP = gainXp négatif)
  'unl-135-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'if', cond: { xpAtLeast: 2 }, then: [{ op: 'choose', bind: 'p', spec: { kind: 'yesNo', prompt: 'Payer 2 XP pour choisir une carte de la main adverse ?' } }] },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'gainXp', n: -2 },
              { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'hand', who: 'opp', min: 1, max: 1 } },
              { op: 'discardBound', bind: 'c', who: 'opp' },
              { op: 'draw', n: 1, who: 'opp' },
            ],
          },
        ],
      },
    ],
  }, // Insightful Investigator

  // "This enters exhausted. Kill this, 1, exhaust: [Predict 2], then draw 1. Gain 1 XP."
  'unl-136-219': {
    entersExhausted: true,
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, exhaustSelf: true, killSelf: true },
        ops: [
          { op: 'lookTop', n: 2, keep: 2, rest: 'recycle' },
          { op: 'draw', n: 1 },
          { op: 'gainXp', n: 1 },
        ],
      },
    ],
  }, // Scryer's Bloom

  // "When I attack, you may pay 1 to move an enemy unit here to its base."
  'unl-137-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour renvoyer un ennemi ici à sa base ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } },
              { op: 'recall', target: { var: 't' } },
            ],
          },
        ],
      },
    ],
  }, // Sinister Poro

  'unl-138-219': { manual: true }, // The List — « name a tag » : aucun op pour nommer/mémoriser un tag arbitraire (ensemble ouvert, pas énumérable en mode)

  'unl-139-219': { manual: true }, // Bone Skewer — jeu forcé gratuit d'une unité depuis la main ADVERSE (forced free plays, hors périmètre)

  // "You may spend 5 XP as an additional cost. Choose an enemy unit at a battlefield with 3 might or less.
  //  If you paid, choose any enemy unit at a battlefield instead. Take control of it, exhaust it, and recall it."
  'unl-140-219': {
    spell: {
      ops: [
        { op: 'if', cond: { xpAtLeast: 5 }, then: [{ op: 'choose', bind: 'p', spec: { kind: 'yesNo', prompt: 'Dépenser 5 XP pour choisir une unité ennemie sans limite de might ?' } }] },
        {
          op: 'if',
          cond: { var: 'p' },
          then: [
            { op: 'gainXp', n: -5 },
            { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } },
          ],
          else: [
            { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield', maxMight: 3 }, min: 1, max: 1 } },
          ],
        },
        { op: 'takeControl', target: { var: 't' }, recall: true },
        { op: 'exhaust', target: { var: 't' } },
      ],
    },
  }, // Conscription

  // "[Hidden][Backline] When you play me from face down on your turn, you may move an enemy unit at a different location to my battlefield."
  // (approx. Edge of Night : trigger on:'play' optionnel — « depuis face cachée / pendant ton tour / autre position » à l'honneur du joueur)
  'unl-141-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 't' }, then: [{ op: 'moveTo', target: { var: 't' }, to: 'here' }] }],
      },
    ],
  }, // Evelynn - Entrancing

  'unl-142-219': { manual: true }, // Heedless Resurrection — coût additionnel obligatoire (tuer une unité) + filtre de coût DYNAMIQUE borné par l'unité tuée (CardFilter n'accepte que des nombres statiques)

  // "[Ambush] When I attack or defend, if an enemy unit is alone here, give me +2 might this turn and gain 2 XP."
  'unl-143-219': {
    keywords: ['Reaction'],
    playTo: 'whereYouControlUnits',
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          {
            op: 'if',
            cond: { compare: [{ count: { controller: 'opp', location: 'here' } }, '==', 1] },
            then: [
              { op: 'give', target: { self: true }, might: 2, duration: 'turn' },
              { op: 'gainXp', n: 2 },
            ],
          },
        ],
      },
      {
        kind: 'triggered',
        when: { on: 'defend' },
        ops: [
          {
            op: 'if',
            cond: { compare: [{ count: { controller: 'opp', location: 'here' } }, '==', 1] },
            then: [
              { op: 'give', target: { self: true }, might: 2, duration: 'turn' },
              { op: 'gainXp', n: 2 },
            ],
          },
        ],
      },
    ],
  }, // Kha'Zix - Mutating Horror

  'unl-144-219': { manual: true }, // Maduli the Gatekeeper — « I can't be readied » (aucun passif de restriction) + comparaison au might TOTAL des ennemis (pas de somme dans les Amounts)

  // "[Hidden][Backline] Once each turn, when an enemy unit dies while I'm at a battlefield, play a Gold gear token exhausted."
  'unl-145-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'opp' } },
        oncePerTurn: true,
        requires: { selfAt: 'battlefield' },
        ops: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }],
      },
    ],
  }, // Pyke - Returned

  'unl-146-219': { manual: true }, // Syndra - Transcendent — donne [Repeat] à tes sorts pendant un showdown : modification du jeu d'autres cartes, hors périmètre

  // "As you play me, add the Baron Pit battlefield token… I can't be chosen… Other friendly units have +2 might."
  // manual pour le token de battlefield et l'inciblabilité — l'aura +2 reste scriptée
  'unl-147-219': {
    manual: true,
    abilities: [
      { kind: 'passive', effect: { kind: 'mightAura', amount: 2, targets: { controller: 'you', notSelf: true } } },
    ],
  }, // Baron Nashor

  'unl-148-219': { manual: true }, // Cursed Sarcophagus — bannit les unités de la défausse puis les joue depuis le bannissement : aucune zone/op de bannissement rejouable

  // "[Ambush] When you play a spell, give me +2 might this turn."
  'unl-149-219': {
    keywords: ['Reaction'],
    playTo: 'whereYouControlUnits',
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Spell'] } },
        ops: [{ op: 'give', target: { self: true }, might: 2, duration: 'turn' }],
      },
    ],
  }, // Diana - No Longer Human

  'unl-150-219': { manual: true }, // Vex - Apathetic — déclencheur « quand un ADVERSAIRE joue une unité » inexistant (playCard = tes propres cartes) + restriction de déplacement « can't move it this turn »

  // "[Level 3] I enter ready."
  'unl-151-219': { entersReady: { xpAtLeast: 3 }, vanilla: true }, // Bandle Soldier

  // "[Assault][Deathknell] — Channel 1 rune exhausted."
  'unl-152-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'channel', n: 1, exhausted: true }] },
    ],
  }, // Black Rose Dignitary

  // "[Deathknell] — Play a 1 might Bird unit token with [Deflect] to your base."
  'unl-153-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'playToken', token: 'bird', where: 'base' }] },
    ],
  }, // Carrion Dredger

  // "I have +2 might while I'm attacking with another unit."
  'unl-154-219': {
    abilities: [
      {
        kind: 'passive',
        effect: {
          kind: 'selfMight',
          amount: 2,
          while: {
            and: [
              { exists: { self: true, combatRole: 'attacker' } },
              { exists: { controller: 'you', combatRole: 'attacker', location: 'here', notSelf: true } },
            ],
          },
        },
      },
    ],
  }, // Crimson Pigeons

  // "[Action] Give a friendly unit +1 might this turn and [Stun] an enemy unit at its location."
  'unl-155-219': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp', atUnitVar: 'a' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'give', target: { var: 'a' }, might: 1, duration: 'turn' },
        { op: 'stun', target: { var: 'b' } },
      ],
    },
  }, // Heroic Charge

  // "[Deathknell] — If I didn't die alone, draw 1."
  'unl-156-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [{ op: 'if', cond: { not: { onlyFriendlyAt: { self: true } } }, then: [{ op: 'draw', n: 1 }] }],
      },
    ],
  }, // Loyal Poro

  // "When you play me, gain 1 XP for each friendly unit."
  'unl-157-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'gainXp', n: { count: { controller: 'you' } } }] },
    ],
  }, // Scrutinizing Sergeant

  // "When you play this, gain 1 XP. [Equip] — Spend 1 XP"
  // manual pour l'attache (coût d'Equip en XP : Cost n'a pas de champ XP) — le trigger de jeu reste scripté
  'unl-158-219': {
    manual: true,
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'gainXp', n: 1 }] },
    ],
  }, // Shepherd's Heirloom

  // "Kill a unit at a battlefield with 3 might or less."
  'unl-159-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', maxMight: 3 }, min: 1, max: 1 } }],
      ops: [{ op: 'kill', target: { var: 't' } }],
    },
  }, // Soul Harvest

  // "exhaust: Play two 1 might Bird unit tokens with [Deflect]. Use this ability only while I'm at a battlefield."
  'unl-160-219': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        restriction: { selfAt: 'battlefield' },
        ops: [{ op: 'playToken', token: 'bird', n: 2, where: 'base' }],
      },
    ],
  }, // Ultrasoft Poro

  // "[Vision] [Action] Kill this, exhaust: Give a unit +2 might this turn."
  'unl-161-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] },
      {
        kind: 'activated',
        cost: { exhaustSelf: true, killSelf: true },
        timing: 'action',
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 2, duration: 'turn' }],
      },
    ],
  }, // Divining Shells

  // "[Hunt] Spend 2 XP: [Buff] me." (dépense d'XP = restriction xpAtLeast + gainXp négatif)
  'unl-162-219': {
    abilities: [
      {
        kind: 'activated',
        cost: {},
        restriction: { xpAtLeast: 2 },
        ops: [
          { op: 'gainXp', n: -2 },
          { op: 'buff', target: { self: true } },
        ],
      },
    ],
  }, // Enthralling Protector

  'unl-163-219': { manual: true }, // Mageseeker Investigator — taxe en Puissance sur les déplacements multiples adverses : aucune restriction/taxe de déplacement dans l'IR

  // "You may spend 3 XP as an additional cost. When you play me, each player must kill one of their units.
  //  If you paid, you don't kill a unit this way." (1v1 ; dépense d'XP = gainXp négatif)
  'unl-164-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'if', cond: { xpAtLeast: 3 }, then: [{ op: 'choose', bind: 'p', spec: { kind: 'yesNo', prompt: 'Dépenser 3 XP pour ne pas avoir à tuer une de vos unités ?' } }] },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [{ op: 'gainXp', n: -3 }],
            else: [
              { op: 'choose', bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
              { op: 'kill', target: { var: 'a' } },
            ],
          },
          { op: 'choose', bind: 'b', who: 'opp', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
          { op: 'kill', target: { var: 'b' } },
        ],
      },
    ],
  }, // Safety Inspector

  // "Choose a friendly unit without [Temporary]. Give it [Temporary]. Draw 2."
  // (approx. : pas de filtre « sans mot-clé » — redonner [Temporary] à une unité déjà Temporary est sans effet)
  'unl-165-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, keywords: ['Temporary'], duration: 'permanent' },
        { op: 'draw', n: 2 },
      ],
    },
  }, // Shadow's Call

  'unl-166-219': { manual: true }, // Stalking Wolf — coût additionnel OBLIGATOIRE (tuer un Bird/Cat/Dog/Poro) + destination de jeu dépendant de l'unité tuée : inexprimables

  // "When you play me, return a Bird, Cat, Dog, or Poro from your trash to your hand."
  // (CardFilter n'a qu'un tag unique → choix du tag via mode)
  'unl-167-219': {
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
                label: 'Reprendre un Bird',
                ops: [
                  { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'], tag: 'Bird' }, min: 1, max: 1 } },
                  { op: 'toHandFromTrash', bind: 'c' },
                ],
              },
              {
                label: 'Reprendre un Cat',
                ops: [
                  { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'], tag: 'Cat' }, min: 1, max: 1 } },
                  { op: 'toHandFromTrash', bind: 'c' },
                ],
              },
              {
                label: 'Reprendre un Dog',
                ops: [
                  { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'], tag: 'Dog' }, min: 1, max: 1 } },
                  { op: 'toHandFromTrash', bind: 'c' },
                ],
              },
              {
                label: 'Reprendre un Poro',
                ops: [
                  { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'], tag: 'Poro' }, min: 1, max: 1 } },
                  { op: 'toHandFromTrash', bind: 'c' },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Starhound

  'unl-168-219': { manual: true }, // Undying Loyalty — réduction de coût conditionnée au CHOIX (cf. Irelia - Graceful) + plafond de Puissance absent de CardFilter pour le jeu depuis la défausse

  'unl-169-219': { manual: true }, // Ashe - Focused — bannissement d'une carte de la MAIN adverse + retour différé « when they hold » : zones/suivis inexprimables

  // "You may kill a friendly unit… I cost less… [Ganking] When I attack, the defender must kill one of their units here."
  // manual pour le coût alternatif (réduction dynamique liée à l'unité tuée) — le trigger d'attaque reste scripté
  'unl-170-219': {
    manual: true,
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          { op: 'choose', bind: 'a', who: 'opp', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } },
          { op: 'kill', target: { var: 'a' } },
        ],
      },
    ],
  }, // Atakhan

  'unl-171-219': { manual: true }, // Galio - Indefatigable — « I don't deal combat damage » : exemption de dégâts de combat sans passif correspondant (cf. Ezreal - Dashing)

  // "[Assault][Deathknell] — Draw 1. If it's your Beginning Phase, draw 2 instead."
  // (pas de Cond de phase → branche au choix du joueur, précédent Sudden Storm)
  'unl-172-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              { label: 'Piocher 1', ops: [{ op: 'draw', n: 1 }] },
              { label: 'Piocher 2 (pendant votre Beginning Phase)', ops: [{ op: 'draw', n: 2 }] },
            ],
          },
        ],
      },
    ],
  }, // LeBlanc - Fragmented

  'unl-173-219': { manual: true }, // Sacrifice — coût additionnel OBLIGATOIRE au jeu (tuer une unité Mighty amie) : non exprimable comme Cost (cf. Legion Quartermaster)

  'unl-174-219': { manual: true }, // Shard of Undoing — gate de phase (« during your Beginning Phase ») sur un déclencheur oncePerTurn : aucune Cond de phase, un if interne consommerait le once-per-turn à tort

  // "[Reaction] Choose a friendly unit. The next time it would die this turn, heal it, exhaust it, and recall it instead."
  'unl-175-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [{ op: 'watch', target: { var: 't' }, kind: 'preventDeathHeal' }],
    },
  }, // Tactical Retreat

  // "[Ambush] When I attack, [Stun] an enemy unit here."
  'unl-176-219': {
    keywords: ['Reaction'],
    playTo: 'whereYouControlUnits',
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'stun', target: { var: 't' } }],
      },
    ],
  }, // Vi - Peacekeeper

  // ---- UNL batch 3 ----

  // "[Vision] If you've spent 4+ energy to play a spell this turn, you may play me for :rb_rune_mind:."
  // manual pour le coût alternatif (« énergie dépensée sur un sort ce tour » non trackable) ;
  // le déclencheur [Vision] reste scripté.
  'unl-089-219': {
    manual: true,
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] }],
  }, // Jhin - Meticulous Killer

  'unl-090-219': { manual: true }, // LeBlanc - Everywhere At Once — suppression des effets [Temporary] adverses à mon champ de bataille : aucune passive de prévention/suppression ([Backline] reste natif)

  // "Draw 2. [Level 6] This costs 2 less. [Level 11] This costs 4 less instead."
  'unl-091-219': {
    spell: { ops: [{ op: 'draw', n: 2 }] },
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -2, while: { and: [{ xpAtLeast: 6 }, { not: { xpAtLeast: 11 } }] } } },
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -4, while: { xpAtLeast: 11 } } },
    ],
  }, // Concentrate

  // "When you play me, gain 1 XP."
  'unl-092-219': {
    abilities: [{ kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'gainXp', n: 1 }] }],
  }, // Demacian Diplomat

  // "[Reaction] :rb_exhaust:: [Add] 1 energy."
  'unl-093-219': {
    abilities: [
      { kind: 'activated', cost: { exhaustSelf: true }, timing: 'reaction', ops: [{ op: 'addEnergy', n: 1 }] },
    ],
  }, // Dragonsoul Sage

  // "[Hunt] [Level 6] I have +1 might."
  'unl-094-219': {
    abilities: [{ kind: 'passive', while: { xpAtLeast: 6 }, effect: { kind: 'selfMight', amount: 1 } }],
  }, // Gemhand Hunter

  'unl-095-219': { manual: true }, // Grim Resolve — déclencheur retardé « quand elle gagne un combat ce tour » : pas de trigger « wins a combat » (le +3 might seul serait scriptable, mais le sort ne peut pas être à moitié automatisé)

  // "[Equip] Body"
  'unl-096-219': { equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Body' } } }, vanilla: true }, // Hunter's Machete

  'unl-097-219': { manual: true }, // Kinkou Initiate — « total Might 5 ou plus de vos autres unités » : aucun Amount de somme de might

  // "[Level 11] I have +4 might."
  'unl-098-219': {
    abilities: [{ kind: 'passive', while: { xpAtLeast: 11 }, effect: { kind: 'selfMight', amount: 4 } }],
  }, // Targonian Visionary

  // "[Shield 2][Tank]" — keywords natifs
  'unl-099-219': { vanilla: true }, // Towering Combatant

  // "[Hunt 3]" — keyword natif
  'unl-100-219': { vanilla: true }, // Voracious Gromp

  // "Move a unit you control to a battlefield you control. Then, choose an opponent.
  //  They move a unit they control to the same battlefield."
  // (approx. : la contrainte « battlefield que VOUS contrôlez » n'est pas filtrable par battlefieldPick — auto-imposée par le lanceur)
  'unl-101-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'bf', spec: { kind: 'battlefieldPick' } },
        { op: 'moveTo', target: { var: 't' }, to: { var: 'bf' } },
        { op: 'choose', bind: 'u', who: 'opp', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
        { op: 'moveTo', target: { var: 'u' }, to: { var: 'bf' } },
      ],
    },
  }, // Call to Battle

  // "[Hunt] Spend 2 XP: Buff me." (coût XP modélisé : restriction xpAtLeast + gainXp négatif)
  'unl-102-219': {
    abilities: [
      {
        kind: 'activated',
        cost: {},
        restriction: { xpAtLeast: 2 },
        ops: [
          { op: 'gainXp', n: -2 },
          { op: 'buff', target: { self: true } },
        ],
      },
    ],
  }, // Crowd Favorite

  'unl-103-219': { manual: true }, // Disposal Order — recycler des cartes des défausses ADVERSES : recycleFromTrash n'opère que sur votre propre défausse (vérifié dans vm.ts)

  'unl-104-219': { manual: true }, // Gentle Gemdragon — déclencheur « quand vous jouez un autre Dragon » : le filtre playCard n'a pas de tag ; l'ability ne peut pas être à moitié automatisée

  // "When I move, you may move an enemy unit here with less Might than me to a different battlefield."
  // (approx. : la contrainte de Might est vérifiée APRÈS le choix — un mauvais choix fait échouer l'effet)
  'unl-105-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 }, optional: true },
          {
            op: 'if',
            cond: { chose: 't' },
            then: [
              {
                op: 'if',
                cond: { compare: [{ mightOf: { var: 't' } }, '<', { mightOf: { self: true } }] },
                then: [
                  { op: 'choose', bind: 'loc', spec: { kind: 'battlefieldPick' } },
                  { op: 'moveTo', target: { var: 't' }, to: { var: 'loc' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Imposing Challenger

  'unl-106-219': { manual: true }, // Repulse — contre restreint aux sorts/CAPACITÉS ennemis qui ciblent une unité précise : counterSpell n'a pas de prédicat de ciblage et ne contre pas les capacités (cf. Not So Fast)

  // "Choose a friendly unit and a battlefield. Move all enemy units at that battlefield
  //  with less Might than the chosen unit to their base. Gain 1 XP."
  'unl-107-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'bf', spec: { kind: 'battlefieldPick' } },
        {
          op: 'forEach',
          over: { controller: 'opp', atVar: 'bf' },
          bind: 'u',
          ops: [
            {
              op: 'if',
              cond: { compare: [{ mightOf: { var: 'u' } }, '<', { mightOf: { var: 't' } }] },
              then: [{ op: 'moveTo', target: { var: 'u' }, to: 'base' }],
            },
          ],
        },
        { op: 'gainXp', n: 1 },
      ],
    },
  }, // Stare Down

  'unl-108-219': { manual: true, keywords: [] }, // Wily Newtfish — condition « vous avez gagné de l'XP ce tour » : aucune Cond correspondante ; [Ganking] conditionnel exclu des statiques

  // "When you play a unit, you may pay 1 to gain 1 XP. Spend 3 XP, exhaust: Ready a unit."
  'unl-109-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Unit'] } },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour gagner 1 XP ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'gainXp', n: 1 }] },
        ],
      },
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        restriction: { xpAtLeast: 3 },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [
          { op: 'gainXp', n: -3 },
          { op: 'ready', target: { var: 't' } },
        ],
      },
    ],
  }, // Blood Rose

  // "Choose two units. They deal damage equal to their Mights to each other."
  'unl-110-219': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { notVar: 'a' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'deal', n: { mightOf: { var: 'a' } }, to: { var: 'b' } },
        { op: 'deal', n: { mightOf: { var: 'b' } }, to: { var: 'a' } },
      ],
    },
  }, // Clash of Giants

  'unl-111-219': { manual: true }, // Determined Sentry — restriction de mouvement (« I can't move to base ») : pas de passives de restriction

  // "When I move to a battlefield, you may move an enemy unit to that battlefield."
  'unl-112-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
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
    ],
  }, // Irresistible Faefolk

  // "[Hunt 2] [Level 6] I have [Deflect] and [Ganking]."
  'unl-113-219': {
    keywords: ['Hunt 2'], // les crochets [Deflect]/[Ganking] sont dans le texte conditionnel Level
    abilities: [
      { kind: 'passive', while: { xpAtLeast: 6 }, effect: { kind: 'grantKeywords', keywords: ['Deflect', 'Ganking'], targets: { self: true } } },
    ],
  }, // Master Yi - Tempered

  // "[Ambush] When I win a combat, draw 1."
  // manual pour « quand je gagne un combat » (pas de trigger) ; l'Ambush reste jouable par le moteur.
  'unl-114-219': {
    playTo: 'whereYouControlUnits',
    keywords: ['Reaction'],
    manual: true,
  }, // Nidalee - Cat Form

  // "[Accelerate][Ganking] When I move, gain 1 XP."
  'unl-115-219': {
    abilities: [{ kind: 'triggered', when: { on: 'move' }, ops: [{ op: 'gainXp', n: 1 }] }],
  }, // Nilah - Joyful Ascetic

  // "[Deflect] When you play me, if an opponent's score is within 3 points of the Victory Score,
  //  ready me and gain 3 XP." (Victory Score = 8 → seuil 5, cf. VICTORY_SCORE dans engine/types.ts)
  'unl-116-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'if',
            cond: { compare: [{ pointsOf: 'opp' }, '>=', 5] },
            then: [
              { op: 'ready', target: { self: true } },
              { op: 'gainXp', n: 3 },
            ],
          },
        ],
      },
    ],
  }, // Poppy - Paragon

  'unl-117-219': { manual: true }, // Arachnoid Horror — permission de jeu conditionnelle (« ennemi seul là-bas ») étendue aux unités amies : playTo ne peut ni conditionner ni s'appliquer aux autres cartes ([Hunt 2] reste natif)

  'unl-118-219': { manual: true }, // Elder Dragon — « n'importe quelle quantité de vos dégâts tue » (modification de létalité, effet de remplacement) + « jusqu'à une unité ennemie à CHAQUE lieu » non énumérable

  // "[Hunt] When I attack, you may spend 3 XP to deal damage equal to my Might to an enemy unit here."
  'unl-119-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          {
            op: 'if',
            cond: { xpAtLeast: 3 },
            then: [
              { op: 'choose', bind: 'y', spec: { kind: 'yesNo', prompt: 'Dépenser 3 XP pour infliger des dégâts égaux à ma Might à une unité ennemie ici ?' } },
              {
                op: 'if',
                cond: { var: 'y' },
                then: [
                  { op: 'gainXp', n: -3 },
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } },
                  { op: 'deal', n: { mightOf: { self: true } }, to: { var: 't' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Kha'Zix - Evolving Hunter

  // "[Ambush] I can be played to a battlefield where there are enemy units."
  // manual pour la permission « battlefield occupé par l'ennemi » (playTo est mono-valeur,
  // pas d'union whereYouControlUnits + enemyBattlefield) ; l'Ambush reste jouable.
  'unl-120-219': {
    playTo: 'whereYouControlUnits',
    keywords: ['Reaction'],
    manual: true,
  }, // Rengar - Trophy Hunter

  // "When you play me, choose a player. They discard 1." (réduit au 1v1)
  'unl-121-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              { label: "L'adversaire défausse 1", ops: [{ op: 'discard', n: 1, who: 'opp' }] },
              { label: 'Vous défaussez 1', ops: [{ op: 'discard', n: 1, who: 'you' }] },
            ],
          },
        ],
      },
    ],
  }, // Bewitching Spirit

  'unl-122-219': { manual: true }, // Crescent Guardian — coût additionnel conditionné à « vous avez joué un SORT ce tour » : aucune Cond correspondante (legion couvre n'importe quelle carte, pas les sorts)

  // "When you play me, discard 1, then draw 1."
  'unl-123-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'discard', n: 1, who: 'you' },
          { op: 'draw', n: 1 },
        ],
      },
    ],
  }, // Evershade Stalker

  // "Move an enemy unit from a battlefield to its base. Then, if there's an enemy unit
  //  alone at that battlefield, draw 1." (la condition est évaluée avant le déplacement :
  //  exactement 1 autre unité ennemie restante = elle sera seule après le départ)
  'unl-124-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        {
          op: 'if',
          cond: { compare: [{ count: { controller: 'opp', atUnitVar: 't', notVar: 't' } }, '==', 1] },
          then: [{ op: 'draw', n: 1 }],
        },
        { op: 'moveTo', target: { var: 't' }, to: 'base' },
      ],
    },
  }, // Isolate

  // "[Reaction] Discard 1, then draw 2."
  'unl-125-219': {
    spell: {
      ops: [
        { op: 'discard', n: 1, who: 'you' },
        { op: 'draw', n: 2 },
      ],
    },
  }, // Lunar Boon

  // "Spend 3 XP: Give your units here [Ganking] this turn."
  'unl-126-219': {
    abilities: [
      {
        kind: 'activated',
        cost: {},
        restriction: { xpAtLeast: 3 },
        ops: [
          { op: 'gainXp', n: -3 },
          { op: 'give', target: { all: { controller: 'you', location: 'here' } }, keywords: ['Ganking'], duration: 'turn' },
        ],
      },
    ],
  }, // Megatusk

  // "[Accelerate] When I move to a battlefield, gain 2 XP."
  'unl-127-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [{ op: 'if', cond: { selfAt: 'battlefield' }, then: [{ op: 'gainXp', n: 2 }] }],
      },
    ],
  }, // Mister Root

  // "[Reaction] Return a friendly unit and an enemy unit to their owners' hands."
  'unl-128-219': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'returnToHand', target: { var: 'a' } },
        { op: 'returnToHand', target: { var: 'b' } },
      ],
    },
  }, // Star-Crossed

  // "When another friendly unit dies, gain 1 XP."
  'unl-129-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'unitDies', filter: { controller: 'you', notSelf: true } }, ops: [{ op: 'gainXp', n: 1 }] },
    ],
  }, // Vicious Snapjaws

  // "[Deflect] When you play me, choose an opponent. They play a 1 might Bird unit token
  //  with [Deflect]." (réduit au 1v1 : l'adversaire joue le jeton)
  'unl-130-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'bird', where: 'base', who: 'opp' }] },
    ],
  }, // Walking Roost

  'unl-131-219': { manual: true }, // Abandon — effet de remplacement sur le contre (« return it to its owner's hand INSTEAD of trash ») : counterSpell n'a pas de variante retour-en-main

  // "When you play me, return all units with 2 might or less to their owners' hands."
  'unl-132-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'returnToHand', target: { all: { maxMight: 2 } } }] },
    ],
  }, // Angler Beast

  // ---- UNL batch 5 : champions, légendes, signatures & champs de bataille ----

  'unl-177-219': { manual: true }, // Ivern - Friend to All — « je gagne le tag choisi » : aucun op pour ajouter un tag à une unité (et le choix au jeu conditionne le scoring)

  // "You may spend 3 XP as an additional cost… If you do, I cost 3 less. [Ambush] [Tank]"
  // NB: Ambush/Tank scriptés ; la remise optionnelle contre 3 XP reste manuelle (voir NOTES).
  'unl-178-219': {
    playTo: 'whereYouControlUnits',
    keywords: ['Tank', 'Reaction'],
    manual: true,
  }, // Poppy - Defender of the Meek — coût additionnel optionnel « dépenser 3 XP » lié à une réduction de coût : non exprimable (mayPay ne couvre pas l'XP, costMod n'est pas conditionnable à un choix)

  'unl-179-219': { manual: true }, // Rift Herald — [Deathknell] « joue une unité de ta main en ignorant son coût d'Énergie » : jeu gratuit depuis la main sans op

  // "Kill all units."
  'unl-180-219': {
    spell: { ops: [{ op: 'kill', target: { all: { controller: 'any' } } }] },
  }, // The Ruination

  'unl-181-219': { manual: true }, // Jhin - Virtuoso — bannir un sort depuis la chaîne + compteur de sorts bannis « avec moi » + retour en défausse : hors IR

  'unl-182-219': { manual: true }, // Curtain Call — trois coûts de [Repeat] distincts + mémoire des modes déjà choisis : spell.repeat n'accepte qu'un seul Cost

  // "When you play a unit, give a unit +1 might this turn."
  'unl-183-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Unit'] } },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }],
      },
    ],
  }, // Rengar - Pridestalker

  'unl-184-219': { manual: true }, // Thrill of the Hunt — bannir puis rejouer gratuitement vers n'importe quel champ de bataille (re-jeu depuis le bannissement sans op ; moveTo fausserait les déclencheurs de jeu)

  // "1 energy, exhaust: Return a friendly unit at a battlefield to its owner's hand. Play a Gold gear token exhausted."
  'unl-185-219': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [
          { op: 'returnToHand', target: { var: 't' } },
          { op: 'playToken', token: 'gold', where: 'base', exhausted: true },
        ],
      },
    ],
  }, // Pyke - Bloodharbor Ripper

  // "Kill a unit at a battlefield. Then, if it had 3 might or less, you may play this from your trash for 1 rune."
  // NB: la clause de re-jeu depuis la défausse n'est pas scriptée (voir NOTES).
  'unl-186-219': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'kill', target: { var: 't' } }],
    },
  }, // Death from Below (partiel)

  'unl-187-219': { manual: true }, // Vi - Piltover Enforcer — « 3 dégâts excédentaires assignés ou plus » : les dégâts excédentaires ne sont pas observables dans l'IR

  // "[Equip] 3 energy + 1 rainbow. This ability's Energy cost is reduced by the Might of the unit you choose."
  // NB: l'attache reste jouable au coût imprimé ; la réduction dynamique est manuelle.
  'unl-188-219': {
    equip: { bonusMight: 3, cost: { energy: 3, power: { n: 1, domain: 'any' } } },
    manual: true,
  }, // Hextech Gauntlets — réduction du coût d'Equip par la Might de la cible : aucun coût dynamique dans Cost

  'unl-189-219': { manual: true }, // Lillia - Bashful Bloom — réduction dynamique du coût d'une capacité activée (costMod ne vise que les coûts de jeu) + jeton avec [Temporary] non exprimable via playToken

  'unl-190-219': { manual: true }, // Lilting Lullaby — « son contrôleur ne peut pas jouer de sorts ce tour » : restriction de jeu hors IR (le counterSpell seul perdrait le verrou)

  // "[Level 6] — Your units have +1 might. [Level 11] — Your units enter ready."
  'unl-191-219': {
    abilities: [
      { kind: 'passive', while: { xpAtLeast: 6 }, effect: { kind: 'mightAura', amount: 1, targets: { controller: 'you' } } },
      { kind: 'passive', while: { xpAtLeast: 11 }, effect: { kind: 'entryReady', targets: 'yourUnits' } },
    ],
  }, // Master Yi - Wuju Master

  'unl-192-219': { manual: true }, // Alpha Strike — répartition de dégâts « split among » + XP par unité tuée par cette répartition : non exprimable

  // "When you or an ally hold, you may exhaust me to draw 1." (réduit au 1v1 : « you »)
  'unl-193-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'hold' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { exhaustSelf: true }, prompt: 'Engager Vex pour piocher 1 ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'draw', n: 1 }] },
        ],
      },
    ],
  }, // Vex - Gloomist

  // "If you play me to a battlefield, I enter ready. [Action] — 1 energy + 1 any power, exhaust: Stun an enemy unit attacking here."
  'unl-194-219': {
    entersReady: { selfAt: 'battlefield' },
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, power: { n: 1, domain: 'any' }, exhaustSelf: true },
        timing: 'action',
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here', combatRole: 'attacker' }, min: 1, max: 1 } }],
        ops: [{ op: 'stun', target: { var: 't' } }],
      },
    ],
  }, // Shadow

  'unl-195-219': { manual: true }, // Ivern - Green Father — remplacement d'un champ de bataille par un jeton Brush : aucun op de manipulation des champs de bataille

  // "I enter ready. Reduce my cost by 1 for each of the following tags among your units — Bird, Cat, Dog, Poro.
  //  When I attack while your units have all 4 tags, stun an enemy unit here."
  'unl-196-219': {
    entersReady: true,
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -1, while: { exists: { controller: 'you', tag: 'Bird' } } } },
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -1, while: { exists: { controller: 'you', tag: 'Cat' } } } },
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -1, while: { exists: { controller: 'you', tag: 'Dog' } } } },
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -1, while: { exists: { controller: 'you', tag: 'Poro' } } } },
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          {
            op: 'if',
            cond: {
              and: [
                { exists: { controller: 'you', tag: 'Bird' } },
                { exists: { controller: 'you', tag: 'Cat' } },
                { exists: { controller: 'you', tag: 'Dog' } },
                { exists: { controller: 'you', tag: 'Poro' } },
              ],
            },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } },
              { op: 'stun', target: { var: 't' } },
            ],
          },
        ],
      },
    ],
  }, // Daisy!

  'unl-197-219': { manual: true }, // Diana - Scorn of the Moon — énergie à usage restreint (« only during showdowns ») : même famille que Kai'Sa/Ornn Fire Below, manuelle

  // "[Action] Choose a battlefield where you have units. You may move up to one enemy unit there. Then give enemy units there -2 might this turn."
  // NB: le champ de bataille est désigné via une unité alliée qui s'y trouve (voir NOTES).
  'unl-198-219': {
    spell: {
      targets: [
        { bind: 'f', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 } },
        { bind: 'e', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 }, optional: true },
      ],
      ops: [
        { op: 'if', cond: { chose: 'e' }, then: [{ op: 'moveTo', target: { var: 'e' }, to: { atUnit: 'f' } }] },
        { op: 'give', target: { all: { controller: 'opp', atUnitVar: 'f' } }, might: -2, duration: 'turn' },
      ],
    },
  }, // Moonfall

  'unl-199-219': { manual: true }, // LeBlanc - Deceiver — jeton Reflection copiant une unité : ni jeton Reflection ni op de copie
  'unl-200-219': { manual: true }, // Mirror Image — jeton Reflection copiant une unité : ni jeton Reflection ni op de copie

  'unl-201-219': { manual: true }, // Kha'Zix - Voidreaver — déclencheur « quand tu gagnes un combat » absent de l'IR (sans lui, les capacités à XP sont mortes : pas de demi-automatisation)

  // "Move a friendly unit, then move an enemy unit."
  'unl-202-219': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'choose', bind: 'la', spec: { kind: 'location', forUnit: { var: 'a' } } },
        { op: 'moveTo', target: { var: 'a' }, to: { var: 'la' } },
        { op: 'choose', bind: 'lb', spec: { kind: 'location', forUnit: { var: 'b' } } },
        { op: 'moveTo', target: { var: 'b' }, to: { var: 'lb' } },
      ],
    },
  }, // Void Assault

  // "When you hold, gain 1 XP. — Spend 3 XP, exhaust: Draw 1."
  'unl-203-219': {
    abilities: [
      { kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'gainXp', n: 1 }] },
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        restriction: { xpAtLeast: 3 },
        ops: [
          { op: 'gainXp', n: -3 },
          { op: 'draw', n: 1 },
        ],
      },
    ],
  }, // Poppy - Keeper of the Hammer

  'unl-204-219': { manual: true }, // Keeper's Verdict — placer une unité du board sur le dessus/dessous du deck de son propriétaire : aucun op (recyclage de permanents hors IR)

  'unl-205-219': { manual: true }, // Abandoned Hall — « quand UN JOUEUR joue un sort » : playCard n'observe que le contrôleur de la capacité, pas les deux joueurs

  'unl-206-219': { manual: true }, // Altar of Blood — remplacement de mort en combat (« would die… instead » avec paiement) : hors IR (watch ne couvre pas ce cas côté champ de bataille)

  // "When you hold here, you may move a unit at a battlefield to its base."
  'unl-207-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'holdHere' },
        optional: true,
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
        ops: [{ op: 'moveTo', target: { var: 't' }, to: 'base' }],
      },
    ],
  }, // Amateur Recital

  // "Units here with [Temporary] have [Shield]."
  'unl-208-219': {
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Shield 1'], targets: { location: 'here', controller: 'any', keyword: 'Temporary' } } },
    ],
  }, // Black Flame Altar

  'unl-209-219': { manual: true }, // Dusk Rose Lab — déclencheur de début de Phase de Début côté champ de bataille : startOfTurn se lie à un seul contrôleur fixe, un champ de bataille n'en a pas (contrôle dynamique)

  // "While a unit here is defending alone, it has -2 might."
  // (approx. 1v1 : « seule » = exactement un défenseur ici — tous les alliés présents défendent)
  'unl-210-219': {
    abilities: [
      {
        kind: 'passive',
        while: { compare: [{ count: { location: 'here', controller: 'any', combatRole: 'defender' } }, '==', 1] },
        effect: { kind: 'mightAura', amount: -2, targets: { location: 'here', controller: 'any', combatRole: 'defender' } },
      },
    ],
  }, // Forbidding Waste

  // "While you control this battlefield, when you play a spell, if you spent 4+ energy, [Predict]."
  // NB: repose sur le fait que le moteur lie les déclencheurs du champ de bataille à son contrôleur courant (voir NOTES).
  'unl-211-219': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'playCard', filter: { type: ['Spell'], minEnergy: 4 } },
        ops: [{ op: 'lookTop', n: 1, keep: 1, rest: 'recycle' }],
      },
    ],
  }, // Forgotten Library

  'unl-212-219': { manual: true }, // Frozen Fortress — « au début de la Phase de Début DE CHAQUE JOUEUR » : startOfTurn ne se déclenche que sur le tour d'un seul contrôleur

  'unl-213-219': { manual: true }, // Gardens of Becoming — accorde une capacité activée textuelle (« exhaust: Gain 1 XP ») aux unités : aucun passif correspondant

  'unl-214-219': { manual: true }, // Ripper's Bay — déclencheur « quand une unité ici est renvoyée en main » absent de l'IR

  'unl-215-219': { manual: true }, // Star Spring — playCard sans filtre de lieu (« here ») ni prédicat non-jeton, et « un joueur » couvre les deux joueurs

  'unl-216-219': { manual: true }, // The Academy — donne [Repeat] au prochain sort joué (modification du jeu d'autres cartes, cf. Temporal Portal)

  'unl-217-219': { manual: true }, // Trapping Grounds — « 3 dégâts excédentaires assignés ou plus » : dégâts excédentaires non observables (cf. Vi)

  'unl-218-219': { manual: true }, // Valley of Idols — playCard sans filtre de lieu, « un joueur » couvre les deux joueurs, et l'unité jouée n'est pas référençable comme cible du buff

  'unl-219-219': { manual: true }, // Vaults of Helia — surcoût temporaire (« ce tour ») appliqué aux autres cartes : costMod est un passif statique, pas un effet accordé pour un tour

  'unl-238-219': { manual: true }, // Baron Nashor (Ultimate) — ajout d'un jeton champ de bataille (Baron Pit) + entrée sur celui-ci + inciblabilité absolue : hors IR (l'aura +2 seule dénaturerait la carte)
}
