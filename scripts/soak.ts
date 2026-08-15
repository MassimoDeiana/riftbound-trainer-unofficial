// Soak bot-vs-bot : N parties seedées avec des decks aléatoires légaux tirés de
// TOUS les sets. Vérifie : zéro throw du reducer, zéro blocage des bots,
// terminaison sous le cap d'actions. Usage : npx vite-node scripts/soak.ts [N]
import { allCards } from '../src/data/cards'
import { validateDeck, type Deck, MAX_COPIES, RUNE_DECK_SIZE } from '../src/data/decks'
import { applyAction } from '../src/engine/reducer'
import { createGame } from '../src/engine/setup'
import type { PlayerIx } from '../src/engine/types'
import { botAction } from '../src/ai/bot'

function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const legends = allCards.filter((c) => c.type === 'Legend')
const battlefields = allCards.filter((c) => c.type === 'Battlefield')
const runes = allCards.filter((c) => c.type === 'Rune')
const playable = allCards.filter(
  (c) =>
    (c.type === 'Unit' || c.type === 'Spell' || c.type === 'Gear') &&
    c.supertype !== 'Token' &&
    !c.id.startsWith('tok-')
)

function randomDeck(rng: () => number, name: string): Deck {
  for (;;) {
    const legend = legends[Math.floor(rng() * legends.length)]
    const domains = new Set(legend.domains)
    const tag = legend.tags[0]
    const pool = playable.filter((c) => c.domains.every((d) => domains.has(d)))
    const champions = pool.filter((c) => c.supertype === 'Champion' && tag && c.tags.includes(tag))
    if (!champions.length) continue
    const champion = champions[Math.floor(rng() * champions.length)]

    const main: Record<string, number> = { [champion.id]: 1 }
    let total = 1
    let guard = 0
    while (total < 40 && guard++ < 5000) {
      const c = pool[Math.floor(rng() * pool.length)]
      const cur = main[c.id] ?? 0
      if (cur >= MAX_COPIES) continue
      // [Unique] : max 1 exemplaire
      if (cur >= 1 && /\[Unique\]/i.test(c.text)) continue
      main[c.id] = cur + 1
      total++
    }
    if (total < 40) continue

    const runePool = runes.filter((c) => c.domains.every((d) => domains.has(d)))
    if (!runePool.length) continue
    const runeMap: Record<string, number> = {}
    for (let i = 0; i < RUNE_DECK_SIZE; i++) {
      const r = runePool[Math.floor(rng() * runePool.length)]
      runeMap[r.id] = (runeMap[r.id] ?? 0) + 1
    }

    const bfs: string[] = []
    while (bfs.length < 3) {
      const b = battlefields[Math.floor(rng() * battlefields.length)]
      if (!bfs.includes(b.id)) bfs.push(b.id)
    }

    const deck: Deck = {
      id: `soak-${name}`,
      name: `Soak ${name} (${legend.name})`,
      legendId: legend.id,
      championId: champion.id,
      battlefieldIds: bfs,
      runes: runeMap,
      main,
    }
    const problems = validateDeck(deck)
    if (problems.length) continue
    return deck
  }
}

const N = Number(process.argv[2] ?? 40)
const CAP = 8000
let failures = 0
const t0 = Date.now()

function runGame(seed: number, deckA: Deck, deckB: Deck) {
  let s = createGame({ seed, decks: [deckA, deckB], names: ['Bot A', 'Bot B'], first: 0 })
  let n = 0
  while (s.winner === null && n < CAP) {
    const action = botAction(s, 0 as PlayerIx) ?? botAction(s, 1 as PlayerIx)
    if (!action) throw new Error(`bots bloqués (tour ${s.turn}, phase ${s.phase}, pending=${JSON.stringify(s.pending?.spec?.kind ?? null)})`)
    s = applyAction(s, action)
    n++
  }
  if (s.winner === null) throw new Error(`cap d'actions atteint (${CAP}) au tour ${s.turn}`)
  return { s, n }
}

for (let g = 0; g < N; g++) {
  const seed = 90000 + g * 7
  const rng = makeRng(seed)
  const deckA = randomDeck(rng, `A${g}`)
  const deckB = randomDeck(rng, `B${g}`)
  try {
    const { s, n } = runGame(seed, deckA, deckB)
    // Determinism: the same seed must replay to the exact same final state.
    const again = runGame(seed, deckA, deckB)
    if (JSON.stringify(s) !== JSON.stringify(again.s))
      throw new Error('non-déterminisme : deux exécutions de la même seed divergent')
    console.log(
      `game ${g} seed=${seed} OK  winner=${s.winner} turns=${s.turn} actions=${n}  [${deckA.name} vs ${deckB.name}]`
    )
  } catch (e) {
    failures++
    console.error(`game ${g} seed=${seed} FAIL  [${deckA.name} vs ${deckB.name}]`)
    console.error('  ', (e as Error).message)
  }
}
console.log(`\n${N - failures}/${N} parties OK en ${((Date.now() - t0) / 1000).toFixed(1)}s`)
process.exit(failures ? 1 : 0)
