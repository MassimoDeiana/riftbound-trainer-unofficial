// Card-effect Intermediate Representation.
// Scripts are pure-data TypeScript objects (JSON-serializable, no closures):
// GameState may embed op arrays (frames) safely — structuredClone and JSON
// round-trips keep everything deterministic. Anything that doesn't fit the
// vocabulary escapes through { op: 'custom', id } into src/effects/custom.ts.
import type { Domain } from '../data/cards'

// ---------------------------------------------------------------- amounts

export type Amount =
  | number
  | { count: UnitFilter } // number of matching units
  | { mightOf: UnitRef }
  | { handSize: Who }
  | { trashSize: Who }
  | { pointsOf: Who }
  | { runesInPlay: Who }
  | { runeDeckSize: Who }
  | { negate: Amount }
  | { maxMightAmong: UnitFilter }
  | { energyOfBound: string }
  | { xpOf: Who }

export type Who = 'you' | 'opp' | 'each'

// ---------------------------------------------------------------- filters

/** Predicate over units/gear on the board, evaluated relative to the effect's source. */
export interface UnitFilter {
  /** Only the source unit itself (self-auras). */
  self?: true
  controller?: 'you' | 'opp' | 'any'
  kind?: 'unit' | 'gear' | 'any' // default 'unit'
  location?: 'here' | 'base' | 'battlefield' | 'anywhere' // default 'anywhere'
  champion?: boolean
  tag?: string
  keyword?: string
  maxEnergy?: number
  minMight?: number
  maxMight?: number
  hasBuff?: boolean
  damaged?: boolean
  exhausted?: boolean
  stunned?: boolean
  notTag?: string
  /** Combat participation filters. */
  inCombat?: boolean
  combatRole?: 'attacker' | 'defender'
  /** Location equals a bound location variable ("at that battlefield"). */
  atVar?: string
  /** Location equals the location of the unit bound to this variable. */
  atUnitVar?: string
  /** The unit this (gear) source is attached to. */
  attachedToMe?: true
  /** Units with at least one attachment (SFD synergies). */
  hasAttachment?: boolean
  notSelf?: boolean
  /** Excludes units already bound to this variable ("another unit"). */
  notVar?: string
}

/** Predicate over cards in hidden/ordered zones (hand, trash, deck). */
export interface CardFilter {
  type?: ('Unit' | 'Spell' | 'Gear')[]
  maxEnergy?: number
  tag?: string
  domain?: Domain
}

// ---------------------------------------------------------------- runtime refs

export type UnitRef =
  | { var: string } // bound by a choose/forEach
  | { self: true } // the source unit/gear of the ability
  | { event: true } // the unit the trigger fired for (died, arrived, …)
  | { all: UnitFilter } // every matching unit (mass effects)

// ---------------------------------------------------------------- choices

export type ChoiceIR =
  | { kind: 'unit'; filter: UnitFilter; min: number; max: number }
  | { kind: 'card'; zone: 'hand' | 'trash'; who: Who; filter?: CardFilter; min: number; max: number }
  | { kind: 'mode'; options: string[]; n: number }
  | { kind: 'mayPay'; cost: Cost; prompt: string }
  | { kind: 'yesNo'; prompt: string }
  /** Destination for moving a (bound) unit: base or a battlefield. */
  | { kind: 'location'; forUnit: UnitRef; allowSame?: boolean }
  /** Pick a battlefield index (bound as a location var). */
  | { kind: 'battlefieldPick' }

export interface NamedTarget {
  bind: string
  spec: ChoiceIR
  /** Optional targets ("you may choose"): zero picks allowed. */
  optional?: boolean
}

// ---------------------------------------------------------------- costs

export interface Cost {
  energy?: number
  /** Power cost; domain 'identity' = your legend's domains, 'any' = any domain. */
  power?: { n: number; domain: Domain | 'identity' | 'any' }
  exhaustSelf?: boolean
  killSelf?: boolean
  spendBuffSelf?: boolean
  discard?: number
  /** Recycle N cards of your choice from your trash (bottom of deck). */
  recycleTrash?: number
}

// ---------------------------------------------------------------- conditions

export type Cond =
  | { legion: true } // you played another card this turn
  | { exists: UnitFilter }
  | { compare: [Amount, '>=' | '<=' | '>' | '<' | '==', Amount] }
  | { youControlBattlefield: true }
  | { controlsBattlefield: Who }
  | { selfAt: 'battlefield' | 'base' }
  | { dead: UnitRef } // bound unit left the board or has lethal damage
  | { chose: string } // a bound (possibly optional) choice is non-empty
  | { var: string } // truthy bound variable (yesNo answers)
  | { onlyFriendlyAt: UnitRef } // it is the only unit its controller has there
  | { discardedThisTurn: true } // you discarded a card this turn
  | { xpAtLeast: number } // Level N
  | { selfEmpowered: true } // Empowered (828)
  | { selfCombatAlone: true } // source attacks/defends with no friendly ally there
  | { youHaveFacedown: true } // you control a facedown card at a battlefield
  | { enemyDiedThisTurn: true }
  | { varEquals: [string, string] } // bound string variable comparison
  | { not: Cond }
  | { and: Cond[] }

