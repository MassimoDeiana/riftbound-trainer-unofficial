import type { Domain } from '../data/cards'
import { def, keywords, unitMight, unitsAt } from '../engine/cardinfo'
import { defaultAssignment } from '../engine/core'
import type { GameAction, GameState, PlayerIx } from '../engine/types'

/**
 * Heuristic solo-mode bot. Called after every state change; returns the next
 * action to take (one at a time), or null when it's waiting on the human.
 * It plays by the rules via the engine, but never scripts card text effects:
 * its triggers/spells resolve without effect.
 */
export function botAction(s: GameState, me: PlayerIx): GameAction | null {
  if (s.winner !== null) return null
  const my = s.players[me]
  const opp: PlayerIx = me === 0 ? 1 : 0

  // --- pending choice addressed to the bot: answer deterministically
  if (s.pending !== null) {
    if (s.pending.player !== me) return null
    const spec = s.pending.spec
    switch (spec.kind) {
      case 'assignDamage':
        return { t: 'choose', player: me, choice: { kind: 'assignDamage', assignments: defaultAssignment(s) } }
      case 'battlefield':
        return { t: 'choose', player: me, choice: { kind: 'battlefield', battlefield: spec.options[0] } }
      case 'vision':
        return { t: 'choose', player: me, choice: { kind: 'vision', recycle: false } }
      case 'unit': {
        // Greedy: prefer enemy units (targets are usually removal), stable order.
        const enemies = spec.legal.filter((uid) => s.units.find((u) => u.uid === uid)?.controller !== me)
        const ordered = [...enemies, ...spec.legal.filter((uid) => !enemies.includes(uid))]
        const n = spec.min > 0 ? spec.min : Math.min(1, spec.max)
        return { t: 'choose', player: me, choice: { kind: 'unit', uids: ordered.slice(0, n) } }
      }
      case 'card':
        return { t: 'choose', player: me, choice: { kind: 'card', indices: spec.legal.slice(0, spec.min) } }
      case 'mode':
        return { t: 'choose', player: me, choice: { kind: 'mode', picks: Array.from({ length: spec.n }, (_, i) => i) } }
      case 'yesNo':
        return { t: 'choose', player: me, choice: { kind: 'yesNo', yes: true } }
      case 'location':
        return { t: 'choose', player: me, choice: { kind: 'location', loc: spec.options[0] } }
    }
  }

  // --- mulligan: replace expensive cards (energy >= 5)
  if (s.phase === 'mulligan') {
    if (my.mulliganed) return null
    const cardIds = my.hand.filter((c) => (def(c).energy ?? 0) >= 5).slice(0, 2)
    return { t: 'mulligan', player: me, cardIds }
  }

  // --- chain: pass whenever it holds priority (resolution is automatic)
  if (s.chain.length > 0) {
    if (s.chainActive === me) return { t: 'pass', player: me }
    return null
  }

  // --- showdown: never responds
  if (s.showdown) {
    if (s.showdown.focus === me) return { t: 'pass', player: me }
    return null
  }

  if (s.turnPlayer !== me || s.phase !== 'action') return null

  // --- develop: play the biggest affordable unit/gear (units & gear only)
  const play = bestPlay(s, me)
  if (play) return play

  // --- take or contest battlefields
  const move = bestMove(s, me, opp)
  if (move) return move

  return { t: 'endTurn', player: me }
}

interface Candidate {
  cardId: string
  from: 'hand' | 'champion'
}

