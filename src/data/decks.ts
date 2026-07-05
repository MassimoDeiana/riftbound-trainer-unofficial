import { cardsById, type CardDef, type Domain } from './cards'

export interface Deck {
  id: string
  name: string
  legendId: string | null
  /** Chosen champion unit (must match the legend's champion tag). */
  championId: string | null
  battlefieldIds: string[]
  /** Rune deck: card id -> count. */
  runes: Record<string, number>
  /** Main deck: card id -> count. */
  main: Record<string, number>
}

// Deckbuilding constants — confirmed against docs/rules-spec.md
export const MAIN_DECK_SIZE = 40 // minimum, Chosen Champion included
export const RUNE_DECK_SIZE = 12 // exactly
export const BATTLEFIELDS_PER_DECK = 3 // registered; 1v1 uses 1 random pick per player
export const MAX_COPIES = 3

const LS_KEY = 'rb.decks'

export function loadDecks(): Deck[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Add the official starter decks (skipping any already present). */
export function addStarterDecks(starters: Deck[]): Deck[] {
  const decks = loadDecks()
  const have = new Set(decks.map((d) => d.id))
  for (const s of starters) if (!have.has(s.id)) decks.push(structuredClone(s))
  saveDecks(decks)
  return decks
}

export function saveDecks(decks: Deck[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(decks))
}

export function newDeck(name: string): Deck {
  return {
    id: crypto.randomUUID(),
    name,
    legendId: null,
    championId: null,
    battlefieldIds: [],
    runes: {},
    main: {},
  }
}

export function mainDeckCount(deck: Deck): number {
  return Object.values(deck.main).reduce((a, b) => a + b, 0)
}

export function runeCount(deck: Deck): number {
  return Object.values(deck.runes).reduce((a, b) => a + b, 0)
}

export function deckDomains(deck: Deck): Domain[] {
  const legend = deck.legendId ? cardsById.get(deck.legendId) : null
  return legend?.domains ?? []
}

export interface DeckProblem {
  message: string
}

/** Validate a deck against construction rules; returns a list of problems (empty = legal). */
export function validateDeck(deck: Deck): DeckProblem[] {
  const problems: DeckProblem[] = []
  const legend = deck.legendId ? cardsById.get(deck.legendId) : null
  if (!legend) problems.push({ message: 'Il faut une Légende.' })

  const domains = new Set(deckDomains(deck))
  const mainTotal = mainDeckCount(deck)
  if (mainTotal < MAIN_DECK_SIZE)
    problems.push({ message: `Deck principal : ${mainTotal}/${MAIN_DECK_SIZE} cartes minimum.` })

  for (const [id, count] of Object.entries(deck.main)) {
    const card = cardsById.get(id)
    if (!card) continue
    if (count > MAX_COPIES)
      problems.push({ message: `${card.name} : max ${MAX_COPIES} exemplaires.` })
    if (legend && card.domains.some((d) => !domains.has(d)))
      problems.push({ message: `${card.name} n'est pas dans les domaines de la légende.` })
  }

  const runesTotal = runeCount(deck)
  if (runesTotal !== RUNE_DECK_SIZE)
    problems.push({ message: `Deck de runes : ${runesTotal}/${RUNE_DECK_SIZE} runes.` })
  if (legend) {
    for (const id of Object.keys(deck.runes)) {
      const rune = cardsById.get(id)
      if (rune && rune.domains.some((d) => !domains.has(d)))
        problems.push({ message: `${rune.name} n'est pas dans les domaines de la légende.` })
    }
  }

  if (deck.battlefieldIds.length !== BATTLEFIELDS_PER_DECK)
    problems.push({
      message: `Champs de bataille : ${deck.battlefieldIds.length}/${BATTLEFIELDS_PER_DECK}.`,
    })

  if (!deck.championId) problems.push({ message: 'Il faut choisir une unité Champion.' })
  else {
    const champ = cardsById.get(deck.championId)
    if (!deck.main[deck.championId])
      problems.push({ message: 'Le Champion choisi doit faire partie du deck principal.' })
    const legendTag = legend?.tags[0] // legend's champion name, e.g. "Jinx"
    if (champ && legendTag && !champ.tags.includes(legendTag))
      problems.push({ message: `Le champion doit être ${legendTag} (comme la légende).` })
  }

  return problems
}

export function cardsIn(map: Record<string, number>): { card: CardDef; count: number }[] {
  return Object.entries(map)
    .map(([id, count]) => ({ card: cardsById.get(id)!, count }))
    .filter((e) => e.card)
    .sort((a, b) => (a.card.energy ?? 0) - (b.card.energy ?? 0) || a.card.name.localeCompare(b.card.name))
}
