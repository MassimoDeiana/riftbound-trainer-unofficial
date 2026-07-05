import { useEffect, useRef, useState } from 'react'
import { cardsById, DOMAIN_COLORS, textify, type Domain } from '../data/cards'
import { def, keywords, unitMight } from '../engine/cardinfo'
import type { GameAction, GameState, LocationRef, PlayerIx, UnitEntity } from '../engine/types'
import { MAX_MULLIGAN, VICTORY_SCORE } from '../engine/types'
import { announceHover, CardImg } from './CardImg'
import { GlobalTools, UnitTools } from './Tools'

export interface TimeTravel {
  cursor: number
  total: number
  review: boolean
  onSeek: (k: number) => void
  onExport: () => void
}

export function GameTable({
  state,
  me,
  dispatch,
  error,
  roomCode,
  onLeave,
  onResync,
  timeTravel,
}: {
  state: GameState
  me: PlayerIx
  dispatch: (a: GameAction) => void
  error: string | null
  roomCode: string
  onLeave: () => void
  onResync: () => void
  timeTravel?: TimeTravel
}) {
  const opp: PlayerIx = me === 0 ? 1 : 0
  const my = state.players[me]
  const op = state.players[opp]
  const [selected, setSelected] = useState<number[]>([])
  const [pendingCard, setPendingCard] = useState<string | null>(null)
  const [accel, setAccel] = useState(false)
  const [tools, setTools] = useState(false)
  const [toolUnit, setToolUnit] = useState<number | null>(null)
  const [trashView, setTrashView] = useState<PlayerIx | null>(null)
  const [mullSel, setMullSel] = useState<string[]>([])
  const [hints, setHints] = useState(() => localStorage.getItem('rb.hints') !== '0')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [state.log.length])

  useEffect(() => {
    setSelected((sel) => sel.filter((uid) => state.units.some((u) => u.uid === uid)))
  }, [state])

  const toggleHints = () => {
    setHints((h) => {
      localStorage.setItem('rb.hints', h ? '0' : '1')
      return !h
    })
  }

  const myTurn = state.turnPlayer === me && state.phase === 'action'
  const neutralOpen = state.chain.length === 0 && !state.showdown
  const chainTop = state.chain[state.chain.length - 1]
  const chainLocked = state.chain.length > 0 && state.chainPasses >= 2

  const canPass =
    (state.chain.length > 0 && state.chainActive === me && !chainLocked) ||
    (state.chain.length === 0 && state.showdown?.focus === me)
  const mustResolve = chainLocked && chainTop?.controller === me

  const act = (a: GameAction) => dispatch(a)

  const playPending = (loc?: LocationRef) => {
    if (!pendingCard) return
    const from =
      my.championInZone && my.championId === pendingCard && !my.hand.includes(pendingCard) ? 'champion' : 'hand'
    act({ t: 'playCard', player: me, cardId: pendingCard, from, location: loc, accelerate: accel })
    setPendingCard(null)
    setAccel(false)
  }

  const moveTo = (to: LocationRef) => {
    if (selected.length === 0) return
    act({ t: 'move', player: me, unitUids: selected, to })
    setSelected([])
  }

  const pendingDef = pendingCard ? cardsById.get(pendingCard) : null
  const pendingKw = pendingCard ? keywords(pendingCard) : null

  const unitClick = (u: UnitEntity) => {
    if (tools) {
      setToolUnit(toolUnit === u.uid ? null : u.uid)
      return
    }
    if (u.controller === me && u.kind === 'unit' && u.ready && neutralOpen && myTurn) {
      setSelected((sel) => (sel.includes(u.uid) ? sel.filter((x) => x !== u.uid) : [...sel, u.uid]))
    }
  }

  /** Rough affordability for hand highlighting (energy via ready runes, power via matching runes). */
  const canAfford = (cardId: string): boolean => {
    const card = def(cardId)
    const readyRunes = my.runes.filter((r) => r.ready).length
    const matching = my.runes.filter((r) => card.domains.includes(def(r.cardId).domains[0] as Domain)).length
    const poolPower =
      (my.pool.power.Universal ?? 0) + card.domains.reduce((n, d) => n + (my.pool.power[d] ?? 0), 0)
    const powerNeed = Math.max(0, (card.power ?? 0) - poolPower)
    return my.pool.energy + readyRunes >= (card.energy ?? 0) + powerNeed && matching + poolPower >= (card.power ?? 0)
  }

  const renderTool = (u: UnitEntity) =>
    toolUnit === u.uid && tools ? <UnitTools u={u} me={me} act={act} close={() => setToolUnit(null)} /> : null

  const [menuOpen, setMenuOpen] = useState(false)
  const [showLog, setShowLog] = useState(false)

  return (
    <div className="game-root">
      <div className="game-main playmat">
        {/* ------- floating utility HUD (top-right) ------- */}
        <div className="hud-top">
          <span className={`turn-indicator ${state.turnPlayer === me && state.winner === null ? 'mine' : ''}`}>
            Tour {state.turn} · {state.winner !== null ? '🏁 Terminé' : state.turnPlayer === me ? '✨ à toi' : `à ${op.name}`}
          </span>
          <button className={`icon ${hints ? 'primary' : ''}`} onClick={toggleHints} title="Aide interactive">
            💡
          </button>
          <button className={`icon ${showLog ? 'primary' : ''}`} onClick={() => setShowLog((s) => !s)} title="Journal de partie">
            📜
          </button>
          <button className="icon" onClick={onResync} title="Resynchroniser avec l'adversaire">
            ↻
          </button>
          <div className="menu-wrap">
            <button className="icon" onClick={() => setMenuOpen((o) => !o)} title="Menu">
              ⋯
            </button>
            {menuOpen && (
              <div className="menu-pop" onMouseLeave={() => setMenuOpen(false)}>
                <span className="badge">{roomCode}</span>
                <button className="small danger" onClick={() => confirm('Abandonner ?') && act({ t: 'concede', player: me })}>
                  Abandonner
                </button>
                <button className="small" onClick={onLeave}>
                  Quitter la partie
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-bar">{error}</div>}
        {timeTravel && <TimeTravelBar tt={timeTravel} turn={state.turn} lastLog={state.log[state.log.length - 1]?.text} />}

        {/* ------- opponent bar (compact) ------- */}
        <PlayerBar
          state={state}
          p={opp}
          me={me}
          onTrash={() => setTrashView(opp)}
          act={act}
          hints={hints}
          onUnitClick={unitClick}
          selected={selected}
          renderTool={renderTool}
        />

        {/* ------- battlefields (flex-grow area) ------- */}
        <div className="field-area">
        <div className="battlefields">
          {state.battlefields.map((bf, ix) => {
            const bfCard = def(bf.cardId)
            const unitsHere = state.units.filter((u) => u.location === ix)
            const isCombat = state.showdown?.battlefield === ix
            const borderClass = bf.controller === null ? 'neutral' : bf.controller === me ? 'mine' : 'theirs'
            return (
              <div
                key={ix}
                className={`battlefield ${borderClass} ${isCombat ? 'combat' : ''}`}
                style={
                  bfCard.image
                    ? { backgroundImage: `linear-gradient(rgba(6,11,20,0.88), rgba(6,11,20,0.82)), url(${bfCard.image})` }
                    : undefined
                }
              >
                <div
                  className="bf-title"
                  onMouseEnter={() => announceHover(bfCard)}
                  onMouseLeave={() => announceHover(null)}
                >
                  <strong>{bfCard.name}</strong>
                  <span className="dim">
                    {bf.controller === null ? 'neutre' : `contrôlé par ${state.players[bf.controller].name}`}
                    {bf.scoredBy[me] ? ' · marqué ✓' : ''}
                    {bfCard.text ? ' · ℹ️' : ''}
                  </span>
                </div>
                {bf.facedown && (
                  <div className="facedown">
                    🂠 carte cachée ({state.players[bf.facedown.owner].name})
                    {bf.facedown.owner === me && ` : ${def(bf.facedown.cardId).name}`}
                    {bf.facedown.owner === me && state.turn > bf.facedown.hiddenOnTurn && (
                      <button
                        className="small"
                        onClick={() =>
                          act({ t: 'playCard', player: me, cardId: bf.facedown!.cardId, from: 'hidden', battlefield: ix })
                        }
                      >
                        Jouer
                      </button>
                    )}
                  </div>
                )}
                <div className="bf-lanes">
                  <div className="bf-lane enemy">
                    {unitsHere
                      .filter((u) => u.controller === opp)
                      .map((u) => (
                        <Unit key={u.uid} u={u} selected={selected.includes(u.uid)} onClick={() => unitClick(u)} tool={renderTool(u)} me={me} width={92} />
                      ))}
                  </div>
                  <div className="bf-mid">
                    {unitsHere.length === 0 ? <span className="zone-etch">champ de bataille</span> : <span className="bf-divider" />}
                  </div>
                  <div className="bf-lane mine">
                    {unitsHere
                      .filter((u) => u.controller === me)
                      .map((u) => (
                        <Unit key={u.uid} u={u} selected={selected.includes(u.uid)} onClick={() => unitClick(u)} tool={renderTool(u)} me={me} width={92} />
                      ))}
                  </div>
                </div>
                <div className="bf-actions">
                  {selected.length > 0 && (
                    <button className={`small primary ${hints ? 'hint-glow' : ''}`} onClick={() => moveTo(ix)}>
                      ⚔️ Déplacer ici ({selected.length})
                    </button>
                  )}
                  {pendingDef?.type === 'Unit' && bf.controller === me && (
                    <button className="small primary" onClick={() => playPending(ix)}>
                      Jouer {pendingDef.name} ici
                    </button>
                  )}
                  {pendingKw?.hidden && bf.controller === me && !bf.facedown && (
                    <button
                      className="small"
                      onClick={() => {
                        act({ t: 'hide', player: me, cardId: pendingCard!, battlefield: ix })
                        setPendingCard(null)
                      }}
                    >
                      🂠 Cacher ici (1◆)
                    </button>
                  )}
                  {state.pendingCombat.includes(ix) && state.turnPlayer === me && neutralOpen && (
                    <button className={`small danger ${hints ? 'hint-glow' : ''}`} onClick={() => act({ t: 'chooseCombat', player: me, battlefield: ix })}>
                      ⚔️ Lancer le combat
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

          {/* ------- centered overlays (chain / showdown) ------- */}
          {state.showdown && (
            <div className="overlay-banner showdown-banner">
              ⚔️ {state.showdown.defender !== null ? 'Combat' : 'Showdown'} à{' '}
              <strong>{def(state.battlefields[state.showdown.battlefield].cardId).name}</strong> — focus :{' '}
              <strong>{state.players[state.showdown.focus].name}</strong>
            </div>
          )}
          {state.chain.length > 0 && (
            <div className="overlay-banner chain">
              🔗
              {state.chain.map((item, i) => (
                <span key={item.uid} className="badge" style={{ marginLeft: 6 }}>
                  {i + 1}. {item.label} ({state.players[item.controller].name})
                </span>
              ))}
              {!chainLocked && state.chainActive !== null && (
                <span style={{ marginLeft: 8 }}>
                  → <strong>{state.players[state.chainActive].name}</strong> répond ([Reaction]) ou passe
                </span>
              )}
              {mustResolve && chainTop && chainTop.script === 'vision' && (
                <span style={{ marginLeft: 8 }}>
                  Vision — dessus du deck : <strong>{my.deck[0] ? def(my.deck[0]).name : '(vide)'}</strong>
                  <button className="small primary" onClick={() => act({ t: 'resolveChainTop', player: me, choice: 'keep' })}>
                    Garder
                  </button>
                  <button className="small" onClick={() => act({ t: 'resolveChainTop', player: me, choice: 'recycle' })}>
                    Recycler
                  </button>
                </span>
              )}
              {chainLocked && chainTop && chainTop.controller !== me && (
                <span style={{ marginLeft: 8 }} className="dim">
                  {state.players[chainTop.controller].name} résout {chainTop.label}…
                </span>
              )}
            </div>
          )}
        </div>{/* /field-area */}

        {/* ------- my side ------- */}
        {/* ------- my board strip: base units + interactive runes ------- */}
        <div className="my-strip">
          <span className="zone-etch">base</span>
          <div className="strip-units">
            {state.units.filter((u) => u.location === 'base' && u.controller === me).map((u) => (
              <Unit key={u.uid} u={u} selected={selected.includes(u.uid)} onClick={() => unitClick(u)} tool={renderTool(u)} me={me} width={86} />
            ))}
            {selected.length > 0 && (
              <button className="small primary" onClick={() => moveTo('base')}>
                Rappeler ici
              </button>
            )}
            {state.units.filter((u) => u.location === 'base' && u.controller === me).length === 0 && selected.length === 0 && (
              <span className="dim" style={{ fontSize: 12 }}>aucune unité à la base</span>
            )}
          </div>
          <RunesRow state={state} p={me} me={me} hints={hints} act={act} />
        </div>

        {/* ------- hand dock: legend | champion | counts | hand fan | action ------- */}
        <div className="hand-dock">
          {hints && <HintBox state={state} me={me} />}

          <div className="dock-row">
            <div className="dock-left">
              <div className="ident-card">
                <CardImg card={def(my.legendId)} width={178} />
                <span className="zone-etch">légende</span>
              </div>
              {my.championInZone ? (
                <div className="ident-card">
                  <CardImg
                    card={def(my.championId)}
                    width={178}
                    selected={pendingCard === my.championId && !my.hand.includes(my.championId)}
                    onClick={() => setPendingCard(pendingCard === my.championId ? null : my.championId)}
                  />
                  <span className="zone-etch">champion</span>
                </div>
              ) : (
                <div className="ident-card">
                  <div className="empty-slot" style={{ width: 178, height: 249 }} />
                  <span className="zone-etch">champion</span>
                </div>
              )}
            </div>

            <div className="hand-fan">
              {my.hand.length === 0 && <span className="dim" style={{ padding: 20 }}>Main vide</span>}
              {my.hand.map((cardId, i) => {
                const n = my.hand.length
                const offset = i - (n - 1) / 2
                const rot = offset * (n > 7 ? 2 : 3)
                const dip = Math.abs(offset) * Math.abs(offset) * (n > 7 ? 2 : 3)
                const highlight = hints && myTurn && neutralOpen && canAfford(cardId)
                const isSel = state.phase === 'mulligan' ? mullSel.includes(cardId) : pendingCard === cardId
                return (
                  <div
                    className={`fan-card ${highlight ? 'affordable' : ''} ${isSel ? 'chosen' : ''}`}
                    key={`${cardId}-${i}`}
                    style={{
                      transform: `rotate(${rot}deg) translateY(${dip}px)`,
                      marginLeft: i === 0 ? 0 : -56,
                      zIndex: i,
                    }}
                  >
                    <CardImg
                      card={def(cardId)}
                      width={178}
                      zoom={false}
                      selected={isSel}
                      onClick={() => {
                        if (state.phase === 'mulligan') {
                          setMullSel((sel) =>
                            sel.includes(cardId) ? sel.filter((x) => x !== cardId) : sel.length < MAX_MULLIGAN ? [...sel, cardId] : sel
                          )
                        } else {
                          setPendingCard(pendingCard === cardId ? null : cardId)
                        }
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="action-dock">
              <div className="score-big" title={`Points de victoire : ${my.points}/${VICTORY_SCORE}`}>
                <span className="score-big-num">{my.points}</span>
                <span className="score-big-max">/{VICTORY_SCORE}</span>
                <span className="score-big-lbl">pts</span>
              </div>
              {timeTravel?.review ? (
                <div className="dock-panel dim">🎬 Revue — lecture seule</div>
              ) : (
                <ActionDock
                  state={state}
                  me={me}
                  mullSel={mullSel}
                  setMullSel={setMullSel}
                  pendingDef={pendingDef}
                  pendingKw={pendingKw}
                  accel={accel}
                  setAccel={setAccel}
                  playPending={playPending}
                  setPendingCard={setPendingCard}
                  canPass={canPass}
                  mustResolve={mustResolve}
                  chainTop={chainTop}
                  myTurn={myTurn}
                  neutralOpen={neutralOpen}
                  hints={hints}
                  act={act}
                  tools={tools}
                  setTools={setTools}
                />
              )}
              <CountNums pl={my} onTrash={() => setTrashView(me)} />
            </div>
          </div>

          {tools && (
            <div className="tools">
              <GlobalTools me={me} act={act} state={state} />
            </div>
          )}
        </div>

        {/* ------- log overlay (optional) ------- */}
        {showLog && (
          <div className="game-log floating" ref={logRef}>
            <div className="log-title">
              Journal
              <button className="icon" style={{ marginLeft: 'auto' }} onClick={() => setShowLog(false)}>
                ✕
              </button>
            </div>
            {state.log.map((l, i) => (
              <div key={i} className={l.player === me ? '' : 'dim'}>
                {textify(l.text)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------- trash modal ------- */}
      {trashView !== null && (
        <div className="modal" onClick={() => setTrashView(null)}>
          <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
            <h3>Défausse de {state.players[trashView].name}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {state.players[trashView].trash.map((id, i) => (
                <div key={i}>
                  <CardImg card={def(id)} width={100} />
                  {tools && trashView === me && (
                    <button className="small" onClick={() => act({ t: 'manual', player: me, op: { k: 'toHandFromTrash', who: me, cardId: id } })}>
                      → main
                    </button>
                  )}
                </div>
              ))}
              {state.players[trashView].trash.length === 0 && <span className="dim">vide</span>}
            </div>
            <button onClick={() => setTrashView(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- contextual action dock

function ActionDock({
  state,
  me,
  mullSel,
  setMullSel,
  pendingDef,
  pendingKw,
  accel,
  setAccel,
  playPending,
  setPendingCard,
  canPass,
  mustResolve,
  chainTop,
  myTurn,
  neutralOpen,
  hints,
  act,
  tools,
  setTools,
}: {
  state: GameState
  me: PlayerIx
  mullSel: string[]
  setMullSel: (s: string[]) => void
  pendingDef: ReturnType<typeof cardsById.get> | null
  pendingKw: ReturnType<typeof keywords> | null
  accel: boolean
  setAccel: (b: boolean) => void
  playPending: (loc?: LocationRef) => void
  setPendingCard: (id: string | null) => void
  canPass: boolean
  mustResolve: boolean
  chainTop: GameState['chain'][number] | undefined
  myTurn: boolean
  neutralOpen: boolean
  hints: boolean
  act: (a: GameAction) => void
  tools: boolean
  setTools: (b: boolean) => void
}) {
  const my = state.players[me]

  // Card selected from hand: how to play it
  if (pendingDef) {
    return (
      <div className="dock-panel">
        <div className="dock-title">Jouer {pendingDef.name}</div>
        {pendingDef.type === 'Unit' ? (
          <>
            <button className="dock-btn" onClick={() => playPending('base')}>
              À la base
            </button>
            <div className="dock-hint">ou clique un champ de bataille contrôlé ↑</div>
            {pendingKw?.accelerate && (
              <label className="dock-check">
                <input type="checkbox" checked={accel} onChange={(e) => setAccel(e.target.checked)} /> Accélérer (+1⚡+1◆)
              </label>
            )}
          </>
        ) : (
          <button className="dock-btn primary" onClick={() => playPending()}>
            Jouer ce {pendingDef.type === 'Spell' ? 'sort' : 'équipement'}
          </button>
        )}
        <button className="dock-btn ghost" onClick={() => setPendingCard(null)}>
          Annuler
        </button>
      </div>
    )
  }

  // Mulligan
  if (state.phase === 'mulligan' && !my.mulliganed) {
    return (
      <div className="dock-panel">
        <div className="dock-title">🃏 Mulligan</div>
        <div className="dock-hint">Clique jusqu'à {MAX_MULLIGAN} cartes à remplacer</div>
        <button
          className={`dock-btn primary ${hints ? 'hint-glow' : ''}`}
          onClick={() => {
            act({ t: 'mulligan', player: me, cardIds: mullSel })
            setMullSel([])
          }}
        >
          Valider ({mullSel.length})
        </button>
      </div>
    )
  }
  if (state.phase === 'mulligan') {
    return <div className="dock-panel dim">En attente de l'adversaire…</div>
  }

  // Resolve top of chain
  if (mustResolve && chainTop && chainTop.script !== 'vision') {
    return (
      <div className="dock-panel">
        <button className={`dock-btn primary ${hints ? 'hint-glow' : ''}`} onClick={() => act({ t: 'resolveChainTop', player: me })}>
          Résoudre {chainTop.label}
        </button>
        <div className="dock-hint">applique son effet avec 🔧 si besoin</div>
      </div>
    )
  }

  // Pass (chain / showdown)
  if (canPass) {
    return (
      <div className="dock-panel">
        <button className={`dock-btn primary big ${hints ? 'hint-glow' : ''}`} onClick={() => act({ t: 'pass', player: me })}>
          Passer
        </button>
      </div>
    )
  }

  // Combat to launch
  if (myTurn && neutralOpen && state.pendingCombat.length > 0) {
    return <div className="dock-panel dim">⚔️ Lance le combat sur le champ de bataille ↑</div>
  }

  // Normal turn: end turn
  if (myTurn && neutralOpen) {
    return (
      <div className="dock-panel">
        <button className={`dock-btn primary big ${hints ? 'hint-soft' : ''}`} onClick={() => act({ t: 'endTurn', player: me })}>
          Fin de tour ⏭
        </button>
        <button className={`dock-btn ghost ${tools ? 'on' : ''}`} onClick={() => setTools(!tools)} title="Ajustements manuels des effets de cartes">
          🔧 Outils
        </button>
      </div>
    )
  }

  // Opponent's turn
  return (
    <div className="dock-panel dim">
      ⏳ Tour adverse
      <button className={`dock-btn ghost ${tools ? 'on' : ''}`} onClick={() => setTools(!tools)}>
        🔧 Outils
      </button>
    </div>
  )
}

/** Channeled runes shown as cards; interactive (tap → energy/power) only for the local player. */
function RunesRow({
  state,
  p,
  me,
  hints,
  act,
}: {
  state: GameState
  p: PlayerIx
  me: PlayerIx
  hints: boolean
  act: (a: GameAction) => void
}) {
  const pl = state.players[p]
  const isMe = p === me
  const [runeMenu, setRuneMenu] = useState<number | null>(null)
  return (
    <div className="runes-row" title={isMe ? 'Clique une rune — ⚡ engager pour 1 énergie, ◆ recycler pour 1 puissance' : 'Runes adverses'}>
      <span className="zone-etch">runes</span>
      {pl.runes.map((r) => {
        const glow = hints && isMe && r.ready && state.turnPlayer === p && pl.pool.energy === 0
        return (
          <div
            key={r.uid}
            className={`rune-card ${r.ready ? '' : 'exhausted'} ${glow ? 'hint-soft' : ''} ${runeMenu === r.uid ? 'menu-open' : ''}`}
          >
            <CardImg card={def(r.cardId)} width={34} zoom={false} onClick={() => isMe && r.ready && setRuneMenu(runeMenu === r.uid ? null : r.uid)} />
            {isMe && r.ready && runeMenu === r.uid && (
              <span className="rune-menu" onClick={(e) => e.stopPropagation()}>
                <button className="small" title="+1 Énergie (engager)" onClick={() => { act({ t: 'exhaustRune', player: p, runeUid: r.uid }); setRuneMenu(null) }}>
                  ⚡ Énergie
                </button>
                <button className="small" title="+1 Puissance (recycler la rune)" onClick={() => { act({ t: 'recycleRune', player: p, runeUid: r.uid }); setRuneMenu(null) }}>
                  ◆ Puissance
                </button>
              </span>
            )}
          </div>
        )
      })}
      <span className="pool" title="Réserve flottante (se vide en fin de tour)">
        ⚡{pl.pool.energy}
        {Object.entries(pl.pool.power)
          .filter(([, n]) => (n ?? 0) > 0)
          .map(([d, n]) => (
            <span key={d} style={{ marginLeft: 5 }}>
              <span className="domain-dot" style={{ background: DOMAIN_COLORS[d as Domain] ?? '#999' }} />
              {n}
            </span>
          ))}
      </span>
    </div>
  )
}

/** Card-count numbers only (hand / deck / rune deck / trash). */
function CountNums({ pl, onTrash }: { pl: GameState['players'][number]; onTrash: () => void }) {
  return (
    <div className="counts-grid">
      <span title="Cartes en main">✋ {pl.hand.length}</span>
      <span title="Deck principal">📚 {pl.deck.length}</span>
      <span title="Deck de runes">🎴 {pl.runeDeck.length}</span>
      <button className="counts-trash" title="Défausse (cliquer pour voir)" onClick={onTrash}>
        🗑 {pl.trash.length}
      </button>
    </div>
  )
}

/** Compact score + counts readout (used on the opponent bar). */
function Counts({ pl, score, onTrash }: { pl: GameState['players'][number]; score: number; onTrash: () => void }) {
  return (
    <div className="counts">
      <div className="counts-score" title={`Points de victoire : ${score}/${VICTORY_SCORE}`}>
        <span className="counts-num">{score}</span>
        <span className="counts-max">/{VICTORY_SCORE}</span>
        <span className="counts-lbl">pts</span>
      </div>
      <CountNums pl={pl} onTrash={onTrash} />
    </div>
  )
}

/** Opponent bar: one compact row — legend, champion, base units, runes, counts. */
function PlayerBar({
  state,
  p,
  me,
  onTrash,
  act,
  hints,
  onUnitClick,
  selected,
  renderTool,
}: {
  state: GameState
  p: PlayerIx
  me: PlayerIx
  onTrash: () => void
  act: (a: GameAction) => void
  hints: boolean
  onUnitClick: (u: UnitEntity) => void
  selected: number[]
  renderTool: (u: UnitEntity) => React.ReactNode
}) {
  const pl = state.players[p]
  const baseUnits = state.units.filter((u) => u.location === 'base' && u.controller === p)
  const active = state.turnPlayer === p
  return (
    <div className={`player-bar ${active ? 'active-turn' : ''}`}>
      <div className="ident-card">
        <CardImg card={def(pl.legendId)} width={48} zoom={true} />
        <span className="zone-etch">{pl.name}</span>
      </div>
      {pl.championInZone && (
        <div className="ident-card">
          <CardImg card={def(pl.championId)} width={48} zoom={true} />
          <span className="zone-etch">champion</span>
        </div>
      )}
      <div className="bar-base">
        <span className="zone-etch">base</span>
        <div className="strip-units">
          {baseUnits.map((u) => (
            <Unit key={u.uid} u={u} selected={selected.includes(u.uid)} onClick={() => onUnitClick(u)} tool={renderTool(u)} me={me} width={72} />
          ))}
          {baseUnits.length === 0 && <span className="dim" style={{ fontSize: 11 }}>—</span>}
        </div>
      </div>
      <RunesRow state={state} p={p} me={me} hints={hints} act={act} />
      <Counts pl={pl} score={pl.points} onTrash={onTrash} />
    </div>
  )
}

// ---------------------------------------------------------------- unit

function Unit({
  u,
  selected,
  onClick,
  tool,
  me,
  width = 86,
}: {
  u: UnitEntity
  selected: boolean
  onClick: () => void
  tool: React.ReactNode
  me: PlayerIx
  width?: number
}) {
  const card = def(u.cardId)
  const might = unitMight(u)
  return (
    <div className={`unit ${u.ready ? '' : 'exhausted'} ${u.controller === me ? 'mine' : 'theirs'} ${tool ? 'tools-open' : ''}`} style={{ position: 'relative' }}>
      {/* cropped: show only the top of the card (art + cost + name); full text on hover */}
      <CardImg card={card} width={width} crop={0.62} selected={selected} onClick={onClick} />
      <div className="unit-badges">
        {u.kind === 'unit' && <span className="badge might">{might}⚔️</span>}
        {u.damage > 0 && <span className="badge dmg">-{u.damage}</span>}
        {u.buffed && <span className="badge buff">+1</span>}
        {u.stunned && <span className="badge">💫</span>}
        {u.combatRole && <span className="badge">{u.combatRole === 'attacker' ? '⚔️' : '🛡️'}</span>}
        {u.isChampion && <span className="badge">⭐</span>}
      </div>
      {tool}
    </div>
  )
}

// ---------------------------------------------------------------- time travel

function TimeTravelBar({ tt, turn, lastLog }: { tt: TimeTravel; turn: number; lastLog?: string }) {
  const { cursor, total, review, onSeek, onExport } = tt
  const atLive = cursor === total
  return (
    <div className={`time-travel ${atLive ? '' : 'rewound'}`}>
      <button className="tt-btn" title="Début de la partie" disabled={cursor === 0} onClick={() => onSeek(0)}>
        ⏮
      </button>
      <button className="tt-btn" title="Coup précédent" disabled={cursor === 0} onClick={() => onSeek(cursor - 1)}>
        ◀
      </button>
      <input
        className="tt-slider"
        type="range"
        min={0}
        max={total}
        value={cursor}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <button className="tt-btn" title="Coup suivant" disabled={atLive} onClick={() => onSeek(cursor + 1)}>
        ▶
      </button>
      <button className="tt-btn" title="Fin (présent)" disabled={atLive} onClick={() => onSeek(total)}>
        ⏭
      </button>
      <span className="tt-label">
        {review ? '🎬 Revue' : atLive ? '⏺ Présent' : '⏪ Retour'} · action {cursor}/{total} · tour {turn}
      </span>
      {!review && !atLive && (
        <span className="tt-hint dim">
          {lastLog ? `↳ ${textify(lastLog).slice(0, 60)}` : ''} — joue un coup ici pour repartir de ce point
        </span>
      )}
      <button className="tt-btn" style={{ marginLeft: 'auto' }} title="Exporter cette partie (fichier)" onClick={onExport}>
        ⬇ Exporter
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- interactive hints

function HintBox({ state, me }: { state: GameState; me: PlayerIx }) {
  const my = state.players[me]
  const opp = state.players[me === 0 ? 1 : 0]
  const hints: string[] = []

  if (state.winner !== null) {
    hints.push(state.winner === me ? '🏆 Tu as gagné ! « Quitter » pour revenir au menu.' : `${opp.name} a gagné. « Quitter » pour revenir au menu.`)
  } else if (state.phase === 'mulligan') {
    if (!my.mulliganed)
      hints.push(
        "🃏 Mulligan : tu peux renvoyer jusqu'à 2 cartes de ta main (elles retournent sous ton deck) et en piocher autant. Garde des cartes peu chères (coût 1-3) pour bien démarrer."
      )
    else hints.push('En attente du mulligan adverse…')
  } else if (state.chain.length > 0) {
    const top = state.chain[state.chain.length - 1]
    if (state.chainPasses >= 2) {
      hints.push(
        top.controller === me
          ? `🔗 À toi de résoudre « ${top.label} » : applique son texte (dégâts, pioche…) avec les outils 🔧 si besoin, puis clique Résoudre.`
          : `🔗 ${state.players[top.controller].name} résout « ${top.label} ».`
      )
    } else if (state.chainActive === me) {
      hints.push('🔗 Un sort/déclencheur est sur la chaîne. Tu peux répondre avec une carte [Reaction] de ta main, ou cliquer Passer. Quand les deux joueurs passent, le dessus de la chaîne se résout.')
    } else {
      hints.push(`🔗 ${state.players[state.chainActive ?? 0].name} peut répondre à la chaîne.`)
    }
  } else if (state.showdown) {
    const combat = state.showdown.defender !== null
    if (state.showdown.focus === me) {
      hints.push(
        combat
          ? '⚔️ Combat ! Tu peux jouer des cartes [Action]/[Reaction] pour influencer le résultat, ou Passer. Quand les deux joueurs passent : chaque camp inflige sa Might totale — les unités qui subissent ≥ leur Might meurent. Si les défenseurs sont éliminés, le champ de bataille est conquis (1 point).'
          : "🚩 Showdown : tu contestes un champ de bataille vide. L'adversaire peut réagir ; si les deux joueurs passent, tu en prends le contrôle et marques 1 point (Conquête)."
      )
    } else {
      hints.push(`⚔️ ${state.players[state.showdown.focus].name} a le focus : il peut jouer des [Action]/[Reaction] ou passer.`)
    }
  } else if (state.turnPlayer === me) {
    if (state.pendingCombat.length > 0) {
      hints.push('⚔️ Des unités ennemies et alliées partagent un champ de bataille : lance le combat (bouton rouge).')
    } else {
      const readyRunes = my.runes.filter((r) => r.ready).length
      if (readyRunes > 0 && my.pool.energy === 0)
        hints.push('💠 Clique tes runes : ⚡ engager = 1 énergie (coût chiffré des cartes), ◆ recycler = 1 puissance (symboles colorés). La réserve se vide en fin de tour — dépense-la !')
      hints.push("🃏 Clique une carte de ta main pour la jouer (les unités arrivent engagées, à la base ou sur un champ de bataille que tu contrôles).")
      if (state.units.some((u) => u.controller === me && u.ready && u.location === 'base'))
        hints.push('⚔️ Clique une unité redressée puis un champ de bataille pour la déplacer. Contrôler un champ de bataille = 1 point à la Conquête, puis 1 point à chaque début de ton tour (Tenue). Premier à 8 points gagne !')
      hints.push('⏭️ Quand tu as fini : Fin de tour.')
    }
  } else {
    hints.push(`⏳ Tour de ${opp.name}. Tu pourras réagir avec des cartes [Reaction] si une chaîne ou un showdown s'ouvre.`)
  }

  // Compact: one primary line always visible; the rest revealed on hover.
  return (
    <div className={`hint-box ${hints.length > 1 ? 'expandable' : ''}`}>
      <div className="hint-primary">💡 {hints[0]}</div>
      {hints.slice(1).map((h, i) => (
        <div className="hint-more" key={i}>
          {h}
        </div>
      ))}
    </div>
  )
}
