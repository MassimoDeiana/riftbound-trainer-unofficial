// Animation pacing layer ("lecteur d'actions").
//
// The engine/network state advances instantly; the DISPLAYED state lags behind,
// replaying each action at a readable tempo with visual effects layered on top:
// card reveal for opponent plays, FLIP slides for moving units, floating
// damage/buff numbers, death fades, draw fly-outs and score banners.
//
// The hook receives the live state plus the action that produced it (with a
// monotonic `seq`); any non-consecutive seq (seek, resync, new game) snaps the
// display instantly. All effects are cosmetic DOM overlays — game logic only
// ever sees real states.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cardsById } from '../data/cards'
import type { GameAction, GameState, PlayerIx } from '../engine/types'

export interface RevealInfo {
  cardId: string
  label: string
}

interface Step {
  state: GameState
  action: GameAction | null
}

/** Display duration of one opponent action (ms). Own actions render instantly. */
function delayFor(a: GameAction | null, me: PlayerIx): number {
  if (!a || !('player' in a) || a.player === me) return 0
  switch (a.t) {
    case 'playCard':
      return 1250
    case 'activateAbility':
      return 1000
    case 'choose':
      return 650
    case 'move':
      return 700
    case 'endTurn':
      return 600
    case 'manual':
      return 600
    case 'mulligan':
      return 450
    case 'exhaustRune':
    case 'recycleRune':
      return 300
    case 'pass':
      return 280
    default:
      return 350
  }
}

/** Card shown big in the center while an opponent action plays out. */
function revealFor(s: GameState, prev: GameState, a: GameAction | null, me: PlayerIx): RevealInfo | null {
  if (!a || !('player' in a) || a.player === me) return null
  const who = s.players[a.player].name
  if (a.t === 'playCard') return { cardId: a.cardId, label: `${who} joue` }
  if (a.t === 'activateAbility') {
    if (a.source.kind === 'legend') return { cardId: s.players[a.player].legendId, label: `${who} active` }
    if (a.source.kind === 'battlefield') {
      const bf = s.battlefields[a.source.ix]
      return bf ? { cardId: bf.cardId, label: `${who} active` } : null
    }
    const u = prev.units.find((x) => x.uid === (a.source as { uid: number }).uid)
    return u ? { cardId: u.cardId, label: `${who} active` } : null
  }
  return null
}

/** Snapshot the screen positions of every animatable element. */
function measure(): Map<string, DOMRect> {
  const m = new Map<string, DOMRect>()
  document.querySelectorAll<HTMLElement>('[data-auid]').forEach((el) => {
    m.set(`u:${el.dataset.auid}`, el.getBoundingClientRect())
  })
  document.querySelectorAll<HTMLElement>('[data-anchor]').forEach((el) => {
    m.set(`a:${el.dataset.anchor}`, el.getBoundingClientRect())
  })
  return m
}

// ---------------------------------------------------------------- DOM effects

function spawn(layer: HTMLElement, cls: string, rect: { left: number; top: number; width?: number; height?: number }) {
  const el = document.createElement('div')
  el.className = cls
  el.style.left = `${rect.left}px`
  el.style.top = `${rect.top}px`
  if (rect.width !== undefined) el.style.width = `${rect.width}px`
  if (rect.height !== undefined) el.style.height = `${rect.height}px`
  layer.appendChild(el)
  return el
}

function float(layer: HTMLElement, r: DOMRect, text: string, color: string) {
  const el = spawn(layer, 'anim-float', { left: r.left + r.width / 2, top: r.top + r.height * 0.35 })
  el.textContent = text
  el.style.color = color
  el.animate(
    [
      { transform: 'translate(-50%, 0) scale(0.7)', opacity: 0 },
      { transform: 'translate(-50%, -14px) scale(1.15)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -46px) scale(1)', opacity: 0 },
    ],
    { duration: 1100, easing: 'ease-out' }
  ).onfinish = () => el.remove()
}

