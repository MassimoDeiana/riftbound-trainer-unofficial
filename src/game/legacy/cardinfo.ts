import { cardsById, keywordsOf, type CardDef, type Domain } from '../../data/cards'
import type { GameState, UnitEntity } from './types'

export function def(cardId: string): CardDef {
  const c = cardsById.get(cardId)
  if (!c) throw new Error(`Unknown card ${cardId}`)
  return c
}

export interface Keywords {
  action: boolean
  reaction: boolean
  accelerate: boolean
  assault: number
  shield: number
  tank: boolean
  ganking: boolean
  hidden: boolean
  legion: boolean
  deathknell: boolean
  temporary: boolean
  vision: boolean
  deflect: number
  /** Keywords the engine doesn't know (newer sets) — surfaced as reminders. */
  unknown: string[]
}

const KNOWN = [
  'action',
  'reaction',
  'accelerate',
  'assault',
  'shield',
  'tank',
  'ganking',
  'hidden',
  'legion',
  'deathknell',
  'temporary',
  'vision',
  'deflect',
]

const kwCache = new Map<string, Keywords>()

export function keywords(cardId: string): Keywords {
  let kw = kwCache.get(cardId)
  if (kw) return kw
  const card = def(cardId)
  const raw = keywordsOf(card)
  kw = {
    action: false,
    reaction: false,
    accelerate: false,
    assault: 0,
    shield: 0,
    tank: false,
    ganking: false,
    hidden: false,
    legion: false,
    deathknell: false,
    temporary: false,
    vision: false,
    deflect: 0,
    unknown: [],
  }
  for (const k of raw) {
    const m = k.match(/^([A-Za-z]+)\s*(\d+)?/)
    if (!m) continue
    const name = m[1].toLowerCase()
    const x = m[2] ? parseInt(m[2], 10) : 1
    switch (name) {
      case 'action':
        kw.action = true
        break
      case 'reaction':
        kw.reaction = true
        break
      case 'accelerate':
        kw.accelerate = true
        break
      case 'assault':
        kw.assault += x
        break
      case 'shield':
        kw.shield += x
        break
      case 'tank':
        kw.tank = true
        break
      case 'ganking':
        kw.ganking = true
        break
      case 'hidden':
        kw.hidden = true
        break
      case 'legion':
        kw.legion = true
        break
      case 'deathknell':
        kw.deathknell = true
        break
      case 'temporary':
        kw.temporary = true
        break
      case 'vision':
        kw.vision = true
        break
      case 'deflect':
        kw.deflect += x
        break
      default:
        if (!KNOWN.includes(name)) kw.unknown.push(k)
    }
  }
  kwCache.set(cardId, kw)
  return kw
}

/** Current Might of a unit, all modifiers applied (negative treated as 0). */
export function unitMight(u: UnitEntity): number {
  const kw = keywords(u.cardId)
  let might = def(u.cardId).might ?? 0
  if (u.buffed) might += 1
  might += u.tempMight
  if (u.combatRole === 'attacker') might += kw.assault
  if (u.combatRole === 'defender') might += kw.shield
  return Math.max(0, might)
}

/** Might this unit contributes to combat damage (stunned deal 0). */
export function combatMight(u: UnitEntity): number {
  return u.stunned ? 0 : unitMight(u)
}

export function unitsAt(state: GameState, location: 'base' | number, player?: number): UnitEntity[] {
  return state.units.filter(
    (u) =>
      u.location === location && u.kind === 'unit' && (player === undefined || u.controller === player)
  )
}

/** Does this unit's text carry a played-trigger the engine should surface? */
export function hasPlayedTrigger(card: CardDef): boolean {
  return /when (i'?m| i am|you play me|this is played)/i.test(card.text) || keywords(card.id).vision
}

export function domainsOf(cardId: string): Domain[] {
  return def(cardId).domains
}
