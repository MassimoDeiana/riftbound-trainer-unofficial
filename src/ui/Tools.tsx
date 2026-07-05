import { useState } from 'react'
import { DOMAIN_COLORS, DOMAINS } from '../data/cards'
import type { GameAction, GameState, ManualOp, PlayerIx, UnitEntity } from '../engine/types'

export function GlobalTools({ me, act, state }: { me: PlayerIx; act: (a: GameAction) => void; state: GameState }) {
  const [note, setNote] = useState('')
  const m = (op: ManualOp) => act({ t: 'manual', player: me, op })
  return (
    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="small" onClick={() => m({ k: 'draw', who: me, n: 1 })}>
        Piocher 1
      </button>
      <button className="small" onClick={() => m({ k: 'energy', who: me, n: 1 })}>
        +1⚡
      </button>
      {DOMAINS.map((d) => (
        <button key={d} className="small" title={`+1 puissance ${d}`} onClick={() => m({ k: 'power', who: me, domain: d, n: 1 })}>
          +<span className="domain-dot" style={{ background: DOMAIN_COLORS[d] }} />
        </button>
      ))}
      <button className="small" onClick={() => m({ k: 'channel', who: me, n: 1 })}>
        Canaliser 1 rune
      </button>
      <button className="small" onClick={() => m({ k: 'points', who: me, n: 1 })}>
        +1 pt
      </button>
      <button className="small" onClick={() => m({ k: 'points', who: me, n: -1 })}>
        −1 pt
      </button>
      <input placeholder="note au log…" value={note} onChange={(e) => setNote(e.target.value)} style={{ width: 140, padding: '3px 8px' }} />
      <button
        className="small"
        onClick={() => {
          if (note.trim()) m({ k: 'note', text: note.trim() })
          setNote('')
        }}
      >
        💬
      </button>
      {state.phase === 'over' && <span className="dim">partie terminée — outils toujours actifs</span>}
    </span>
  )
}

export function UnitTools({ u, me, act, close }: { u: UnitEntity; me: PlayerIx; act: (a: GameAction) => void; close: () => void }) {
  const m = (op: ManualOp) => {
    act({ t: 'manual', player: me, op })
  }
  return (
    <div className="unit-tools">
      <button className="small" onClick={() => m({ k: 'damage', unitUid: u.uid, n: 1 })}>
        +1 dégât
      </button>
      <button className="small" onClick={() => m({ k: 'heal', unitUid: u.uid, n: 1 })}>
        soigner 1
      </button>
      <button className="small" onClick={() => m({ k: u.buffed ? 'unbuff' : 'buff', unitUid: u.uid })}>
        {u.buffed ? 'retirer buff' : 'buff +1'}
      </button>
      <button className="small" onClick={() => m({ k: 'tempMight', unitUid: u.uid, n: 1 })}>
        +1 Might (tour)
      </button>
      <button className="small" onClick={() => m({ k: 'tempMight', unitUid: u.uid, n: -1 })}>
        −1 Might (tour)
      </button>
      <button className="small" onClick={() => m({ k: 'stun', unitUid: u.uid })}>
        étourdir
      </button>
      <button className="small" onClick={() => m({ k: 'readyUnit', unitUid: u.uid, ready: !u.ready })}>
        {u.ready ? 'engager' : 'redresser'}
      </button>
      <button className="small" onClick={() => m({ k: 'recallUnit', unitUid: u.uid })}>
        rappeler
      </button>
      <button
        className="small danger"
        onClick={() => {
          m({ k: 'kill', unitUid: u.uid })
          close()
        }}
      >
        détruire
      </button>
      <button className="small" onClick={close}>
        fermer
      </button>
    </div>
  )
}