function ghost(layer: HTMLElement, r: DOMRect, image: string | null, name: string) {
  const el = spawn(layer, 'anim-ghost', r)
  if (image) el.style.backgroundImage = `url(${image})`
  else el.textContent = name
  el.animate(
    [
      { transform: 'none', opacity: 0.95, filter: 'saturate(1)' },
      { transform: 'scale(0.75) rotate(4deg)', opacity: 0, filter: 'saturate(0.2)' },
    ],
    { duration: 700, easing: 'ease-in' }
  ).onfinish = () => el.remove()
}

function flyCard(layer: HTMLElement, from: DOMRect, to: DOMRect, delay: number) {
  const el = spawn(layer, 'anim-flycard', { left: from.left + from.width / 2, top: from.top + from.height / 2 })
  el.textContent = '🂠'
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  el.style.opacity = '0'
  el.animate(
    [
      { transform: 'translate(-50%,-50%) scale(0.6)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.1)', opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.8)`, opacity: 0.9, offset: 0.9 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`, opacity: 0 },
    ],
    { duration: 650, delay, easing: 'cubic-bezier(.3,.7,.4,1)' }
  ).onfinish = () => el.remove()
}

function banner(layer: HTMLElement, text: string) {
  const el = document.createElement('div')
  el.className = 'anim-banner'
  el.textContent = text
  layer.appendChild(el)
  el.animate(
    [
      { transform: 'translate(-50%,-50%) scale(0.7)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.05)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.75 },
      { transform: 'translate(-50%,-60%) scale(1)', opacity: 0 },
    ],
    { duration: 1400, easing: 'ease-out' }
  ).onfinish = () => el.remove()
}

function ring(layer: HTMLElement, r: DOMRect) {
  const el = spawn(layer, 'anim-ring', { left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 })
  el.animate(
    [
      { opacity: 0, transform: 'scale(1.4)' },
      { opacity: 1, transform: 'scale(1)', offset: 0.3 },
      { opacity: 1, transform: 'scale(1)', offset: 0.7 },
      { opacity: 0, transform: 'scale(1)' },
    ],
    { duration: 900, easing: 'ease-out' }
  ).onfinish = () => el.remove()
}

/** Diff prev→next and spawn every cosmetic effect. */
function runEffects(
  layer: HTMLElement | null,
  prev: GameState,
  next: GameState,
  action: GameAction | null,
  before: Map<string, DOMRect>,
  after: Map<string, DOMRect>,
  me: PlayerIx
) {
  if (!layer) return

  // FLIP: units still present whose on-screen position changed slide over.
  for (const u of next.units) {
    const a = before.get(`u:${u.uid}`)
    const b = after.get(`u:${u.uid}`)
    if (!a || !b) continue
    const dx = a.left - b.left
    const dy = a.top - b.top
    if (Math.abs(dx) + Math.abs(dy) < 14) continue
    const el = document.querySelector<HTMLElement>(`[data-auid="${u.uid}"]`)
    el?.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
      { duration: 480, easing: 'cubic-bezier(.2,.85,.25,1)' }
    )
  }

  // Deaths: units gone from the board fade out where they stood.
  const nextUids = new Set(next.units.map((u) => u.uid))
  for (const u of prev.units) {
    if (nextUids.has(u.uid)) continue
    const r = before.get(`u:${u.uid}`)
    if (!r) continue
    const card = cardsById.get(u.cardId)
    ghost(layer, r, card?.image ?? null, card?.name ?? '?')
  }

  // Damage / heal / buff / stun floats on surviving units.
  const prevBy = new Map(prev.units.map((u) => [u.uid, u]))
  for (const u of next.units) {
    const p = prevBy.get(u.uid)
    const r = after.get(`u:${u.uid}`)
    if (!p || !r) continue
    if (u.damage > p.damage) float(layer, r, `-${u.damage - p.damage}`, '#ff6259')
    else if (u.damage < p.damage) float(layer, r, `+${p.damage - u.damage}`, '#5fd97e')
    if (!p.buffed && u.buffed) float(layer, r, '+1⚔️', '#5fd97e')
    if (u.tempMight > p.tempMight) float(layer, r, `+${u.tempMight - p.tempMight}⚔️`, '#5fd97e')
    if (!p.stunned && u.stunned) float(layer, r, '💫', '#ffd75e')
  }

  // Draws: card backs fly from the deck counter to the hand.
  for (const p of [0, 1] as PlayerIx[]) {
    const drew = next.players[p].hand.length - prev.players[p].hand.length
    if (drew <= 0 || next.players[p].deck.length >= prev.players[p].deck.length) continue
    const from = before.get(`a:deck-${p}`) ?? after.get(`a:deck-${p}`)
    const to = after.get(`a:hand-fan-${p}`) ?? after.get(`a:handcount-${p}`)
    if (!from || !to) continue
    for (let i = 0; i < Math.min(drew, 5); i++) flyCard(layer, from, to, i * 140)
  }

  // Scored points: center banner + score pulse.
  for (const p of [0, 1] as PlayerIx[]) {
    const d = next.players[p].points - prev.players[p].points
    if (d <= 0) continue
    banner(layer, `🏆 +${d} point${d > 1 ? 's' : ''} — ${next.players[p].name}`)
    document
      .querySelector<HTMLElement>(`[data-anchor="score-${p}"]`)
      ?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], {
        duration: 600,
        easing: 'ease-out',
      })
  }

  // Opponent targeting: flash a ring on the units they picked.
  if (action?.t === 'choose' && action.player !== me && action.choice.kind === 'unit') {
    for (const uid of action.choice.uids) {
      const r = after.get(`u:${uid}`) ?? before.get(`u:${uid}`)
      if (r) ring(layer, r)
    }
  }
}

