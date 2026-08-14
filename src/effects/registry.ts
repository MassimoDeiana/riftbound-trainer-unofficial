// Card-script registry: cardId → CardScript.
// Promos (OPP/PR/JDG…) share the script of the same-named card automatically:
// lookup falls back to a normalized name+text key.
import { allCards as cards, type CardDef } from '../data/cards'
import type { CardScript } from './ir'
import { OGN_SCRIPTS } from './sets/ogn'
import { OGS_SCRIPTS } from './sets/ogs'
import { SFD_SCRIPTS } from './sets/sfd'
import { UNL_SCRIPTS } from './sets/unl'
import { BATTLEFIELD_SCRIPTS } from './sets/battlefields'
import { LEGEND_SCRIPTS } from './sets/legends'
import { TOKEN_SCRIPTS } from './sets/tokens'

const byId = new Map<string, CardScript>()
const tables: Record<string, CardScript>[] = [
  OGN_SCRIPTS,
  OGS_SCRIPTS,
  SFD_SCRIPTS,
  UNL_SCRIPTS,
  BATTLEFIELD_SCRIPTS,
  LEGEND_SCRIPTS,
  TOKEN_SCRIPTS,
]
for (const table of tables) {
  for (const [id, script] of Object.entries(table)) byId.set(id.toLowerCase(), script)
}

/** Normalized identity key so reprints share one script. Parenthetical
 *  variant suffixes — "(Metal)", "(Starter)", "(Launch Exclusive)" — are
 *  stripped so promo printings inherit the base card's script. */
function textKey(c: CardDef): string {
  const name = c.name.replace(/\s*\([^)]*\)\s*$/, '')
  return `${name}::${(c.text ?? '').replace(/\s+/g, ' ').trim()}`.toLowerCase()
}

const byTextKey = new Map<string, CardScript>()
for (const c of cards) {
  const script = byId.get(c.id.toLowerCase())
  if (script && !byTextKey.has(textKey(c))) byTextKey.set(textKey(c), script)
}

const defById = new Map<string, CardDef>()
for (const c of cards) defById.set(c.id.toLowerCase(), c)

/** The script for a card, following reprints; null when not scripted yet. */
export function scriptFor(cardId: string): CardScript | null {
  const id = cardId.toLowerCase()
  const direct = byId.get(id)
  if (direct) return direct
  const def = defById.get(id)
  if (!def) return null
  return byTextKey.get(textKey(def)) ?? null
}

/** True when the card's effects are fully automated (or explicitly vanilla). */
export function isScripted(cardId: string): boolean {
  return scriptFor(cardId) !== null
}

/** Coverage report used by scripts/effects-coverage.mjs and tests. */
export function coverage(): { total: number; scripted: number; missing: string[] } {
  const missing: string[] = []
  let scripted = 0
  for (const c of cards) {
    if (c.type === 'Rune') {
      scripted++
      continue
    }
    if (scriptFor(c.id)) scripted++
    else missing.push(c.id)
  }
  return { total: cards.length, scripted, missing }
}
