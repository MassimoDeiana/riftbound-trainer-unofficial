import rawCards from './cards.json'

export type CardType = 'Unit' | 'Spell' | 'Gear' | 'Rune' | 'Legend' | 'Battlefield'
export type Domain = 'Fury' | 'Calm' | 'Mind' | 'Body' | 'Chaos' | 'Order'

export interface CardDef {
  id: string // riftbound id, e.g. "ogn-123-298"
  name: string
  num: number
  energy: number | null
  might: number | null
  power: number | null
  type: CardType
  supertype: string | null
  rarity: string | null
  domains: Domain[]
  text: string
  flavour: string | null
  set: string
  setLabel: string
  image: string | null
  tags: string[]
}

export const allCards = rawCards as CardDef[]

export const cardsById = new Map<string, CardDef>(allCards.map((c) => [c.id, c]))

export const DOMAINS: Domain[] = ['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order']

export const DOMAIN_COLORS: Record<Domain, string> = {
  Fury: '#e05252',
  Calm: '#4fae62',
  Mind: '#5a9fd4',
  Body: '#d98e3b',
  Chaos: '#a066c9',
  Order: '#d4b64f',
}

export const SETS = [...new Set(allCards.map((c) => c.set))].map((id) => ({
  id,
  label: allCards.find((c) => c.set === id)!.setLabel,
}))

/** Replace :rb_*: icon codes with readable glyphs for display. */
export function textify(text: string): string {
  return text
    .replace(/:rb_energy_(\d+|x):/gi, '⚡$1')
    .replace(/:rb_might:/g, '⚔️')
    .replace(/:rb_exhaust:/g, '⤵️')
    .replace(/:rb_rune_rainbow:/g, '◈')
    .replace(/:rb_fury:/g, '🔴')
    .replace(/:rb_calm:/g, '🟢')
    .replace(/:rb_mind:/g, '🔵')
    .replace(/:rb_body:/g, '🟠')
    .replace(/:rb_chaos:/g, '🟣')
    .replace(/:rb_order:/g, '🟡')
    .replace(/:rb_[a-z_0-9]+:/g, '◆')
}

export function keywordsOf(card: CardDef): string[] {
  return [...card.text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1])
}

/** Loose text search over name, text and tags. */
export function searchCards(query: string, cards: CardDef[] = allCards): CardDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return cards
  return cards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.text.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
  )
}
