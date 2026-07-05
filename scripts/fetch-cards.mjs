// Downloads the full Riftbound card database from the Riftcodex community API
// into src/data/cards.json. Run: node scripts/fetch-cards.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://api.riftcodex.com'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/cards.json')

async function fetchPage(page) {
  const res = await fetch(`${API}/cards?size=100&page=${page}&sort=collector_number&dir=1`)
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`)
  return res.json()
}

const first = await fetchPage(1)
const pages = Math.ceil(first.total / 100)
console.log(`total cards: ${first.total}, pages: ${pages}`)
let items = [...first.items]
for (let p = 2; p <= pages; p++) {
  const { items: batch } = await fetchPage(p)
  items.push(...batch)
  process.stdout.write(`\rpage ${p}/${pages}`)
}
console.log()

// Skip cosmetic variants (same rules text as the base printing)
const playable = items.filter(
  (c) => !c.metadata?.alternate_art && !c.metadata?.signature && !c.metadata?.overnumbered
)

const slim = playable.map((c) => ({
  id: c.riftbound_id,
  name: c.name,
  num: c.collector_number,
  energy: c.attributes?.energy ?? null,
  might: c.attributes?.might ?? null,
  power: c.attributes?.power ?? null,
  type: c.classification?.type ?? null,
  supertype: c.classification?.supertype ?? null,
  rarity: c.classification?.rarity ?? null,
  domains: c.classification?.domain ?? [],
  text: c.text?.plain ?? '',
  flavour: c.text?.flavour ?? null,
  set: c.set?.set_id ?? null,
  setLabel: c.set?.label ?? null,
  image: c.media?.image_url ?? null,
  tags: c.tags ?? [],
}))

// Deduplicate by riftbound id (API can return reprints/duplicates)
const byId = new Map()
for (const c of slim) if (!byId.has(c.id)) byId.set(c.id, c)
const cards = [...byId.values()]

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(cards))
console.log(`wrote ${cards.length} playable cards -> ${OUT}`)
const types = {}
for (const c of cards) types[c.type] = (types[c.type] ?? 0) + 1
console.log('by type:', types)
const sets = {}
for (const c of cards) sets[c.set] = (sets[c.set] ?? 0) + 1
console.log('by set:', sets)
