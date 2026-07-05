// Reads the live game state pushed by the app (.coach-state.json) and prints a
// readable board summary from the local player's viewpoint. Run: node scripts/coach.mjs
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cards = JSON.parse(readFileSync(resolve(root, 'src/data/cards.json'), 'utf8'))
const byId = new Map(cards.map((c) => [c.id, c]))
const name = (id) => byId.get(id)?.name ?? id
const cost = (id) => {
  const c = byId.get(id)
  if (!c) return '?'
  return `${c.energy ?? '-'}${c.power ? '+' + c.power + 'P' : ''}`
}

let raw
try {
  raw = JSON.parse(readFileSync(resolve(root, '.coach-state.json'), 'utf8'))
} catch {
  console.log('Aucun état reçu. Lance/joue une partie dans l’app (le pont pousse l’état à chaque coup).')
  process.exit(0)
}
const s = raw.state
if (!s || !Array.isArray(s.players) || s.players.length !== 2) {
  console.log('Pas de partie complète en cours (état vide ou partiel). Joue un coup dans l’app puis réessaie.')
  process.exit(0)
}
const me = raw.me ?? 0
const opp = me === 0 ? 1 : 0
const P = s.players
const meP = P[me]
const opP = P[opp]

const phase = s.winner !== null ? `TERMINÉ (gagnant: ${P[s.winner].name})` : s.phase
console.log(`# État — reçu ${raw.at ?? '?'} (mode ${raw.mode ?? '?'})`)
console.log(`Tour ${s.turn} · phase ${phase} · à ${P[s.turnPlayer].name}${s.turnPlayer === me ? ' (TOI)' : ''}`)
console.log(`Score — TOI ${meP.points}/8  |  ${opP.name} ${opP.points}/8`)
if (s.showdown) console.log(`⚔️ Showdown/combat en cours à ${name(s.battlefields[s.showdown.battlefield].cardId)} · focus ${P[s.showdown.focus].name}`)
if (s.chain?.length) console.log(`🔗 Chaîne: ${s.chain.map((i) => i.label).join(' → ')}`)
console.log()

const unitStr = (u) => {
  const c = byId.get(u.cardId)
  const might = (c?.might ?? 0) + (u.buffed ? 1 : 0) + (u.tempMight ?? 0) + (u.combatRole === 'attacker' ? 0 : 0)
  const flags = [
    u.ready ? 'prête' : 'engagée',
    u.damage ? `${u.damage}dmg` : null,
    u.buffed ? 'buff' : null,
    u.stunned ? 'stun' : null,
    u.combatRole,
    u.isChampion ? '⭐champion' : null,
  ].filter(Boolean)
  return `${name(u.cardId)} [${might}⚔ ${flags.join(',')}]`
}

const unitsAt = (loc, who) => s.units.filter((u) => u.location === loc && u.controller === who)

console.log('## Champs de bataille')
s.battlefields.forEach((bf, ix) => {
  const ctrl = bf.controller === null ? 'neutre' : bf.controller === me ? 'TOI' : opP.name
  console.log(`- [${ix}] ${name(bf.cardId)} — contrôlé: ${ctrl}${bf.scoredBy?.[me] ? ' (déjà marqué par toi ce tour)' : ''}`)
  console.log(`    texte: ${(byId.get(bf.cardId)?.text ?? '').replace(/\n/g, ' ')}`)
  const en = unitsAt(ix, opp)
  const mi = unitsAt(ix, me)
  console.log(`    ${opP.name}: ${en.length ? en.map(unitStr).join(' | ') : '—'}`)
  console.log(`    TOI:  ${mi.length ? mi.map(unitStr).join(' | ') : '—'}`)
})
console.log()

console.log('## Toi')
const myBase = unitsAt('base', me)
console.log(`Base: ${myBase.length ? myBase.map(unitStr).join(' | ') : '—'}`)
const readyRunes = meP.runes.filter((r) => r.ready)
const runeDomains = {}
for (const r of meP.runes) {
  const d = byId.get(r.cardId)?.domains?.[0] ?? '?'
  runeDomains[d] = (runeDomains[d] ?? 0) + 1
}
console.log(`Runes: ${meP.runes.length} en jeu (${readyRunes.length} prêtes) — ${Object.entries(runeDomains).map(([d, n]) => `${n} ${d}`).join(', ')} · ${meP.runeDeck.length} en réserve`)
console.log(`Réserve flottante: ⚡${meP.pool.energy} ${Object.entries(meP.pool.power).filter(([, n]) => n > 0).map(([d, n]) => `${n}${d}`).join(' ')}`)
console.log(`Main (${meP.hand.length}): ${meP.hand.map((id) => `${name(id)} (${cost(id)})`).join(' · ')}`)
console.log(`Deck: ${meP.deck.length} · Défausse: ${meP.trash.length}${meP.championInZone ? ` · Champion dispo: ${name(meP.championId)}` : ''}`)
console.log()

console.log(`## ${opP.name}`)
console.log(`Base: ${unitsAt('base', opp).map(unitStr).join(' | ') || '—'}`)
console.log(`Main: ${opP.hand.length} cartes · Deck: ${opP.deck.length} · Runes: ${opP.runes.length}`)