// ---------------------------------------------------------------- ops

export type Op =
  // Player input — suspends the VM until answered via the `choose` action.
  | { op: 'choose'; bind: string; who?: Who; spec: ChoiceIR; optional?: boolean }
  // Units
  | { op: 'deal'; n: Amount; to: UnitRef }
  | { op: 'kill'; target: UnitRef }
  | { op: 'stun'; target: UnitRef }
  | { op: 'buff'; target: UnitRef }
  | { op: 'heal'; n: Amount | 'all'; target: UnitRef }
  | { op: 'ready'; target: UnitRef }
  | { op: 'exhaust'; target: UnitRef }
  | { op: 'recall'; target: UnitRef }
  | { op: 'banish'; target: UnitRef }
  | { op: 'returnToHand'; target: UnitRef }
  | { op: 'give'; target: UnitRef; might?: Amount; keywords?: string[]; duration: 'turn' | 'permanent' }
  /** Move units: to base, the source's location, a bound location choice, or
   *  the location of a bound unit. */
  | { op: 'moveTo'; target: UnitRef; to: 'base' | 'here' | { var: string } | { atUnit: string }; ready?: boolean }
  // Players & resources
  | { op: 'draw'; n: Amount; who?: Who | { controllerOf: string } }
  | { op: 'discard'; n: Amount; who: Who } // the discarding player picks the cards
  | { op: 'addEnergy'; n: Amount; who?: Who }
  | { op: 'addPower'; n: Amount; domain: Domain | 'identity' | 'any'; who?: Who }
  | { op: 'channel'; n: Amount; who?: Who; exhausted?: boolean }
  | { op: 'gainPoints'; n: Amount; who?: Who }
  | { op: 'gainXp'; n: Amount; who?: Who }
  // Cards & zones
  | { op: 'toHandFromTrash'; bind: string } // bound card choice → hand
  | { op: 'recycleFromTrash'; bind: string }
  | { op: 'vision' } // look at top card; may recycle (bottom)
  | { op: 'unbuff'; target: UnitRef } // spend/remove a buff
  | { op: 'readyRunes'; n: Amount; who?: Who } // ready up to N exhausted runes
  | { op: 'counterSpell'; maxEnergy?: number; maxPower?: number } // counter the spell below on the chain
  /** Look at the top N cards; keep up to `keep` on top (chosen), recycle the rest. */
  | { op: 'lookTop'; n: number; keep: number; rest: 'recycle' | 'trash' }
  /** Schedule ops to run during this turn's Ending Step. */
  | { op: 'atEndOfTurn'; ops: Op[] }
  | { op: 'winGame'; who?: Who }
  /** Take an extra turn after this one (Time Warp). */
  | { op: 'extraTurn'; who?: Who }
  /** This spell is banished instead of trashed as it finishes resolving. */
  | { op: 'banishSpell' }
  /** Units you play this turn enter ready (Confront); n limits how many (Sun Disc: 1). */
  | { op: 'unitsEnterReadyThisTurn'; n?: number }
  /** Put bound trash-card choices onto the board as units (free play). */
  | { op: 'playUnitsFromTrash'; bind: string; exhausted?: boolean }
  /** Play this card (from the trash it just reached) onto the board. */
  | { op: 'playSelfFromTrash' }
  /** Simple replacement watcher on a unit, this turn, once. */
  | { op: 'watch'; target: UnitRef; kind: 'preventDeathHeal' | 'killOnDamage' }
  /** Recycle bound hand cards (of `who`) to the bottom of their deck. */
  | { op: 'recycleFromHand'; bind: string; who: Who }
  /** Discard the bound hand cards (of `who`). */
  | { op: 'discardBound'; bind: string; who: Who }
  /** This card moves from the trash to hand / deck bottom (trash-zone triggers). */
  | { op: 'selfFromTrash'; to: 'hand' | 'deckBottom' }
  /** Take control of units (and recall them). */
  | { op: 'takeControl'; target: UnitRef; recall?: boolean }
  /** Return your Chosen Champion from the trash to its (empty) zone. */
  | { op: 'championFromTrashToZone' }
  /** Reveal + recycle the top rune; bind its domain name as a string var. */
  | { op: 'revealTopRune'; bind: string }
  /** Attach this gear source to the bound unit (Equip resolution). */
  | { op: 'attachSelfTo'; bind: string }
  /** Attach the bound friendly gear to this unit (Weaponmaster). */
  | { op: 'attachBoundToSelf'; bind: string }
  | { op: 'playToken'; token: TokenId; n?: Amount; where: 'base' | 'here'; who?: Who; exhausted?: boolean }
  // Control flow
  | { op: 'if'; cond: Cond; then: Op[]; else?: Op[] }
  | { op: 'forEach'; over: UnitFilter; bind: string; ops: Op[] }
  | { op: 'mode'; n: number; options: { label: string; ops: Op[] }[] }
  // Escape hatch
  | { op: 'custom'; id: string }

export type TokenId = string // key into src/data/tokens.ts

