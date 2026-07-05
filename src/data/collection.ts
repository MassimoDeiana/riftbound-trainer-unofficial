import { allCards, type CardDef } from './cards'

/**
 * Owned-card collection, imported from a riftbound.gg CSV export (or any CSV
 * with name/set/number/quantity columns). Stored in localStorage.
 */
export type Collection = Record<string, number> // card id -> quantity owned

const LS_KEY = 'rb.collection'

export function loadCollection(): Collection {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveCollection(col: Collection) {
  localStorage.setItem(LS_KEY, JSON.stringify(col))
}

/** Minimal CSV parser handling quoted fields and commas/semicolons. */
function parseCsv(text: string): string[][] {
  const sep = text.split('\n')[0].includes(';') ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') inQuotes = false
      else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === sep) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows
}

function findCol(header: string[], ...names: string[]): number {
  const h = header.map((c) => c.trim().toLowerCase())
  for (const n of names) {
    const i = h.findIndex((c) => c === n || c.includes(n))
    if (i >= 0) return i
  }
  return -1
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

const byName = new Map<string, CardDef>()
const bySetNum = new Map<string, CardDef>()
for (const c of allCards) {
  if (!byName.has(norm(c.name))) byName.set(norm(c.name), c)
  bySetNum.set(`${c.set.toLowerCase()}:${c.num}`, c)
}

export interface ImportResult {
  collection: Collection
  matched: number
  unmatched: string[]
}

/**
 * Tolerant import: matches rows by card id ("OGN-001"), by set + collector
 * number, or by (normalized) card name. Quantities accumulate; separate
 * Normal/Foil count columns (riftbound.gg export) are summed.
 */
export function importCollectionCsv(text: string, into: Collection = {}): ImportResult {
  const rows = parseCsv(text)
  if (rows.length < 2) return { collection: into, matched: 0, unmatched: [] }
  const header = rows[0]
  const iCardId = findCol(header, 'cardid', 'card id', 'card code', 'code')
  const iName = findCol(header, 'card name', 'name', 'card', 'title')
  const iSet = findCol(header, 'set code', 'set id', 'set', 'expansion')
  const iNum = findCol(header, 'collector number', 'card number', 'number', 'collector', '#')
  const iNormal = findCol(header, 'normal', 'regular')
  const iFoil = findCol(header, 'foil')
  const iQty = findCol(header, 'quantity', 'count', 'qty', 'amount', 'owned')

  let matched = 0
  const unmatched: string[] = []
  for (const row of rows.slice(1)) {
    const name = iName >= 0 ? row[iName]?.trim() : ''
    let qty: number
    if (iNormal >= 0 || iFoil >= 0) {
      // riftbound.gg format: separate Normal / Foil quantity columns
      qty = (iNormal >= 0 ? parseInt(row[iNormal], 10) || 0 : 0) + (iFoil >= 0 ? parseInt(row[iFoil], 10) || 0 : 0)
      if (qty === 0) continue // row for a card that isn't owned
    } else {
      qty = iQty >= 0 ? parseInt(row[iQty], 10) || 1 : 1
    }
    let card: CardDef | undefined
    if (iCardId >= 0) {
      // "OGN-001" (possibly with a variant suffix like "OGN-060a")
      const m = (row[iCardId] ?? '').trim().match(/^([a-z]+)[-_ ]?0*(\d+)/i)
      if (m) card = bySetNum.get(`${m[1].toLowerCase()}:${parseInt(m[2], 10)}`)
    }
    if (!card && iSet >= 0 && iNum >= 0) {
      const set = (row[iSet] ?? '').trim().toLowerCase()
      const num = parseInt(row[iNum], 10)
      // collector numbers may come as "123/298" or "OGN-123"
      const numAlt = parseInt((row[iNum] ?? '').replace(/^[a-z]+-/i, ''), 10)
      card = bySetNum.get(`${set}:${num}`) ?? bySetNum.get(`${set}:${numAlt}`)
    }
    if (!card && name) card = byName.get(norm(name))
    if (card) {
      into[card.id] = (into[card.id] ?? 0) + qty
      matched++
    } else if (name || row.some((c) => c.trim())) unmatched.push(name || row.join(','))
  }
  return { collection: into, matched, unmatched }
}
