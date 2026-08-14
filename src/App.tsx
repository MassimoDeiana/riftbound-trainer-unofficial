import { useEffect, useRef, useState } from 'react'
import { botAction } from './ai/bot'
import { importCollectionCsv, loadCollection, saveCollection, type Collection } from './data/collection'
import { addStarterDecks, loadDecks, validateDeck, type Deck } from './data/decks'
import { STARTER_DECKS } from './data/starterDecks'
import { applyAction, IllegalAction } from './engine/reducer'
import { createGame } from './engine/setup'
import type { GameAction, GameConfig, GameState, PlayerIx } from './engine/types'
import {
  archiveGame,
  deleteSavedGame,
  exportGame,
  listSavedGames,
  loadCurrentSolo,
  makeGameId,
  parseImportedGame,
  replayStates,
  saveCurrentSolo,
  type GameRecord,
} from './game/history'
import { joinGameRoom, makeRoomCode, type GameRoom } from './net/room'
import { CardPreview } from './ui/CardPreview'
import { DeckBuilder } from './ui/DeckBuilder'
import { GameTable } from './ui/GameTable'

type View = 'home' | 'decks' | 'games' | 'game'

/** Local solo / review game with a full replayable history and a time-travel cursor. */
interface SoloHist {
  config: GameConfig
  log: GameAction[]
  states: GameState[]
  cursor: number
  mode: 'play' | 'review'
  id: string
  name: string
}

type SyncMsg =
  | { kind: 'hello'; name: string; deck: Deck }
  | { kind: 'init'; config: GameConfig }
  | { kind: 'reqstate' }
  | { kind: 'state'; state: GameState }

