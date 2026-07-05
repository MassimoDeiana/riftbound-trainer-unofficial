// Generates src/data/starterDecks.ts from the official preconstructed
// decklists (Proving Grounds + Origins Champion decks; source: riftmana.com
// deck-code exports). Run: node scripts/gen-starters.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cards = JSON.parse(readFileSync(resolve(root, 'src/data/cards.json'), 'utf8'))

// riftbound ids are `${set}-${num3}-${setTotal}`
const bySetNum = new Map()
for (const c of cards) {
  const key = `${c.set}-${String(c.num).padStart(3, '0')}`
  if (!bySetNum.has(key)) bySetNum.set(key, c)
}
const byId = new Map(cards.map((c) => [c.id, c]))
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function resolveCode(code) {
  const c = bySetNum.get(code)
  if (!c) throw new Error(`Unknown card code ${code}`)
  return c
}

// Deck-code lists, straight from the published exports. The generator
// classifies each card by type (Legend / Battlefield / Rune / main deck).
// The Proving Grounds precons ship a single battlefield: it is listed 3x so
// the 1v1 registration rule (3 battlefields) is satisfied.
const LISTS = [
  {
    id: 'starter-annie',
    name: 'Starter — Annie (Fury/Chaos)',
    champion: 'Annie Stubborn',
    codes:
      '1xOGS-017 3xOGN-296 3xOGN-169 3xOGN-170 3xOGN-171 3xOGN-185 3xOGS-003 2xOGN-013 2xOGS-011 3xOGN-176 3xOGN-005 2xOGS-010 3xOGN-191 2xOGS-001 3xOGN-174 3xOGS-002 2xOGS-018 6xOGN-007 6xOGN-166',
  },
  {
    id: 'starter-lux',
    name: 'Starter — Lux (Mind/Order)',
    champion: 'Lux Crownguard',
    codes:
      '1xOGS-021 3xOGN-288 3xOGN-095 3xOGN-103 3xOGN-210 2xOGN-084 3xOGN-087 3xOGN-206 2xOGS-014 3xOGN-219 3xOGN-085 2xOGS-006 3xOGS-016 3xOGN-105 3xOGS-012 2xOGN-088 2xOGS-022 6xOGN-089 6xOGN-214',
  },
  {
    id: 'starter-garen',
    name: 'Starter — Garen (Body/Order)',
    champion: 'Garen Rugged',
    codes:
      '1xOGS-023 3xOGN-294 3xOGN-210 3xOGN-129 3xOGN-130 3xOGN-132 3xOGN-211 3xOGN-222 3xOGN-206 3xOGN-219 2xOGN-131 2xOGN-215 2xOGS-024 2xOGS-007 2xOGS-013 3xOGS-016 3xOGS-015 6xOGN-126 6xOGN-214',
  },
  {
    id: 'starter-yi',
    name: 'Starter — Master Yi (Calm/Body)',
    champion: 'Master Yi Meditative',
    codes:
      '1xOGS-019 3xOGN-279 3xOGN-046 3xOGN-048 3xOGN-052 3xOGN-127 3xOGN-134 2xOGN-129 3xOGN-055 2xOGS-020 3xOGN-049 2xOGS-004 3xOGS-005 3xOGS-008 3xOGN-137 2xOGS-009 2xOGN-142 6xOGN-042 6xOGN-126',
  },
  {
    id: 'starter-jinx',
    name: 'Champion Deck — Jinx (Fury/Chaos)',
    champion: 'Jinx Demolitionist',
    codes:
      '1xOGN-251 1xOGN-289 1xOGN-298 1xOGN-285 3xOGN-169 3xOGN-168 2xOGN-008 3xOGN-003 3xOGN-185 3xOGN-182 1xOGN-036 1xOGN-030 3xOGN-006 2xOGN-165 2xOGN-024 2xOGN-180 3xOGN-019 2xOGN-001 2xOGN-178 3xOGN-002 1xOGN-011 1xOGN-195 6xOGN-007 6xOGN-166',
  },
  {
    id: 'starter-leesin',
    name: 'Champion Deck — Lee Sin (Calm/Body)',
    champion: 'Lee Sin Centered',
    codes:
      '1xOGN-257 1xOGN-282 1xOGN-289 1xOGN-280 2xOGN-043 3xOGN-052 3xOGN-136 3xOGN-128 3xOGN-058 1xOGN-060 3xOGN-055 3xOGN-132 2xOGN-053 2xOGN-135 1xOGN-152 3xOGN-147 3xOGN-065 1xOGN-151 2xOGN-125 1xOGN-157 2xOGN-137 2xOGN-142 6xOGN-042 6xOGN-126',
  },
  {
    id: 'starter-viktor',
    name: 'Champion Deck — Viktor (Mind/Order)',
    champion: 'Viktor Leader',
    codes:
      '1xOGN-265 1xOGN-294 1xOGN-293 1xOGN-275 2xOGN-090 2xOGN-095 3xOGN-209 2xOGN-213 2xOGN-093 3xOGN-216 2xOGN-101 3xOGN-103 2xOGN-206 2xOGN-094 3xOGN-084 3xOGN-222 1xOGN-111 2xOGN-083 3xOGN-208 1xOGN-246 2xOGN-086 1xOGN-118 1xOGN-233 6xOGN-089 6xOGN-214',
  },
  {
    // Massimo's collection-built deck (buff tempo) — see docs/deck-leesin-collection.txt
    id: 'custom-leesin-massimo',
    name: 'Mon deck — Lee Sin (collection)',
    champion: 'Lee Sin Centered',
    codes:
      '1xOGN-257 1xOGN-282 1xOGN-289 1xOGN-283 1xOGN-151 3xOGN-052 3xOGN-136 2xOGN-139 3xOGN-054 3xOGN-132 2xOGN-055 1xOGN-150 2xOGN-061 1xOGN-141 1xOGN-065 1xOGN-049 1xOGN-157 3xOGN-046 2xOGN-128 2xOGN-129 2xOGN-127 2xOGN-050 1xOGN-058 1xOGN-154 1xOGN-043 1xOGN-152 1xOGN-063 6xOGN-042 6xOGN-126',
  },
]