function bestPlay(s: GameState, me: PlayerIx): GameAction | null {
  const my = s.players[me]
  const candidates: Candidate[] = my.hand.map((cardId) => ({ cardId, from: 'hand' as const }))
  if (my.championInZone) candidates.push({ cardId: my.championId, from: 'champion' })

  const playable = candidates
    .filter(({ cardId }) => {
      const c = def(cardId)
      return (c.type === 'Unit' || c.type === 'Gear') && affordable(s, me, cardId)
    })
    // biggest first; stable tiebreak so successive ticks pick the same card
    .sort((a, b) => (def(b.cardId).energy ?? 0) - (def(a.cardId).energy ?? 0) || a.cardId.localeCompare(b.cardId))

  if (playable.length === 0) return null
  const target = playable[0]
  const card = def(target.cardId)
  const powerNeeded = Math.max(0, (card.power ?? 0) - poolPower(s, me, card.domains))
  if (powerNeeded > 0) {
    const rune = pickRecycleRune(s, me, card.domains)
    if (rune) return { t: 'recycleRune', player: me, runeUid: rune }
  } else if (my.pool.energy < (card.energy ?? 0)) {
    const ready = my.runes.find((r) => r.ready)
    if (ready) return { t: 'exhaustRune', player: me, runeUid: ready.uid }
  } else {
    return { t: 'playCard', player: me, cardId: target.cardId, from: target.from, location: 'base' }
  }
  return null
}

function poolPower(s: GameState, me: PlayerIx, domains: Domain[]): number {
  const pool = s.players[me].pool
  let n = pool.power.Universal ?? 0
  for (const d of domains) n += pool.power[d] ?? 0
  return n
}

/** Prefer recycling exhausted matching runes (they've already produced energy). */
function pickRecycleRune(s: GameState, me: PlayerIx, domains: Domain[]): number | null {
  const matching = s.players[me].runes.filter((r) => domains.includes(def(r.cardId).domains[0] as Domain))
  const exhausted = matching.find((r) => !r.ready)
  return (exhausted ?? matching[0])?.uid ?? null
}

/** Can this card be paid for with the current pool + remaining runes? */
function affordable(s: GameState, me: PlayerIx, cardId: string): boolean {
  const my = s.players[me]
  const card = def(cardId)
  const energyCost = card.energy ?? 0
  const powerCost = card.power ?? 0

  const powerNeeded = Math.max(0, powerCost - poolPower(s, me, card.domains))
  const matching = my.runes.filter((r) => card.domains.includes(def(r.cardId).domains[0] as Domain))
  if (matching.length < powerNeeded) return false

  // Recycle exhausted matching runes first; extra recycles eat into ready runes
  const exhaustedMatching = matching.filter((r) => !r.ready).length
  const readyUsedForPower = Math.max(0, powerNeeded - exhaustedMatching)
  const readyLeft = my.runes.filter((r) => r.ready).length - readyUsedForPower
  return my.pool.energy + readyLeft >= energyCost
}

function bestMove(s: GameState, me: PlayerIx, opp: PlayerIx): GameAction | null {
  const readyBase = s.units.filter(
    (u) => u.controller === me && u.kind === 'unit' && u.location === 'base' && u.ready
  )
  if (readyBase.length === 0) return null

  for (let bf = 0; bf < s.battlefields.length; bf++) {
    const mineHere = unitsAt(s, bf, me)
    if (mineHere.length > 0) continue // already present (combat handled elsewhere)
    const enemies = unitsAt(s, bf, opp)
    const controlled = s.battlefields[bf].controller === me
    if (enemies.length === 0) {
      if (!controlled) {
        // Take the empty battlefield with the weakest ready unit
        const weakest = [...readyBase].sort((a, b) => unitMight(a) - unitMight(b))[0]
        return { t: 'move', player: me, unitUids: [weakest.uid], to: bf }
      }
    } else {
      const myPower = readyBase.reduce((n, u) => n + unitMight(u) + keywords(u.cardId).assault, 0)
      const enemyPower = enemies.reduce((n, u) => n + unitMight(u) + keywords(u.cardId).shield, 0)
      if (myPower >= enemyPower + 2) {
        return { t: 'move', player: me, unitUids: readyBase.map((u) => u.uid), to: bf }
      }
    }
  }
  return null
}