// ---------------------------------------------------------------- abilities

export type Trigger =
  | { on: 'play' } // when you play me
  | { on: 'attack' }
  | { on: 'defend' }
  | { on: 'deathknell' }
  | { on: 'move' } // when I move
  | { on: 'discardedSelf' } // when I am discarded
  | { on: 'conquer' } // when you conquer (any battlefield)
  | { on: 'hold' }
  | { on: 'conquerHere' } // battlefield scripts: when you conquer/hold/defend HERE
  | { on: 'holdHere' }
  | { on: 'defendHere' }
  | { on: 'startOfTurn' } // your turn only
  | { on: 'endOfTurn' }
  | { on: 'unitDies'; filter: UnitFilter }
  /** When the controller plays another card matching the filter. */
  | { on: 'playCard'; filter?: { type?: ('Unit' | 'Spell' | 'Gear')[]; minEnergy?: number } }
  | { on: 'youStun' } // when you stun one or more enemy units
  | { on: 'youBuff' } // when you buff a friendly unit
  | { on: 'youDiscard' } // when you discard one or more cards
  | { on: 'youRecycle' } // when you recycle one or more cards to your Main Deck
  | { on: 'youPlayFromHidden' } // when you play a card from Hidden
  | { on: 'moveFromHere' } // battlefield scripts: a unit moved away from here

export type Ability =
  | {
      kind: 'triggered'
      when: Trigger
      /** Dependent-keyword gate (Level N → { xpAtLeast: N }). */
      requires?: Cond
      /** "You may …" — a yes/no prompt precedes execution. */
      optional?: boolean
      /** "The first time … each turn". */
      oncePerTurn?: boolean
      /** Zone the trigger listens from (default board; 'trash' for SMDR-style). */
      zone?: 'board' | 'trash'
      /** Targets chosen when the trigger is finalized onto the chain. */
      targets?: NamedTarget[]
      ops: Op[]
    }
  | {
      kind: 'activated'
      cost: Cost
      /** Timing permission (default: your turn, Neutral Open). */
      timing?: 'action' | 'reaction'
      oncePerTurn?: boolean
      restriction?: Cond
      targets?: NamedTarget[]
      ops: Op[]
    }
  | {
      kind: 'passive'
      while?: Cond
      effect: Passive
    }

export type Passive =
  | { kind: 'mightAura'; amount: number; targets: UnitFilter }
  | { kind: 'grantKeywords'; keywords: string[]; targets: UnitFilter }
  | { kind: 'selfMight'; amount: Amount; while?: Cond }
  /** Cost modifier: this card's own play cost, or an aura over your cards. */
  | {
      kind: 'costMod'
      appliesTo: 'self' | { cards: CardFilter }
      energyDelta: Amount
      while?: Cond
      minEnergy?: number
    }
  /** While on the board: your units enter play ready (Magma Wurm). */
  | { kind: 'entryReady'; targets: 'yourUnits' }

// ---------------------------------------------------------------- scripts

export interface SpellScript {
  /** Targets chosen while finalizing the spell onto the chain. */
  targets?: NamedTarget[]
  ops: Op[]
  /** Repeat [Cost] (820): may pay to execute the whole effect a second time. */
  repeat?: Cost
}

export interface CardScript {
  /** Explicit no-effect marker (keywords may still exist on the card). */
  vanilla?: true
  /**
   * Intentionally not automated (banned card / bespoke mechanic): counts as
   * covered, resolves with the manual tools. Give the reason in a comment.
   */
  manual?: true
  /**
   * Printed keywords override. When set, replaces the [Bracket] text parse —
   * needed when brackets appear inside conditional text ("I have [Assault]").
   */
  keywords?: string[]
  /** "I enter ready" — unconditionally or while the condition holds. */
  entersReady?: true | Cond
  /** Gear: "This enters exhausted." */
  entersExhausted?: true
  /** Alternate unit destinations: open battlefield (no units), occupied enemy
   *  battlefield, or any battlefield where you control units (Ambush, 822). */
  playTo?: 'openBattlefield' | 'enemyBattlefield' | 'whereYouControlUnits'
  /** "You may play me from your trash" (normal costs; Flow approximation). */
  playFromTrash?: true
  /** Flow (829): the card is banished instead of trashed when it dies. */
  banishOnDeath?: true
  /** Empower [Cost] (827): "[Cost]: Empower this. Play only if not Empowered." */
  empower?: { cost: Cost }
  /** Equipment: "Equip [Cost]" — attach to a friendly unit (818).
   *  bonusMight = the printed Might Bonus the attached unit gains (137). */
  equip?: { cost: Cost; bonusMight?: number }
  /** Quick-Draw (819): Reaction timing + auto-attach on play (set equip too). */
  quickDraw?: true
  /** Spell resolution program (Spell cards only). */
  spell?: SpellScript
  /** Unit/Gear/Battlefield/Legend abilities. */
  abilities?: Ability[]
  /** Battlefield: ops run when a player scores it (conquer or hold). */
  onScore?: { targets?: NamedTarget[]; ops: Op[] }
}
