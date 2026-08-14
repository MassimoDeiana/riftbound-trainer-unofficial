// Effect-script coverage report: which cards are automated vs still manual.
// Usage: node scripts/effects-coverage.mjs [--gate SET[,SET…]]
//   --gate OGN,OGS  → exit 1 if any card of those sets lacks a script.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Run the coverage query through the real registry via vitest's node loader:
// simplest reliable path is a tiny tsx-less eval through vite-node.
const out = execSync('npx vite-node --root . scripts/effects-coverage-run.ts', {
  cwd: root,
  encoding: 'utf8',
})
const report = JSON.parse(out.trim().split('\n').pop())

const cards = JSON.parse(readFileSync(resolve(root, 'src/data/cards.json'), 'utf8'))
const bySet = {}
for (const c of cards) {
  if (c.type === 'Rune') continue
  const set = c.set
  bySet[set] ??= { total: 0, missing: 0 }
  bySet[set].total++
  if (report.missing.includes(c.id)) bySet[set].missing++
}

console.log('Couverture des effets par set :')
for (const [set, { total, missing }] of Object.entries(bySet).sort()) {
  const done = total - missing
  console.log(`  ${set.padEnd(4)} ${String(done).padStart(4)}/${total}  (${((done / total) * 100).toFixed(1)}%)`)
}
console.log(`  TOTAL ${report.scripted}/${report.total}`)

const gateArg = process.argv.find((a) => a.startsWith('--gate'))
if (gateArg) {
  const sets = (gateArg.split('=')[1] ?? process.argv[process.argv.indexOf(gateArg) + 1] ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  const failing = report.missing.filter((id) => sets.includes(id.split('-')[0].toUpperCase()))
  if (failing.length > 0) {
    console.error(`\n❌ Gate ${sets.join(',')} : ${failing.length} carte(s) non scriptée(s) :`)
    for (const id of failing.slice(0, 40)) console.error('   ' + id)
    process.exit(1)
  }
  console.log(`\n✅ Gate ${sets.join(',')} : toutes les cartes sont scriptées.`)
}