// ---------------------------------------------------------------- pacing hook

export function usePacedState(
  live: GameState,
  action: GameAction | null,
  seq: number,
  me: PlayerIx,
  enabled: boolean,
  layer: React.RefObject<HTMLDivElement | null>
): { shown: GameState; busy: boolean; reveal: RevealInfo | null; skip: () => void } {
  const [shown, setShown] = useState(live)
  const [reveal, setReveal] = useState<RevealInfo | null>(null)
  const [busy, setBusy] = useState(false)
  const queue = useRef<Step[]>([])
  const running = useRef(false)
  const lastSeq = useRef(seq)
  const prevShown = useRef(live)
  const rectsBefore = useRef<Map<string, DOMRect>>(new Map())
  const pendingStep = useRef<Step | null>(null)
  const skipping = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pump = () => {
    if (running.current) return
    const step = queue.current.shift()
    if (!step) {
      setBusy(false)
      skipping.current = false
      return
    }
    running.current = true
    setBusy(true)
    rectsBefore.current = measure()
    pendingStep.current = step
    setShown(step.state)
  }

  // After each shown-state commit: measure again, spawn effects, schedule next.
  useLayoutEffect(() => {
    const step = pendingStep.current
    if (!step) {
      prevShown.current = shown
      return
    }
    pendingStep.current = null
    const prev = prevShown.current
    prevShown.current = shown
    const quiet = skipping.current
    const dly = quiet ? 0 : delayFor(step.action, me)
    if (!quiet) {
      const after = measure()
      runEffects(layer.current, prev, shown, step.action, rectsBefore.current, after, me)
      if (dly >= 900) setReveal(revealFor(shown, prev, step.action, me))
    }
    timer.current = setTimeout(() => {
      timer.current = null
      running.current = false
      setReveal(null)
      pump()
    }, dly)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown])

  // Feed the queue from the live state.
  useEffect(() => {
    if (!enabled) {
      queue.current = []
      running.current = false
      pendingStep.current = null
      lastSeq.current = seq
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      setReveal(null)
      setBusy(false)
      setShown(live)
      return
    }
    if (seq === lastSeq.current) return
    if (seq !== lastSeq.current + 1) {
      // Seek / resync / new game: snap instantly.
      lastSeq.current = seq
      queue.current = []
      running.current = false
      pendingStep.current = null
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      setReveal(null)
      setBusy(false)
      setShown(live)
      return
    }
    lastSeq.current = seq
    queue.current.push({ state: live, action })
    pump()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, seq, enabled])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const skip = () => {
    skipping.current = true
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    running.current = false
    setReveal(null)
    pump()
  }

  return { shown, busy, reveal, skip }
}