const decks = []
for (const L of LISTS) {
  let legendId = null
  const battlefieldIds = []
  const main = {}
  const runes = {}
  for (const part of L.codes.split(/\s+/)) {
    const m = part.match(/^(\d+)x(.+)$/)
    if (!m) throw new Error(`Bad token ${part}`)
    const n = Number(m[1])
    const c = resolveCode(m[2])
    if (c.type === 'Legend') {
      if (legendId) throw new Error(`${L.id}: two legends`)
      legendId = c.id
    } else if (c.type === 'Battlefield') {
      for (let i = 0; i < n; i++) battlefieldIds.push(c.id)
    } else if (c.type === 'Rune') {
      runes[c.id] = (runes[c.id] ?? 0) + n
    } else {
      main[c.id] = (main[c.id] ?? 0) + n
    }
  }
  const championId = Object.keys(main).find((id) => norm(byId.get(id).name) === norm(L.champion))
  if (!championId) throw new Error(`${L.id}: champion not found: ${L.champion}`)

  const mainTotal = Object.values(main).reduce((a, b) => a + b, 0)
  const runeTotal = Object.values(runes).reduce((a, b) => a + b, 0)
  if (!legendId) throw new Error(`${L.id}: no legend`)
  if (mainTotal !== 40) throw new Error(`${L.id}: main deck has ${mainTotal} cards`)
  if (runeTotal !== 12) throw new Error(`${L.id}: ${runeTotal} runes`)
  if (battlefieldIds.length !== 3) throw new Error(`${L.id}: ${battlefieldIds.length} battlefields`)

  console.log(
    `${L.name}: légende ${byId.get(legendId).name}, champion ${byId.get(championId).name}, CdB [${battlefieldIds.map((id) => byId.get(id).name).join(', ')}]`
  )
  decks.push({ id: L.id, name: L.name, legendId, championId, battlefieldIds, runes, main })
}

const out = `// Generated by scripts/gen-starters.mjs — official preconstructed decklists
// (Proving Grounds + Origins Champion decks). Do not edit by hand.
import type { Deck } from './decks'

export const STARTER_DECKS: Deck[] = ${JSON.stringify(decks, null, 2)}
`
writeFileSync(resolve(root, 'src/data/starterDecks.ts'), out)
console.log(`\nwrote ${decks.length} decks -> src/data/starterDecks.ts`)
