// Spiritforged (SFD) card scripts.
import type { CardScript } from '../ir'

export const SFD_SCRIPTS: Record<string, CardScript> = {
  // ---- SFD batch 1 ----

  // "[Reaction] Give a friendly unit at a battlefield +2 might this turn for each enemy unit there."
  'sfd-001-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        { op: 'give', target: { var: 't' }, might: { count: { controller: 'opp', atUnitVar: 't' } }, duration: 'turn' },
        { op: 'give', target: { var: 't' }, might: { count: { controller: 'opp', atUnitVar: 't' } }, duration: 'turn' },
      ],
    },
  }, // Against the Odds

  // "[Accelerate][Weaponmaster]"
  'sfd-002-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
    ],
  }, // Armed Assailant

  // "[Action][Repeat 1] Give a unit [Assault 2] this turn."
  'sfd-003-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, keywords: ['Assault 2'], duration: 'turn' }],
      repeat: { energy: 1 },
    },
  }, // Blood Rush

  // "[Hidden] Friendly units enter ready this turn. Play a Gold gear token exhausted."
  'sfd-004-221': {
    spell: {
      ops: [
        { op: 'unitsEnterReadyThisTurn' },
        { op: 'playToken', token: 'gold', where: 'base', exhausted: true },
      ],
    },
  }, // Bushwhack

  // "Kill a gear. Its controller draws 2."
  'sfd-005-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 } }],
      ops: [
        { op: 'draw', n: 2, who: { controllerOf: 't' } },
        { op: 'kill', target: { var: 't' } },
      ],
    },
  }, // Detonate

  // "I enter ready."
  'sfd-006-221': { entersReady: true }, // Eager Drakehound

  // "When you play me, give a unit [Ganking] this turn."
  'sfd-007-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, keywords: ['Ganking'], duration: 'turn' }],
      },
    ],
  }, // Gem Jammer

  // "[Weaponmaster]"
  'sfd-008-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
    ],
  }, // Sentinel Adept

  // "[Equip] 1 Fury"
  'sfd-009-221': { equip: { cost: { power: { n: 1, domain: 'Fury' } } } }, // Serrated Dirk

  'sfd-010-221': { manual: true }, // Void Drone — cost reduction conditioned on the play zone (from anywhere other than hand): no such Cond

  'sfd-011-221': { manual: true }, // Angle Shot — attach/detach an arbitrary bound Equipment to/from an arbitrary bound unit: no op (only attachSelfTo / attachBoundToSelf)

  'sfd-012-221': { manual: true }, // Battering Ram — dynamic cost reduction scaled by "cards you've played this turn": no such Amount

  // "You may pay 1 energy + 1 Fury as an additional cost to play me. When you play me, if you paid, deal 2 to a unit at a battlefield."
  'sfd-013-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1, power: { n: 1, domain: 'Fury' } }, prompt: 'Payer 1 énergie + 1 Fury pour infliger 2 dégâts à une unité ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } },
              { op: 'deal', n: 2, to: { var: 't' } },
            ],
          },
        ],
      },
    ],
  }, // Blast Corps Cadet

  'sfd-014-221': { manual: true }, // Minotaur Reckoner — global movement restriction ("Units can't move to base"): no restriction passives

  'sfd-015-221': { manual: true }, // Perched Grimwyrm — play restriction (only to a battlefield conquered this turn): playTo can't express it

  // "[Equip] 1 Fury"
  'sfd-016-221': { equip: { cost: { power: { n: 1, domain: 'Fury' } } } }, // Recurve Bow

  // "[Hidden][Action] Deal 2 to a unit at a battlefield. If it's attacking, deal 4 to it instead."
  'sfd-017-221': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            {
              label: 'Infliger 4 à une unité attaquante',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', combatRole: 'attacker' }, min: 1, max: 1 } },
                { op: 'deal', n: 4, to: { var: 't' } },
              ],
            },
            {
              label: 'Infliger 2 à une unité défenseure',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', combatRole: 'defender' }, min: 1, max: 1 } },
                { op: 'deal', n: 2, to: { var: 't' } },
              ],
            },
            {
              label: 'Infliger 2 à une unité hors combat',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', inCombat: false }, min: 1, max: 1 } },
                { op: 'deal', n: 2, to: { var: 't' } },
              ],
            },
          ],
        },
      ],
    },
  }, // Sudden Storm

  'sfd-018-221': { manual: true }, // Void Hatchling — replacement effect on deck reveals ("If you would reveal… first"): no reveal watcher

  // "1 energy + 1 Fury, Recycle a unit from your trash, exhaust: Play a 3 might Mech unit token to your base."
  'sfd-019-221': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, power: { n: 1, domain: 'Fury' }, exhaustSelf: true },
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'] }, min: 1, max: 1 } },
          { op: 'recycleFromTrash', bind: 'c' },
          { op: 'playToken', token: 'mech', where: 'base' },
        ],
      },
    ],
  }, // Assembly Rig

  'sfd-020-221': { manual: true }, // Draven - Vanquisher — no "when I win a combat" trigger in the IR (the pay-Fury pump would be scriptable, but the card can't be half-automated)

  // "[Deathknell] — Play two 3 might Mech unit tokens to your base."
  'sfd-021-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'playToken', token: 'mech', n: 2, where: 'base' }] },
    ],
  }, // Ferrous Forerunner

  // "[Quick-Draw][Equip] 1 Fury"
  'sfd-022-221': {
    quickDraw: true,
    equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Fury' } } },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
          { op: 'attachSelfTo', bind: 't' },
        ],
      },
    ],
  }, // Long Sword

  // "[Repeat 2 + 1 Fury] Deal 2 to a unit at a battlefield, then deal 2 to up to one other unit."
  'sfd-023-221': {
    spell: {
      targets: [
        { bind: 't1', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } },
        { bind: 't2', spec: { kind: 'unit', filter: { notVar: 't1' }, min: 1, max: 1 }, optional: true },
      ],
      ops: [
        { op: 'deal', n: 2, to: { var: 't1' } },
        { op: 'if', cond: { chose: 't2' }, then: [{ op: 'deal', n: 2, to: { var: 't2' } }] },
      ],
      repeat: { energy: 2, power: { n: 1, domain: 'Fury' } },
    },
  }, // Piercing Light

  'sfd-024-221': { manual: true }, // Rell - Magnetic — free play of an Equipment from hand on attack: no play-from-hand op

  'sfd-025-221': { manual: true }, // Rengar - Pouncing — play permission "to a battlefield you're attacking": playTo can't express it

  'sfd-026-221': { manual: true }, // Rumble - Hotheaded — conquer ability recycles a board unit + plays a Mech from trash at reduced cost: recycling permanents and dynamic discounts are out of scope (Mech [Assault] aura alone would be scriptable)

  // "If you have two or fewer cards in your hand, I enter ready. When I hold, draw 2."
  'sfd-027-221': {
    entersReady: { compare: [{ handSize: 'you' }, '<=', 2] },
    abilities: [{ kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'draw', n: 2 }] }],
  }, // Dunebreaker

  // "[Assault] When I attack, deal damage equal to my [Assault] to an enemy unit here."
  'sfd-028-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 } }],
        ops: [{ op: 'deal', n: 1, to: { var: 't' } }],
      },
    ],
  }, // Lucian - Gunslinger (approx.: Assault value fixed at printed 1 — no Amount for keyword values)

  'sfd-029-221': { manual: true }, // Rek'Sai - Breacher — grants [Accelerate] to units depending on their play zone: modifies the play of other cards, out of scope

  // "[Equip] 1 energy + 1 Fury"
  'sfd-030-221': { equip: { bonusMight: 2, cost: { energy: 1, power: { n: 1, domain: 'Fury' } } } }, // Skyfall of Areion

  // "[Repeat 2] Play a 2 might Sand Soldier unit token."
  'sfd-031-221': {
    spell: {
      ops: [{ op: 'playToken', token: 'sandsoldier', where: 'base' }],
      repeat: { energy: 2 },
    },
  }, // Desert's Call

  // "When you play me, you may kill a gear."
  'sfd-032-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'kill', target: { var: 'g' } }] }],
      },
    ],
  }, // Disarming Rake

  // "[Equip] 1 Calm"
  'sfd-033-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Calm' } } } }, // Doran's Shield

  // "[Reaction][Repeat 2] Give a unit +2 might this turn."
  'sfd-034-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: 2, duration: 'turn' }],
      repeat: { energy: 2 },
    },
  }, // Feral Strength

  // "When I hold, you may return a unit or gear from your trash to your hand."
  'sfd-035-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'hold' },
        optional: true,
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit', 'Gear'] }, min: 1, max: 1 } },
          { op: 'toHandFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Guardian of the Passage

  // "[Deathknell] — If I died alone, draw 1."
  'sfd-036-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [{ op: 'if', cond: { onlyFriendlyAt: { self: true } }, then: [{ op: 'draw', n: 1 }] }],
      },
    ],
  }, // Lonely Poro

  // "[Deflect]" — keyword only, engine-native
  'sfd-037-221': { vanilla: true }, // Navori Scout

  // "When I move to a battlefield, give another friendly unit +1 might this turn."
  'sfd-038-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          {
            op: 'if',
            cond: { selfAt: 'battlefield' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', notSelf: true }, min: 1, max: 1 } },
              { op: 'give', target: { var: 't' }, might: 1, duration: 'turn' },
            ],
          },
        ],
      },
    ],
  }, // Ribbon Dancer

  'sfd-039-221': { manual: true }, // Royal Entourage — ready/exhaust a LEGEND: legends aren't targetable (UnitFilter covers units/gear only)

  // "[Action][Repeat 2] Stun an attacking unit."
  'sfd-040-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { combatRole: 'attacker' }, min: 1, max: 1 } }],
      ops: [{ op: 'stun', target: { var: 't' } }],
      repeat: { energy: 2 },
    },
  }, // Thwonk!

  'sfd-041-221': { manual: true }, // Apprentice Smith — reveal top of Main Deck and branch on its type: no reveal-top-card op (lookTop can't draw/branch by type)

  // "[Equip] 1 Calm"
  'sfd-042-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Calm' } } } }, // Brutalizer

  // "[Hidden][Action] Move any number of friendly units at a battlefield to their base."
  'sfd-043-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield' }, min: 1, max: 99 }, optional: true }],
      ops: [{ op: 'recall', target: { var: 't' } }],
    },
  }, // Emperor's Divide

  'sfd-044-221': { manual: true }, // Legion Quartermaster — mandatory additional play cost (return a friendly gear to hand): additional-cost-to-play not expressible

  'sfd-045-221': { manual: true }, // Not So Fast — counter restricted to enemy spells/ABILITIES that choose your units/gear: counterSpell has no targeting predicate and can't counter abilities

  // "When you play this, draw 1. — 1 énergie + Calm, exhaust, Kill this: Draw 1." (Gear)
  'sfd-046-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'draw', n: 1 }] },
      {
        kind: 'activated',
        cost: { energy: 1, power: { n: 1, domain: 'Calm' }, exhaustSelf: true, killSelf: true },
        ops: [{ op: 'draw', n: 1 }],
      },
    ],
  }, // Poro Snax

  'sfd-047-221': { manual: true }, // Simian Ancestor — « quand tu ME buffes » : youBuff ne peut pas être filtré sur soi (l'event n'est pas testable en Cond)

  // "When I move, draw 1."
  'sfd-048-221': {
    abilities: [{ kind: 'triggered', when: { on: 'move' }, ops: [{ op: 'draw', n: 1 }] }],
  }, // Stellacorn Herder

  'sfd-049-221': { manual: true }, // Aphelios - Exalted — pas de déclencheur « équipement attaché à moi » + mémoire des modes déjà choisis ce tour
  'sfd-050-221': { manual: true }, // Azir - Ascendant — échange de positions (« ma position d'origine ») + ré-attache conditionnelle inexprimables

  // "[Equip] Calm" — pas d'autre texte
  'sfd-051-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Calm' } } }, vanilla: true }, // Guardian Angel

  // "exhaust: Give a unit +3 might this turn." (Gear)
  'sfd-052-221': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
        ops: [{ op: 'give', target: { var: 't' }, might: 3, duration: 'turn' }],
      },
    ],
  }, // Heart of Dark Ice

  // "[Reaction] When you play me, heal your units here, then move up to one enemy unit from here to its base."
  'sfd-053-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'heal', n: 'all', target: { all: { controller: 'you', location: 'here' } } },
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'here' }, min: 1, max: 1 }, optional: true },
          { op: 'if', cond: { chose: 't' }, then: [{ op: 'recall', target: { var: 't' } }] },
        ],
      },
    ],
  }, // Janna - Savior

  'sfd-054-221': { manual: true }, // Jax - Unmatched — donne [Quick-Draw] à tes équipements « partout » (permission de jeu/timing sur cartes en main)
  'sfd-055-221': { manual: true }, // Needlessly Large Yordle — réduction de coût dynamique (points de hold ce tour) incluant la Puissance

  // "[Quick-Draw][Equip] Calm" — pas d'autre texte
  'sfd-056-221': {
    quickDraw: true,
    equip: { bonusMight: 3, cost: { power: { n: 1, domain: 'Calm' } } },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
          { op: 'attachSelfTo', bind: 't' },
        ],
      },
    ],
  }, // Sterak's Gage

  'sfd-057-221': { manual: true }, // Irelia - Fervent — pas de déclencheurs « quand tu me choisis » / « quand tu me redresses »

  // "When you play me or when I hold, look at the top 4… may reveal a gear and draw it. Recycle the rest."
  'sfd-058-221': {
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
                label: 'Révéler un équipement parmi les 4 et le piocher',
                ops: [
                  { op: 'lookTop', n: 4, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                ],
              },
              { label: 'Aucun équipement : tout recycler', ops: [{ op: 'lookTop', n: 4, keep: 0, rest: 'recycle' }] },
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
                label: 'Révéler un équipement parmi les 4 et le piocher',
                ops: [
                  { op: 'lookTop', n: 4, keep: 1, rest: 'recycle' },
                  { op: 'draw', n: 1 },
                ],
              },
              { label: 'Aucun équipement : tout recycler', ops: [{ op: 'lookTop', n: 4, keep: 0, rest: 'recycle' }] },
            ],
          },
        ],
      },
    ],
  }, // Ornn - Blacksmith

  // manual pour la copie de texte, mais l'attache Equip reste jouable par le moteur
  'sfd-059-221': { equip: { cost: { energy: 1, power: { n: 1, domain: 'Calm' } } }, manual: true }, // Svellsongur — copie le texte de l'unité équipée
  'sfd-060-221': { manual: true }, // Tianna Crownguard — « les adversaires ne peuvent pas gagner de points » (pas de passif de prévention)

  // "When you play me, return a gear from your trash to your hand."
  'sfd-061-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Gear'] }, min: 1, max: 1 } },
          { op: 'toHandFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Aspiring Engineer

  // "When you play me, ready another friendly Mech."
  'sfd-062-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', tag: 'Mech', notSelf: true }, min: 1, max: 1 } }],
        ops: [{ op: 'ready', target: { var: 't' } }],
      },
    ],
  }, // Bubble Bot

  'sfd-063-221': { manual: true }, // Chemtech Cask — condition « sort joué pendant le tour d'un adversaire » inexprimable (cf. Viktor - Innovator)

  // "[Quick-Draw][Equip] Mind" — pas d'autre texte
  'sfd-064-221': {
    quickDraw: true,
    equip: { cost: { power: { n: 1, domain: 'Mind' } } },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
          { op: 'attachSelfTo', bind: 't' },
        ],
      },
    ],
  }, // Cloth Armor

  // "Your Mechs have [Vision]." (soi inclus : Vision explicite au jeu + aura vers les autres)
  'sfd-065-221': {
    keywords: [],
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'vision' }] },
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Vision'], targets: { controller: 'you', tag: 'Mech', notSelf: true } } },
    ],
  }, // Forecaster

  // "[Reaction][Repeat] 2 — Give a unit -2 might this turn."
  'sfd-066-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: -2, duration: 'turn' }],
      repeat: { energy: 2 },
    },
  }, // Frigid Touch

  // "You may pay Mind as an additional cost… if you paid, give a unit -2 might this turn."
  'sfd-067-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 1, domain: 'Mind' } }, prompt: 'Payer 1 Mind (coût additionnel) pour donner -2 might ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
              { op: 'give', target: { var: 't' }, might: -2, duration: 'turn' },
            ],
          },
        ],
      },
    ],
  }, // Frostcoat Cub

  'sfd-068-221': { manual: true }, // Gearhead — double le bonus de Might de base des équipements attachés (pas de passif correspondant)

  // "When I conquer, play a Gold gear token exhausted."
  'sfd-069-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'conquer' }, ops: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }] },
    ],
  }, // Plundering Poro

  // "[Hidden][Action] Deal 3 to a unit at a battlefield. Play a Gold gear token exhausted."
  'sfd-070-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [
        { op: 'deal', n: 3, to: { var: 't' } },
        { op: 'playToken', token: 'gold', where: 'base', exhausted: true },
      ],
    },
  }, // Wages of Pain

  // "Your Mechs have [Deflect] and [Ganking]. I enter ready if you control another Mech."
  'sfd-071-221': {
    keywords: [], // les crochets sont dans le texte d'aura, pas des statiques imprimés
    entersReady: { exists: { controller: 'you', tag: 'Mech', notSelf: true } },
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Deflect', 'Ganking'], targets: { controller: 'you', tag: 'Mech' } } },
    ],
  }, // Breakneck Mech

  // "When you play me, if you control two or more gear, ready me."
  'sfd-072-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'if', cond: { compare: [{ count: { kind: 'gear', controller: 'you' } }, '>=', 2] }, then: [{ op: 'ready', target: { self: true } }] },
        ],
      },
    ],
  }, // Dropboarder

  // "[Equip] Mind" — pas d'autre texte
  'sfd-073-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Mind' } } }, vanilla: true }, // Experimental Hexplate

  // "When you play me, you may kill a gear with Energy cost ≤1. If you do, play a Gold gear token exhausted."
  'sfd-074-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', maxEnergy: 1 }, min: 1, max: 1 }, optional: true }],
        ops: [
          {
            op: 'if',
            cond: { chose: 'g' },
            then: [
              { op: 'kill', target: { var: 'g' } },
              { op: 'playToken', token: 'gold', where: 'base', exhausted: true },
            ],
          },
        ],
      },
    ],
  }, // Pickpocket

  'sfd-075-221': { manual: true }, // Prize of Progress — pas de déclencheur « capacité activée d'un équipement utilisée »

  // "This costs 2 less if you control a Mech. Play a 3 might Mech unit token to your base. Draw 1."
  'sfd-076-221': {
    abilities: [
      { kind: 'passive', effect: { kind: 'costMod', appliesTo: 'self', energyDelta: -2, while: { exists: { controller: 'you', tag: 'Mech' } } } },
    ],
    spell: {
      ops: [
        { op: 'playToken', token: 'mech', where: 'base' },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Production Surge

  // "[Repeat] 4+Mind — Choose one: Deal 4 to a unit in a base. / Kill a gear."
  'sfd-077-221': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            {
              label: 'Infliger 4 à une unité dans une base',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { location: 'base' }, min: 1, max: 1 } },
                { op: 'deal', n: 4, to: { var: 't' } },
              ],
            },
            {
              label: 'Tuer un équipement',
              ops: [
                { op: 'choose', bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 } },
                { op: 'kill', target: { var: 'g' } },
              ],
            },
          ],
        },
      ],
      repeat: { energy: 4, power: { n: 1, domain: 'Mind' } },
    },
  }, // Rocket Barrage

  'sfd-078-221': { manual: true }, // Temporal Portal — donne [Repeat] au prochain sort joué (modification du jeu d'autres cartes)
  'sfd-079-221': { manual: true }, // Bard - Mercurial — coût additionnel « engager ta légende » + déplacement massif vers un champ de bataille libre

  // "[Action][Repeat] 1+Mind — Deal 1 to up to three units at the same location."
  'sfd-080-221': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: {}, min: 1, max: 1 }, optional: true },
        { bind: 'b', spec: { kind: 'unit', filter: { atUnitVar: 'a', notVar: 'a' }, min: 1, max: 2 }, optional: true },
      ],
      ops: [
        { op: 'deal', n: 1, to: { var: 'a' } },
        { op: 'deal', n: 1, to: { var: 'b' } },
      ],
      repeat: { energy: 1, power: { n: 1, domain: 'Mind' } },
    },
  }, // Bellows Breath

  // "…you and each opponent may play a Gold token exhausted. For each opponent who did, you play one." (réduit au 1v1)
  'sfd-081-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'y', spec: { kind: 'yesNo', prompt: 'Jouer un jeton Or engagé ?' } },
          { op: 'if', cond: { var: 'y' }, then: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }] },
          { op: 'choose', bind: 'o', who: 'opp', spec: { kind: 'yesNo', prompt: 'Jouer un jeton Or engagé ?' } },
          {
            op: 'if',
            cond: { var: 'o' },
            then: [
              { op: 'playToken', token: 'gold', where: 'base', exhausted: true, who: 'opp' },
              { op: 'playToken', token: 'gold', where: 'base', exhausted: true, who: 'you' },
            ],
          },
        ],
      },
    ],
  }, // Card Sharp

  'sfd-082-221': { manual: true }, // Ezreal - Dashing — « Je n'inflige pas de dégâts de combat » (exemption de combat sans passif correspondant)
  'sfd-083-221': { manual: true }, // Hextech Anomaly — paiement X variable de Puissance (cf. Bullet Time)
  'sfd-084-221': { manual: true }, // Jayce - Man of Progress — permission de jeu gratuit d'un équipement depuis la main

  // "[Deflect 2][Weaponmaster] I have +1 might for each friendly gear."
  'sfd-085-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you', tag: 'Equipment' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
      { kind: 'passive', effect: { kind: 'selfMight', amount: { count: { kind: 'gear', controller: 'you' } } } },
    ],
  }, // Ornn - Forge God

  // "[Equip] Mind" — pas d'autre texte
  'sfd-086-221': { equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Mind' } } }, vanilla: true }, // World Atlas

  // "[Reaction] Draw 3."
  'sfd-087-221': {
    spell: { ops: [{ op: 'draw', n: 3 }] },
  }, // Premonition

  // "1+Mind: Draw 1. / 4+4 Mind, exhaust: Score 1 point. Use my abilities only while I'm at a battlefield."
  'sfd-088-221': {
    abilities: [
      {
        kind: 'activated',
        cost: { energy: 1, power: { n: 1, domain: 'Mind' } },
        restriction: { selfAt: 'battlefield' },
        ops: [{ op: 'draw', n: 1 }],
      },
      {
        kind: 'activated',
        cost: { energy: 4, power: { n: 4, domain: 'Mind' }, exhaustSelf: true },
        restriction: { selfAt: 'battlefield' },
        ops: [{ op: 'gainPoints', n: 1 }],
      },
    ],
  }, // Renata Glasc - Mastermind

  // "Your Mechs have +1 might (including me). When I hold, play a 3 might Mech unit token to your base."
  'sfd-089-221': {
    abilities: [
      { kind: 'passive', effect: { kind: 'mightAura', amount: 1, targets: { controller: 'you', tag: 'Mech' } } },
      { kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'playToken', token: 'mech', where: 'base' }] },
    ],
  }, // Rumble - Scrapper

  // manual pour la capacité de bannissement, mais l'attache Equip reste jouable par le moteur
  'sfd-090-221': { equip: { bonusMight: 2, cost: { energy: 1, power: { n: 1, domain: 'Mind' } } }, manual: true }, // The Zero Drive — suivi des unités bannies « avec ceci » + jeux gratuits

  // ---- SFD batch 3 ----

  // "When you play me, you may draw 1 or buff me."
  'sfd-091-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        optional: true,
        ops: [
          {
            op: 'mode',
            n: 1,
            options: [
              { label: 'Piocher 1', ops: [{ op: 'draw', n: 1 }] },
              { label: 'Me buffer', ops: [{ op: 'buff', target: { self: true } }] },
            ],
          },
        ],
      },
    ],
  }, // Buhru Captain

  // "[Weaponmaster]" — approximation acceptée : attache gratuite d'un équipement ami
  'sfd-092-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
    ],
  }, // Combat Chef

  // "You may play me to an occupied enemy battlefield."
  'sfd-093-221': { playTo: 'enemyBattlefield', vanilla: true }, // Dauntless Vanguard

  // "I enter ready if you control another Dragon."
  'sfd-094-221': { entersReady: { exists: { controller: 'you', tag: 'Dragon', notSelf: true } }, vanilla: true }, // Direwing

  // "[Equip] Body"
  'sfd-095-221': { equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Body' } } }, vanilla: true }, // Doran's Blade

  // "Ganking" — keyword only, engine-native
  'sfd-096-221': { vanilla: true }, // Laurent Bladekeeper

  // "[Action] Give a unit +5 might this turn."
  'sfd-097-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: 5, duration: 'turn' }],
    },
  }, // Punch First

  // "You may pay 1 energy as an additional cost to play me. When you play me, if you
  //  paid the additional cost, buff me." (approx. Clockwork Keeper : paiement au déclencheur)
  'sfd-098-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie supplémentaire pour buffer Sea Monkey ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'buff', target: { self: true } }] },
        ],
      },
    ],
  }, // Sea Monkey

  // "[Weaponmaster]"
  'sfd-099-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
    ],
  }, // Veteran Poro

  'sfd-100-221': { manual: true }, // Yordle Explorer — déclencheur « carte à coût de Puissance 2+ » : le filtre playCard n'a pas de minPower

  'sfd-101-221': { manual: true }, // Fae Dragon — pas de déclencheur « quand vous dépensez un buff »

  // "[Equip] Body"
  'sfd-102-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Body' } } }, vanilla: true }, // Hexdrinker

  'sfd-103-221': { manual: true }, // Jaull-Fish — réduction de coût de 2 PAR unité Mighty : pas de multiplication d'Amount

  // "[Temporary] Friendly units have [Deflect]."
  'sfd-104-221': {
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Deflect'], targets: { controller: 'you' } } },
    ],
  }, // Petricite Monument

  'sfd-105-221': { manual: true }, // Ruin Runner — inciblable absolu (« can't be chosen ») non exprimable dans l'IR

  // "[Reaction] Draw 1 for each of your [Mighty] units."
  'sfd-106-221': {
    spell: { ops: [{ op: 'draw', n: { count: { controller: 'you', minMight: 5 } } }] },
  }, // Show of Strength

  'sfd-107-221': { manual: true }, // Strike Down — aucun op « détacher un équipement »

  // "[Equip] Body"
  'sfd-108-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Body' } } }, vanilla: true }, // Warmog's Armor

  'sfd-109-221': { manual: true }, // Akshan - Mischievous — vol de gear temporaire (« until I leave ») + attache conditionnelle

  // "When I attack or defend one on one, double my Might this combat."
  // (approx. : durée 'turn' au lieu de « this combat » ; 1v1 = seul de mon côté + exactement 1 ennemi en combat ici)
  'sfd-110-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'attack' },
        ops: [
          {
            op: 'if',
            cond: { and: [{ selfCombatAlone: true }, { compare: [{ count: { controller: 'opp', location: 'here', inCombat: true } }, '==', 1] }] },
            then: [{ op: 'give', target: { self: true }, might: { mightOf: { self: true } }, duration: 'turn' }],
          },
        ],
      },
      {
        kind: 'triggered',
        when: { on: 'defend' },
        ops: [
          {
            op: 'if',
            cond: { and: [{ selfCombatAlone: true }, { compare: [{ count: { controller: 'opp', location: 'here', inCombat: true } }, '==', 1] }] },
            then: [{ op: 'give', target: { self: true }, might: { mightOf: { self: true } }, duration: 'turn' }],
          },
        ],
      },
    ],
  }, // Fiora - Peerless

  'sfd-111-221': { manual: true }, // Here to Help — jeu depuis la main à coût réduit (permission de jeu alternative)

  // "[Deflect] When I move to a battlefield, give another friendly unit my keywords
  //  and +might equal to my Might this turn." (approx. : « my keywords » figé à [Deflect], son seul mot-clé imprimé)
  'sfd-112-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          {
            op: 'if',
            cond: { selfAt: 'battlefield' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', notSelf: true }, min: 1, max: 1 } },
              { op: 'give', target: { var: 't' }, keywords: ['Deflect'], might: { mightOf: { self: true } }, duration: 'turn' },
            ],
          },
        ],
      },
    ],
  }, // Kato the Arm

  // "[Weaponmaster] The first time I conquer each turn, ready me."
  'sfd-113-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
      { kind: 'triggered', when: { on: 'conquer' }, oncePerTurn: true, ops: [{ op: 'ready', target: { self: true } }] },
    ],
  }, // Lucian - Merciless

  // "[Action][Repeat 3] Choose a friendly unit anywhere and an enemy unit at a battlefield.
  //  They deal damage equal to their Mights to each other."
  'sfd-114-221': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'deal', n: { mightOf: { var: 'a' } }, to: { var: 'b' } },
        { op: 'deal', n: { mightOf: { var: 'b' } }, to: { var: 'a' } },
      ],
      repeat: { energy: 3 },
    },
  }, // Marching Orders

  // "[Equip] Body"
  'sfd-115-221': { equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Body' } } }, vanilla: true }, // Trinity Force

  'sfd-116-221': { manual: true }, // Yone - Blademaster — condition « battlefield qui était incontrôlé » (état pré-conquête) non exprimable

  'sfd-117-221': { manual: true }, // Ancient Henge — paiement X variable (« pay any amount of Energy »)

  // "[Equip] 1 energy + Body"
  'sfd-118-221': { equip: { bonusMight: 2, cost: { energy: 1, power: { n: 1, domain: 'Body' } } }, vanilla: true }, // Boneshiver

  'sfd-119-221': { manual: true }, // Jax - Unrelenting — pas de déclencheur « quand vous m'attachez un équipement »

  'sfd-120-221': { manual: true }, // Sivir - Ambitious — suivi des dégâts excédentaires assignés (cf. Tryndamere)

  // "When you play a card from face down, play a Gold gear token exhausted."
  'sfd-121-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'youPlayFromHidden' },
        ops: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }],
      },
    ],
  }, // Black Market Broker

  // "[Action][Repeat Chaos] Look at the top 2 cards of your Main Deck. Draw one and recycle the other."
  'sfd-122-221': {
    spell: {
      ops: [
        { op: 'lookTop', n: 2, keep: 1, rest: 'recycle' },
        { op: 'draw', n: 1 },
      ],
      repeat: { power: { n: 1, domain: 'Chaos' } },
    },
  }, // Called Shot

  'sfd-123-221': { manual: true }, // Corrupt Enforcer — pas de déclencheur « quand je gagne un combat »

  // "[Equip] Chaos"
  'sfd-124-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Chaos' } } }, vanilla: true }, // Doran's Ring

  // "When I move to a battlefield, you may pay Chaos to move a unit you control to the same battlefield."
  'sfd-125-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [
          {
            op: 'if',
            cond: { selfAt: 'battlefield' },
            then: [
              { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 1, domain: 'Chaos' } }, prompt: 'Payer 1 Chaos pour déplacer une unité amie ici ?' } },
              {
                op: 'if',
                cond: { var: 'p' },
                then: [
                  { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', notSelf: true }, min: 1, max: 1 } },
                  { op: 'moveTo', target: { var: 't' }, to: 'here' },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Fae Porter

  'sfd-126-221': { manual: true }, // Loyal Pup — pas de déclencheur joueur « quand vous défendez » (defend = la source défend, defendHere = battlefield)

  // "[Weaponmaster]"
  'sfd-127-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 'g' }, then: [{ op: 'attachBoundToSelf', bind: 'g' }] }],
      },
    ],
  }, // Master Bingwen

  // "When I defend, you may kill me to move an attacking unit to its base."
  'sfd-128-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'defend' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { killSelf: true }, prompt: 'Tuer Overzealous Fan pour renvoyer un attaquant à sa base ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { combatRole: 'attacker' }, min: 1, max: 1 } },
              { op: 'recall', target: { var: 't' } },
            ],
          },
        ],
      },
    ],
  }, // Overzealous Fan

  // "[Repeat 2] Move an enemy unit to a location where there's a unit with the same controller."
  // (réduction 1v1 : destination = position d'une autre unité ennemie, base incluse)
  'sfd-129-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } }],
      ops: [
        { op: 'choose', bind: 'u', spec: { kind: 'unit', filter: { controller: 'opp', notVar: 't' }, min: 1, max: 1 } },
        { op: 'moveTo', target: { var: 't' }, to: { atUnit: 'u' } },
      ],
      repeat: { energy: 2 },
    },
  }, // Temptation

  // "When I move, play a Gold gear token exhausted."
  'sfd-130-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'move' }, ops: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }] },
    ],
  }, // Treasure Hunter

  // "[Accelerate] I have [Assault] equal to the number of enemy units here."
  // (Assault N dynamique modélisé par sa définition : +1 might par instance tant que je suis attaquant)
  'sfd-131-221': {
    keywords: ['Accelerate'],
    abilities: [
      {
        kind: 'passive',
        effect: {
          kind: 'selfMight',
          amount: { count: { controller: 'opp', location: 'here' } },
          while: { exists: { self: true, combatRole: 'attacker' } },
        },
      },
    ],
  }, // Ancient Warmonger

  // "When you play me, return another friendly unit and an enemy unit to their owners' hands."
  'sfd-132-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [
          { bind: 'a', spec: { kind: 'unit', filter: { controller: 'you', notSelf: true }, min: 1, max: 1 } },
          { bind: 'b', spec: { kind: 'unit', filter: { controller: 'opp' }, min: 1, max: 1 } },
        ],
        ops: [
          { op: 'returnToHand', target: { var: 'a' } },
          { op: 'returnToHand', target: { var: 'b' } },
        ],
      },
    ],
  }, // Beast Below

  // "[Equip] Chaos"
  'sfd-133-221': { equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Chaos' } } }, vanilla: true }, // Boots of Swiftness

  // "[Equip] Chaos"
  'sfd-134-221': { equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Chaos' } } }, vanilla: true }, // Cull

  // "[Action] Return a gear to its owner's hand."
  'sfd-135-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 } }],
      ops: [{ op: 'returnToHand', target: { var: 't' } }],
    },
  }, // Factory Recall

  // ---- SFD batch 4 ----

  // "[Reaction][Repeat 2] Counter a spell unless its controller pays 2 energy."
  'sfd-136-221': {
    spell: {
      ops: [
        { op: 'choose', bind: 'p', who: 'opp', spec: { kind: 'mayPay', cost: { energy: 2 }, prompt: 'Payer 2 énergie pour empêcher que le sort soit contré ?' } },
        { op: 'if', cond: { not: { var: 'p' } }, then: [{ op: 'counterSpell' }] },
      ],
      repeat: { energy: 2 },
    },
  }, // Hard Bargain

  'sfd-137-221': { manual: true }, // Harpoon Squad — « when I move FROM a battlefield » : l'origine d'un déplacement n'est pas observable (on:'move' ne voit que la destination)

  // "[Hidden] When you play me, you may return another unit at a battlefield with 3 might or less to its owner's hand."
  'sfd-138-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield', maxMight: 3, notSelf: true }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 't' }, then: [{ op: 'returnToHand', target: { var: 't' } }] }],
      },
    ],
  }, // Windsinger

  // "[Hidden] When you play this from face down, attach it to a unit you control (here). [Equip] Chaos"
  // NB: pas de condition « joué depuis face cachée » — l'attache au jeu est rendue optionnelle (voir NOTES).
  'sfd-139-221': {
    equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Chaos' } } },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'here' }, min: 1, max: 1 }, optional: true }],
        ops: [{ op: 'if', cond: { chose: 't' }, then: [{ op: 'attachSelfTo', bind: 't' }] }],
      },
    ],
  }, // Edge of Night

  'sfd-140-221': { manual: true }, // Fizz - Trickster — jeu gratuit d'un SORT depuis la défausse (playUnitsFromTrash ne couvre que les unités)
  'sfd-141-221': { manual: true }, // Irelia - Graceful — réduction de coût conditionnée au ciblage (« that choose me »)
  'sfd-142-221': { manual: true }, // Jae Medarda — aucun déclencheur « quand vous me choisissez avec un sort »
  'sfd-143-221': { manual: true, keywords: ['Accelerate'] }, // Sivir - Mercenary — « 2+ puissance dépensée ce tour » non trackable ; [Ganking] conditionnel exclu des statiques
  'sfd-144-221': { manual: true }, // Spirit Wheel — aucun déclencheur « quand vous choisissez une unité alliée »
  'sfd-145-221': { manual: true }, // Switcheroo — échange de Might : nécessite une arithmétique (M(a)−M(b)) absente des Amounts
  'sfd-146-221': { manual: true }, // Vex - Cheerless — surcoût des sorts ENNEMIS + réduction de coût en Puissance inexprimables (costMod = énergie, vos cartes seulement)

  // "Return all units and gear to their owners' hands."
  'sfd-147-221': {
    spell: { ops: [{ op: 'returnToHand', target: { all: { kind: 'any', controller: 'any' } } }] },
  }, // Downwell

  'sfd-148-221': { manual: true }, // Draven - Audacious — pas de déclencheur « je gagne un combat » ni de condition « mort en combat »

  // "When you play me, discard 1, then draw 2. Optional additional costs you pay cost 1 less."
  // NB: la réduction des coûts additionnels n'est pas scriptable (voir NOTES).
  'sfd-149-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'discard', n: 1, who: 'you' },
          { op: 'draw', n: 2 },
        ],
      },
    ],
  }, // Ezreal - Prodigy (partiel)

  // "[Equip] — Chaos, Recycle 2 cards from your trash"
  'sfd-150-221': {
    equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'Chaos' }, recycleTrash: 2 } },
  }, // Last Rites

  // "[Reaction][Repeat 2] Give two friendly units each +1 might this turn."
  'sfd-151-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 2, max: 2 } }],
      ops: [{ op: 'give', target: { var: 't' }, might: 1, duration: 'turn' }],
      repeat: { energy: 2 },
    },
  }, // Bonds of Strength

  // "When I hold, play two Gold gear tokens exhausted."
  'sfd-152-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'hold' }, ops: [{ op: 'playToken', token: 'gold', n: 2, where: 'base', exhausted: true }] },
    ],
  }, // Eminent Benefactor

  // "[Equip] Order"
  'sfd-153-221': {
    equip: { cost: { power: { n: 1, domain: 'Order' } } },
  }, // Eye of the Herald

  // "[Hidden] Play a 2 might Sand Soldier unit token. You may pay Order to ready it."
  'sfd-154-221': {
    spell: {
      ops: [
        { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 1, domain: 'Order' } }, prompt: 'Payer 1 Ordre pour que le Soldat des sables arrive redressé ?' } },
        {
          op: 'if',
          cond: { var: 'p' },
          then: [{ op: 'playToken', token: 'sandsoldier', where: 'base', exhausted: false }],
          else: [{ op: 'playToken', token: 'sandsoldier', where: 'base' }],
        },
      ],
    },
  }, // Guards!

  // "[Deathknell] — Play a Gold gear token exhausted."
  'sfd-155-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'deathknell' }, ops: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }] },
    ],
  }, // Honest Broker

  // "[Assault 2]" — keyword only
  'sfd-156-221': { vanilla: true }, // Laurent Duelist

  // "When you play me, play a 2 might Sand Soldier unit token here."
  'sfd-157-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'sandsoldier', where: 'here' }] },
    ],
  }, // Royal Guard

  // "When you play me, kill an enemy unit with 3 might or less."
  'sfd-158-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', maxMight: 3 }, min: 1, max: 1 } }],
        ops: [{ op: 'kill', target: { var: 't' } }],
      },
    ],
  }, // Sandshifter

  // "While you have another unit here, I have +1 might."
  'sfd-159-221': {
    abilities: [
      { kind: 'passive', effect: { kind: 'selfMight', amount: 1, while: { exists: { controller: 'you', location: 'here', notSelf: true } } } },
    ],
  }, // Trusty Ramhound

  // "You may kill a friendly gear as an additional cost to play me.
  //  When you play me, if you paid the additional cost, kill a gear."
  // NB: coût additionnel modélisé comme choix optionnel au jeu (voir NOTES).
  'sfd-160-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        targets: [{ bind: 'pay', spec: { kind: 'unit', filter: { kind: 'gear', controller: 'you' }, min: 1, max: 1 }, optional: true }],
        ops: [
          {
            op: 'if',
            cond: { chose: 'pay' },
            then: [
              { op: 'kill', target: { var: 'pay' } },
              { op: 'choose', bind: 'g', spec: { kind: 'unit', filter: { kind: 'gear' }, min: 1, max: 1 } },
              { op: 'kill', target: { var: 'g' } },
            ],
          },
        ],
      },
    ],
  }, // Zaun Punk

  // "[Equip] Order"
  'sfd-161-221': {
    equip: { bonusMight: 3, cost: { power: { n: 1, domain: 'Order' } } },
  }, // B.F. Sword

  // "[Action] Kill a unit at a battlefield with 2 might or less. Enemy → 1 Gold token; friendly → 2 Gold tokens."
  // NB: branche ami/ennemi rendue par un mode (pas de cond sur le contrôleur d'une variable).
  'sfd-162-221': {
    spell: {
      ops: [
        {
          op: 'mode',
          n: 1,
          options: [
            {
              label: 'Tuer une unité ennemie (2 Might ou moins) : 1 jeton Or',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'opp', location: 'battlefield', maxMight: 2 }, min: 1, max: 1 } },
                { op: 'kill', target: { var: 't' } },
                { op: 'playToken', token: 'gold', where: 'base', exhausted: true },
              ],
            },
            {
              label: 'Tuer une unité alliée (2 Might ou moins) : 2 jetons Or',
              ops: [
                { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'battlefield', maxMight: 2 }, min: 1, max: 1 } },
                { op: 'kill', target: { var: 't' } },
                { op: 'playToken', token: 'gold', n: 2, where: 'base', exhausted: true },
              ],
            },
          ],
        },
      ],
    },
  }, // Blood Money

  // "[Reaction] Kill a friendly unit. If you do, give +might equal to its Might to another friendly unit this turn. Draw 1."
  'sfd-163-221': {
    spell: {
      targets: [
        { bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
        { bind: 'u', spec: { kind: 'unit', filter: { controller: 'you', notVar: 't' }, min: 1, max: 1 }, optional: true },
      ],
      ops: [
        { op: 'if', cond: { chose: 'u' }, then: [{ op: 'give', target: { var: 'u' }, might: { mightOf: { var: 't' } }, duration: 'turn' }] },
        { op: 'kill', target: { var: 't' } },
        { op: 'draw', n: 1 },
      ],
    },
  }, // Deathgrip

  // "[Action] I cost 2 less to play from anywhere other than your hand. Kill a unit at a battlefield."
  // NB: la clause de réduction hors-main n'est pas scriptable (voir NOTES).
  'sfd-164-221': {
    spell: {
      targets: [{ bind: 't', spec: { kind: 'unit', filter: { location: 'battlefield' }, min: 1, max: 1 } }],
      ops: [{ op: 'kill', target: { var: 't' } }],
    },
  }, // Drag Under (partiel)

  // "[Deathknell] — You may play a unit with cost ≤3 energy (and ≤1 power) from your trash, ignoring its cost."
  // NB: la contrainte « pas plus de 1 Puissance » n'est pas filtrable (voir NOTES).
  'sfd-165-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        optional: true,
        ops: [
          { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'trash', who: 'you', filter: { type: ['Unit'], maxEnergy: 3 }, min: 1, max: 1 } },
          { op: 'playUnitsFromTrash', bind: 'c' },
        ],
      },
    ],
  }, // Glasc Mixologist

  'sfd-166-221': { manual: true }, // Rally the Troops — déclencheur différé « quand une unité alliée est jouée ce tour, buffez-la » (watch ne couvre que mort/dégâts)

  // "[Deathknell] — If I was [Mighty], draw 2."
  'sfd-167-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'deathknell' },
        ops: [{ op: 'if', cond: { compare: [{ mightOf: { self: true } }, '>=', 5] }, then: [{ op: 'draw', n: 2 }] }],
      },
    ],
  }, // Unsung Hero

  // "exhaust: Play three 1 might Recruit unit tokens. (You may play them to different locations.)"
  // NB: destinations libres non exprimables — les trois vont en base (voir NOTES).
  'sfd-168-221': {
    abilities: [
      { kind: 'activated', cost: { exhaustSelf: true }, ops: [{ op: 'playToken', token: 'recruit', n: 3, where: 'base' }] },
    ],
  }, // Vanguard Armory

  // "When a friendly unit dies, you may exhaust me to draw 1, then put a card from your hand
  //  on the top or bottom of your Main Deck."
  // NB: « dessus du deck » indisponible — seul le dessous (recycle) est proposé (voir NOTES).
  'sfd-169-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'unitDies', filter: { controller: 'you' } },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { exhaustSelf: true }, prompt: 'Engager l\'Autel pour piocher 1 puis recycler une carte de la main ?' } },
          {
            op: 'if',
            cond: { var: 'p' },
            then: [
              { op: 'draw', n: 1 },
              { op: 'choose', bind: 'c', spec: { kind: 'card', zone: 'hand', who: 'you', min: 1, max: 1 } },
              { op: 'recycleFromHand', bind: 'c', who: 'you' },
            ],
          },
        ],
      },
    ],
  }, // Altar of Memories

  'sfd-170-221': { manual: true }, // Rek'Sai - Swarm Queen — révélation du dessus du deck + jeu gratuit/bannissement depuis le deck
  'sfd-171-221': { manual: true }, // Renata Glasc - Industrialist — entryReady ne peut pas être restreint aux jetons ('yourUnits' seulement)

  // "[Equip] Order"
  'sfd-172-221': {
    equip: { bonusMight: 1, cost: { power: { n: 1, domain: 'Order' } } },
  }, // Sacred Shears

  'sfd-173-221': { manual: true, keywords: ['Backline'] }, // Soraka - Wanderer — remplacement permanent de mort sur d'autres unités (« would die… instead ») ; Backline gardé en statique
  'sfd-174-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'playToken', token: 'gold', n: 4, where: 'base', exhausted: true }] },
    ],
  }, // Trove Golem — "When you play me, play four Gold gear tokens exhausted."

  // "When you play me, give your other units +2 might this turn. As I'm revealed from your deck, [Add] 2 energy."
  // NB: la clause de révélation depuis le deck n'est pas scriptable (voir NOTES).
  'sfd-175-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [{ op: 'give', target: { all: { controller: 'you', notSelf: true } }, might: 2, duration: 'turn' }],
      },
    ],
  }, // Undertitan (partiel)

  // "[Tank] I enter ready if you have two or more other units in your base."
  'sfd-176-221': {
    entersReady: { compare: [{ count: { controller: 'you', location: 'base', notSelf: true } }, '>=', 2] },
  }, // Xin Zhao - Vigilant

  'sfd-177-221': { manual: true }, // Azir - Sovereign — « your token units » : aucun prédicat jeton dans UnitFilter (et « any number » multi-déplacement)
  'sfd-178-221': { manual: true }, // Blade of the Ruined King — coût d'Equip « Kill a friendly unit » inexprimable dans Cost (killSelf seulement)

  // "[Accelerate] When I move to a battlefield, play three 1 might Recruit unit tokens here."
  'sfd-179-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'move' },
        ops: [{ op: 'if', cond: { selfAt: 'battlefield' }, then: [{ op: 'playToken', token: 'recruit', n: 3, where: 'here' }] }],
      },
    ],
  }, // Corina Veraza

  'sfd-180-221': { manual: true }, // Fiora - Worthy — aucun déclencheur « quand une unité devient [Mighty] »

  // ---- SFD batch 5 : légendes, signatures & champs de bataille ----

  // "Your Mechs have [Shield]."
  'sfd-181-221': {
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Shield 1'], targets: { controller: 'you', tag: 'Mech' } } },
    ],
  }, // Rumble - Mechanized Menace

  // "[Reaction][Repeat] 1 energy + 1 any power — Give your Mechs +1 might this turn."
  'sfd-182-221': {
    spell: {
      ops: [{ op: 'give', target: { all: { controller: 'you', tag: 'Mech' } }, might: 1, duration: 'turn' }],
      repeat: { energy: 1, power: { n: 1, domain: 'any' } },
    },
  }, // Danger Zone

  // "Your Equipment each give [Assault]."
  'sfd-183-221': {
    abilities: [
      { kind: 'passive', effect: { kind: 'grantKeywords', keywords: ['Assault 1'], targets: { controller: 'you', hasAttachment: true } } },
    ],
  }, // Lucian - Purifier (approx. : ne cumule pas par Équipement)

  'sfd-184-221': { manual: true }, // Relentless Pursuit — attache d'un Équipement quelconque (pas d'op générique) + capacité textuelle accordée « ce tour »

  'sfd-185-221': { manual: true }, // Draven - Glorious Executioner — déclencheur « quand tu gagnes un combat » absent de l'IR

  // "[Quick-Draw][Equip] 1 any power. [Temporary]"
  'sfd-186-221': {
    quickDraw: true,
    equip: { bonusMight: 3, cost: { power: { n: 1, domain: 'any' } } },
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'play' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you' }, min: 1, max: 1 } },
          { op: 'attachSelfTo', bind: 't' },
        ],
      },
    ],
  }, // Spinning Axe

  'sfd-187-221': { manual: true }, // Rek'sai - Void Burrower — révélation du deck + jeu gratuit d'une carte révélée

  'sfd-188-221': { manual: true }, // Void Rush — jeu depuis le deck avec réduction de coût + « draw any you didn't banish »

  'sfd-189-221': { manual: true }, // Ornn - Fire Below the Mountain — ressource à usage restreint (gear uniquement), comme la légende Kai'Sa

  // "[Unique][Equip] 1 any power." (aucun autre texte)
  'sfd-190-221': {
    vanilla: true,
    equip: { bonusMight: 3, cost: { power: { n: 1, domain: 'any' } } },
  }, // Forgefire Cape

  // "[Unique][Equip] 1 any power." (aucun autre texte)
  'sfd-191-221': {
    vanilla: true,
    equip: { bonusMight: 3, cost: { power: { n: 1, domain: 'any' } } },
  }, // Rabadon's Deathcrown

  // "[Unique][Equip] 1 any power. When you play this, ready your units."
  'sfd-192-221': {
    equip: { bonusMight: 2, cost: { power: { n: 1, domain: 'any' } } },
    abilities: [
      { kind: 'triggered', when: { on: 'play' }, ops: [{ op: 'ready', target: { all: { controller: 'you' } } }] },
    ],
  }, // Shurelya's Requiem

  'sfd-193-221': { manual: true }, // Jax - Grandmaster At Arms — pas d'op « attacher un Équipement quelconque à une unité » (attachSelfTo/attachBoundToSelf exigent la source)

  'sfd-194-221': { manual: true }, // Counter Strike — prévention de dégâts (watch ne connaît pas preventDamage)

  'sfd-195-221': { manual: true }, // Irelia - Blade Dancer — déclencheur « quand tu choisis une unité alliée » absent de l'IR

  // "[Reaction] Give a unit +2 might this turn and another unit -2 might this turn."
  'sfd-196-221': {
    spell: {
      targets: [
        { bind: 'a', spec: { kind: 'unit', filter: {}, min: 1, max: 1 } },
        { bind: 'b', spec: { kind: 'unit', filter: { notVar: 'a' }, min: 1, max: 1 } },
      ],
      ops: [
        { op: 'give', target: { var: 'a' }, might: 2, duration: 'turn' },
        { op: 'give', target: { var: 'b' }, might: -2, duration: 'turn' },
      ],
    },
  }, // Defiant Dance

  'sfd-197-221': { manual: true }, // Azir - Emperor of the Sands — restriction « seulement si tu as joué un Équipement ce tour » inexprimable (pas de suivi des types joués)

  // "Play a 2 might Sand Soldier token for each Equipment you control. Then: ready up to two of them."
  'sfd-198-221': {
    spell: {
      ops: [
        { op: 'playToken', token: 'sandsoldier', n: { count: { kind: 'gear', controller: 'you', tag: 'Equipment' } }, where: 'base' },
        { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', tag: 'Sand Soldier' }, min: 1, max: 2 }, optional: true },
        { op: 'ready', target: { var: 't' } },
      ],
    },
  }, // Arise! (approx. : « of them » = n'importe quels Sand Soldiers alliés)

  'sfd-199-221': { manual: true }, // Ezreal - Prodigal Explorer — restriction « ciblé deux fois ce tour » : aucun compteur de ciblage dans l'IR

  'sfd-200-221': { manual: true }, // Arcane Shift — bannir puis rejouer gratuitement (même famille que Portal Rescue, manuelle)

  'sfd-201-221': { manual: true }, // Renata Glasc - Chem-Baroness — « your Gold [ADD] an additional 1 energy » modifie les capacités d'autres cartes

  'sfd-202-221': { manual: true }, // Hostile Takeover — prise de contrôle temporaire (takeControl n'a pas de restitution en fin de tour)

  'sfd-203-221': { manual: true }, // Sivir - Battle Mistress — déclencheur « quand tu recycles une rune » absent (youRecycle = cartes du Main Deck)

  // "Ready your units."
  'sfd-204-221': {
    spell: { ops: [{ op: 'ready', target: { all: { controller: 'you' } } }] },
  }, // On the Hunt

  'sfd-205-221': { manual: true }, // Fiora - Grand Duelist — déclencheur « quand une unité devient [Mighty] » absent de l'IR

  'sfd-206-221': { manual: true }, // Riposte — ciblage d'un sort sur la chaîne + bonus égal au coût de ce sort inexprimables

  // "When you conquer here, you may pay 1 energy and return a unit you control here to hand.
  //  If you do, play a 2 might Sand Soldier token here."
  'sfd-207-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquerHere' },
        ops: [
          { op: 'choose', bind: 't', spec: { kind: 'unit', filter: { controller: 'you', location: 'here' }, min: 1, max: 1 }, optional: true },
          {
            op: 'if',
            cond: { chose: 't' },
            then: [
              { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour renvoyer cette unité en main et jouer un Sand Soldier ici ?' } },
              {
                op: 'if',
                cond: { var: 'p' },
                then: [
                  { op: 'returnToHand', target: { var: 't' } },
                  { op: 'playToken', token: 'sandsoldier', where: 'here' },
                ],
              },
            ],
          },
        ],
      },
    ],
  }, // Emperor's Dais

  'sfd-208-221': { manual: true }, // Forge of the Fluft — accorde une capacité activée textuelle aux légendes + op d'attache générique manquant

  'sfd-209-221': { manual: true }, // Forgotten Monument — restriction de scoring (« until their third turn ») hors moteur

  'sfd-210-221': { manual: true }, // Hall of Legends — aucun op pour redresser une légende (UnitRef ne couvre pas la zone légende)

  'sfd-211-221': { manual: true }, // Marai Spire — réduction des coûts de [Repeat] (costMod ne vise que les coûts de jeu)

  // "When you conquer here, put the top 2 cards of your Main Deck into your trash."
  'sfd-212-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'conquerHere' }, ops: [{ op: 'lookTop', n: 2, keep: 0, rest: 'trash' }] },
    ],
  }, // Minefield

  'sfd-213-221': { manual: true }, // Ornn's Forge — « premier gear non-jeton chaque tour » : costMod sans limite par tour

  // "When you hold here, you may pay 4 any power to score 1 point."
  'sfd-214-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'holdHere' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { power: { n: 4, domain: 'any' } }, prompt: 'Payer 4 puissances pour marquer 1 point ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'gainPoints', n: 1 }] },
        ],
      },
    ],
  }, // Power Nexus

  'sfd-215-221': { manual: true }, // Ravenbloom Conservatory — révélation du dessus du deck avec branche selon le type de carte

  'sfd-216-221': { manual: true }, // Rockfall Path — restriction de jeu (« Units can't be played here »)

  'sfd-217-221': { manual: true }, // Seat of Power — aucun Amount pour le nombre de champs de bataille contrôlés

  // "When you conquer here with one or more [Mighty] units, you may pay 1 energy to draw 1."
  'sfd-218-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquerHere' },
        ops: [
          {
            op: 'if',
            cond: { exists: { controller: 'you', location: 'here', minMight: 5 } },
            then: [
              { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour piocher 1 ?' } },
              { op: 'if', cond: { var: 'p' }, then: [{ op: 'draw', n: 1 }] },
            ],
          },
        ],
      },
    ],
  }, // Sunken Temple

  // "When you hold here, each player channels 1 rune exhausted."
  'sfd-219-221': {
    abilities: [
      { kind: 'triggered', when: { on: 'holdHere' }, ops: [{ op: 'channel', n: 1, who: 'each', exhausted: true }] },
    ],
  }, // The Papertree

  // "When you conquer here, you may pay 1 energy to play a Gold gear token exhausted."
  'sfd-220-221': {
    abilities: [
      {
        kind: 'triggered',
        when: { on: 'conquerHere' },
        ops: [
          { op: 'choose', bind: 'p', spec: { kind: 'mayPay', cost: { energy: 1 }, prompt: 'Payer 1 énergie pour jouer un jeton Gold épuisé ?' } },
          { op: 'if', cond: { var: 'p' }, then: [{ op: 'playToken', token: 'gold', where: 'base', exhausted: true }] },
        ],
      },
    ],
  }, // Treasure Hoard

  'sfd-221-221': { manual: true }, // Veiled Temple — aucun op « détacher un Équipement » dans l'IR

}