export default function App() {
  const [view, setView] = useState<View>('home')
  const [collection, setCollection] = useState<Collection>(loadCollection)
  const [name, setName] = useState(() => localStorage.getItem('rb.name') ?? '')
  const [decks, setDecks] = useState<Deck[]>(() => {
    // Preload the official precon decks (bump the version when new ones are added)
    const SEED_VERSION = '3'
    if (localStorage.getItem('rb.startersSeeded') !== SEED_VERSION) {
      localStorage.setItem('rb.startersSeeded', SEED_VERSION)
      return addStarterDecks(STARTER_DECKS)
    }
    return loadDecks()
  })
  const [deckId, setDeckId] = useState<string>(() => localStorage.getItem('rb.lastDeck') ?? '')
  const [joinCode, setJoinCode] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [game, setGame] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [peerConnected, setPeerConnected] = useState(false)
  const [soloHist, setSoloHist] = useState<SoloHist | null>(null)
  const [botDeckId, setBotDeckId] = useState('starter-jinx')
  const [savedGames, setSavedGames] = useState<GameRecord[]>(listSavedGames)

  const roomRef = useRef<GameRoom | null>(null)
  const meRef = useRef<PlayerIx>(0)
  const gameRef = useRef<GameState | null>(null)
  gameRef.current = game

  // The board currently shown (solo/review = the state at the cursor; online = the live state).
  const displayGame = soloHist ? soloHist.states[soloHist.cursor] : game

  // Live coach bridge (dev only): push the current board to the Vite middleware
  // so it can be read from the terminal on demand. No-op in production builds.
  useEffect(() => {
    if (!import.meta.env.DEV || !displayGame) return
    const payload = JSON.stringify({
      at: new Date().toISOString(),
      me: meRef.current,
      mode: soloHist ? soloHist.mode : 'online',
      state: displayGame,
    })
    fetch('/__coach', { method: 'POST', body: payload }).catch(() => {})
  }, [displayGame, soloHist])

  useEffect(() => {
    if (view === 'home') setDecks(loadDecks())
  }, [view])

  useEffect(() => {
    localStorage.setItem('rb.name', name)
  }, [name])
  useEffect(() => {
    localStorage.setItem('rb.lastDeck', deckId)
  }, [deckId])

  const myDeck = decks.find((d) => d.id === deckId)
  const validDecks = decks.filter((d) => validateDeck(d).length === 0)
  const botDecks = [...STARTER_DECKS, ...validDecks.filter((d) => !d.id.startsWith('starter-'))]

  // Solo dispatch: append to the replayable log (deterministic time-travel).
  // Acting while rewound truncates the "redo" tail and starts a new line.
  const soloDispatch = (action: GameAction) => {
    setError(null)
    setSoloHist((h) => {
      if (!h || h.mode === 'review') return h
      let { log, states } = h
      const cursor = h.cursor
      let next: GameState
      try {
        next = applyAction(states[cursor], action)
      } catch (e) {
        if (e instanceof IllegalAction) setError(e.message)
        else console.error(e)
        return h
      }
      if (cursor < log.length) {
        log = log.slice(0, cursor)
        states = states.slice(0, cursor + 1)
      }
      return { ...h, log: [...log, action], states: [...states, next], cursor: cursor + 1 }
    })
  }

  const seek = (k: number) =>
    setSoloHist((h) => (h ? { ...h, cursor: Math.max(0, Math.min(h.log.length, k)) } : h))

  // Solo mode: bot plays only at the live end (paused while rewound / reviewing).
  useEffect(() => {
    if (!soloHist || soloHist.mode !== 'play') return
    if (soloHist.cursor !== soloHist.log.length) return
    const g = soloHist.states[soloHist.cursor]
    if (g.winner !== null) return
    const a = botAction(g, 1)
    if (!a) return
    const t = setTimeout(() => soloDispatch(a), 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloHist])

  // Auto-save the current solo game; archive it once finished.
  useEffect(() => {
    if (!soloHist || soloHist.mode !== 'play') return
    saveCurrentSolo(soloHist.config, soloHist.log)
    const finalState = soloHist.states[soloHist.log.length]
    if (finalState.winner !== null) {
      const winnerName = soloHist.config.names[finalState.winner]
      setSavedGames(
        archiveGame({
          id: soloHist.id,
          name: soloHist.name,
          savedAt: new Date().toISOString(),
          config: soloHist.config,
          log: soloHist.log,
          result: `🏆 ${winnerName} · ${finalState.turn} tours`,
        })
      )
    }
  }, [soloHist])

  const startSolo = () => {
    if (!myDeck) return
    const botDeck = botDecks.find((d) => d.id === botDeckId) ?? STARTER_DECKS[0]
    const config: GameConfig = {
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
      decks: [myDeck, botDeck],
      names: [name || 'Toi', `🤖 ${botDeck.name}`],
      first: (crypto.getRandomValues(new Uint8Array(1))[0] % 2) as PlayerIx,
    }
    meRef.current = 0
    setGame(null)
    setSoloHist({
      config,
      log: [],
      states: [createGame(config)],
      cursor: 0,
      mode: 'play',
      id: makeGameId(),
      name: `${config.names[0]} vs ${config.names[1]}`,
    })
    setView('game')
    setStatus(null)
  }

  const openReview = (config: GameConfig, log: GameAction[], name: string, v: 1 | 2 = 2) => {
    meRef.current = 0
    setGame(null)
    setSoloHist({
      config,
      log,
      states: replayStates(config, log, v),
      cursor: log.length,
      mode: 'review',
      id: makeGameId(),
      name,
    })
    setView('game')
  }

  const importGameFile = (file: File) => {
    file.text().then((text) => {
      try {
        const { config, log, name, v } = parseImportedGame(text)
        openReview(config, log, name ?? 'Partie importée', v ?? 1)
      } catch (e) {
        alert('Import impossible : ' + (e instanceof Error ? e.message : 'fichier invalide'))
      }
    })
  }

  const downloadCurrentGame = () => {
    if (!soloHist) return
    const blob = new Blob([exportGame(soloHist)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${soloHist.name.replace(/[^a-z0-9]+/gi, '-')}.riftbound.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const setupRoom = (room: GameRoom, host: boolean, deck: Deck) => {
    roomRef.current = room
    meRef.current = host ? 0 : 1

    room.onPeerJoin(() => {
      setPeerConnected(true)
      setStatus(host ? 'Adversaire connecté — échange des decks…' : 'Connecté — envoi du deck…')
      if (!host) {
        room.sendSync({ kind: 'hello', name: name || 'Invité', deck } satisfies SyncMsg)
      }
    })
    room.onPeerLeave(() => {
      setPeerConnected(false)
      setStatus("L'adversaire s'est déconnecté (il peut revenir avec le même code).")
    })
    room.onSync((raw) => {
      const msg = raw as SyncMsg
      if (msg.kind === 'hello' && host) {
        const config: GameConfig = {
          seed: crypto.getRandomValues(new Uint32Array(1))[0],
          decks: [deck, msg.deck],
          names: [name || 'Hôte', msg.name],
          first: (crypto.getRandomValues(new Uint8Array(1))[0] % 2) as PlayerIx,
        }
        room.sendSync({ kind: 'init', config } satisfies SyncMsg)
        setGame(createGame(config))
        setView('game')
        setStatus(null)
      } else if (msg.kind === 'init' && !host) {
        setGame(createGame(msg.config))
        setView('game')
        setStatus(null)
      } else if (msg.kind === 'reqstate') {
        if (gameRef.current) room.sendSync({ kind: 'state', state: gameRef.current } satisfies SyncMsg)
      } else if (msg.kind === 'state') {
        setGame(msg.state)
        setError(null)
      }
    })
    room.onAction((raw) => {
      const action = raw as GameAction
      setGame((g) => {
        if (!g) return g
        try {
          return applyAction(g, action)
        } catch (e) {
          console.error('Remote action failed', e, action)
          return g
        }
      })
    })
  }

  const createRoom = () => {
    if (!myDeck) return
    const code = makeRoomCode()
    setStatus(`Partie créée. Code : ${code} — en attente de l'adversaire…`)
    setupRoom(joinGameRoom(code), true, myDeck)
    roomRef.current!.code = code
  }

  const joinRoom_ = () => {
    if (!myDeck || joinCode.trim().length < 4) return
    setStatus(`Connexion à ${joinCode.toUpperCase()}…`)
    setupRoom(joinGameRoom(joinCode.trim()), false, myDeck)
  }

  const dispatch = (action: GameAction) => {
    setError(null)
    setGame((g) => {
      if (!g) return g
      try {
        const next = applyAction(g, action)
        roomRef.current?.sendAction(action)
        return next
      } catch (e) {
        if (e instanceof IllegalAction) setError(e.message)
        else console.error(e)
        return g
      }
    })
  }

  const leave = () => {
    roomRef.current?.leave()
    roomRef.current = null
    setGame(null)
    setSoloHist(null)
    setView('home')
    setStatus(null)
    setPeerConnected(false)
  }

  const importCsv = (file: File) => {
    file.text().then((text) => {
      const res = importCollectionCsv(text, { ...collection })
      setCollection(res.collection)
      saveCollection(res.collection)
      alert(
        `Import terminé : ${res.matched} lignes importées.` +
          (res.unmatched.length ? `\nNon reconnues (${res.unmatched.length}) : ${res.unmatched.slice(0, 10).join(', ')}…` : '')
      )
    })
  }

  if (view === 'game' && displayGame) {
    return (
      <>
        <CardPreview />
        <GameTable
          state={displayGame}
          me={meRef.current}
          dispatch={soloHist ? soloDispatch : dispatch}
          error={error}
          roomCode={soloHist ? (soloHist.mode === 'review' ? 'REVUE 🎬' : 'SOLO 🤖') : (roomRef.current?.code ?? '—')}
          onLeave={leave}
          onResync={() => roomRef.current?.sendSync({ kind: 'reqstate' } satisfies SyncMsg)}
          timeTravel={
            soloHist
              ? {
                  cursor: soloHist.cursor,
                  total: soloHist.log.length,
                  review: soloHist.mode === 'review',
                  onSeek: seek,
                  onExport: downloadCurrentGame,
                }
              : undefined
          }
        />
      </>
    )
  }

  return (
    <div>
      <CardPreview />
      <div className="topbar">
        <h1>RIFTBOUND — Table en ligne</h1>
        <nav>
          <button className={view === 'home' ? 'primary' : ''} onClick={() => setView('home')}>
            Jouer
          </button>
          <button className={view === 'decks' ? 'primary' : ''} onClick={() => setView('decks')}>
            Decks
          </button>
          <button className={view === 'games' ? 'primary' : ''} onClick={() => setView('games')}>
            Parties {savedGames.length > 0 && `(${savedGames.length})`}
          </button>
        </nav>
      </div>

      {view === 'decks' && <DeckBuilder collection={collection} />}

      {view === 'games' && (
        <div style={{ maxWidth: 720, margin: '30px auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
          <h2>Parties enregistrées</h2>
          <p className="dim" style={{ fontSize: 14, margin: 0 }}>
            Tes parties solo terminées sont sauvegardées ici. Ouvre-les pour les revoir coup par coup (⏮ ◀ ▶ ⏭), ou importe un fichier de partie.
          </p>
          <div>
            <label className="dock-btn" style={{ display: 'inline-block', cursor: 'pointer' }}>
              📂 Importer un fichier
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importGameFile(f)
                  e.target.value = ''
                }}
              />
            </label>
            {loadCurrentSolo() && (
              <button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  const c = loadCurrentSolo()!
                  openReview(c.config, c.log, 'Dernière partie solo')
                }}
              >
                🎬 Revoir la dernière partie en cours
              </button>
            )}
          </div>
          {savedGames.length === 0 && <div className="dim">Aucune partie enregistrée pour l'instant.</div>}
          {savedGames.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{g.name}</strong>
                <div className="dim" style={{ fontSize: 13 }}>
                  {g.result ?? `${g.log.length} actions`} · {new Date(g.savedAt).toLocaleString('fr-FR')}
                </div>
              </div>
              <button className="primary" onClick={() => openReview(g.config, g.log, g.name, g.v)}>
                Revoir
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([exportGame(g)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${g.name.replace(/[^a-z0-9]+/gi, '-')}.riftbound.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Exporter
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`Supprimer « ${g.name} » ?`)) setSavedGames(deleteSavedGame(g.id))
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'home' && (
        <div style={{ maxWidth: 620, margin: '40px auto', display: 'flex', flexDirection: 'column', gap: 18, padding: '0 16px' }}>
          <label>
            Ton pseudo
            <input style={{ display: 'block', width: '100%', marginTop: 4 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Massimo" />
          </label>

          <label>
            Ton deck (valide uniquement)
            <select style={{ display: 'block', width: '100%', marginTop: 4 }} value={deckId} onChange={(e) => setDeckId(e.target.value)}>
              <option value="">— choisir un deck —</option>
              {validDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {decks.length === 0 && (
              <span className="dim">
                Aucun deck : va dans l'onglet <strong>Decks</strong> pour en créer un.
              </span>
            )}
            {decks.length > 0 && validDecks.length === 0 && (
              <span className="dim">Aucun deck légal pour l'instant (voir la validation dans l'éditeur).</span>
            )}
          </label>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="primary" disabled={!myDeck || !name} onClick={createRoom}>
              Créer une partie
            </button>
            <span className="dim">ou</span>
            <input placeholder="CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} style={{ width: 110, textTransform: 'uppercase' }} />
            <button disabled={!myDeck || !name || joinCode.length < 4} onClick={joinRoom_}>
              Rejoindre
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <strong>Mode solo</strong>
            <select value={botDeckId} onChange={(e) => setBotDeckId(e.target.value)}>
              {botDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  Deck de l'IA : {d.name}
                </option>
              ))}
            </select>
            <button className="primary" disabled={!myDeck} onClick={startSolo}>
              🤖 Jouer contre l'IA
            </button>
            <span className="dim" style={{ fontSize: 13, width: '100%' }}>
              L'IA applique toutes les règles mais ne joue pas de sorts : ses déclencheurs se résolvent sans effet (le journal les affiche).
            </span>
          </div>

          {status && (
            <div className="banner">
              {status} {peerConnected ? '🟢' : '🟠'}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', width: '100%' }} />

          <div>
            <h3>Ma collection ({Object.values(collection).reduce((a, b) => a + b, 0)} cartes)</h3>
            <p className="dim" style={{ fontSize: 14 }}>
              Exporte ta collection depuis riftbound.gg (My Collection → Export CSV) puis importe le fichier ici. Le deck builder affichera ce que tu possèdes.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importCsv(f)
                e.target.value = ''
              }}
            />
            {Object.keys(collection).length > 0 && (
              <button
                className="small danger"
                style={{ marginLeft: 10 }}
                onClick={() => {
                  if (confirm('Vider la collection importée ?')) {
                    setCollection({})
                    saveCollection({})
                  }
                }}
              >
                Vider
              </button>
            )}
          </div>

          <p className="dim" style={{ fontSize: 13 }}>
            Projet non officiel entre amis. Riftbound et ses visuels appartiennent à Riot Games. Images servies par le CDN officiel ; données de cartes par
            l'API communautaire Riftcodex.
          </p>
        </div>
      )}
    </div>
  )
}
