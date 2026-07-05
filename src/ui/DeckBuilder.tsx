import { useMemo, useState } from 'react'
import {
  allCards,
  DOMAIN_COLORS,
  DOMAINS,
  searchCards,
  SETS,
  type CardDef,
  type CardType,
  type Domain,
} from '../data/cards'
import type { Collection } from '../data/collection'
import {
  addStarterDecks,
  cardsIn,
  deckDomains,
  loadDecks,
  mainDeckCount,
  newDeck,
  runeCount,
  saveDecks,
  validateDeck,
  type Deck,
} from '../data/decks'
import { STARTER_DECKS } from '../data/starterDecks'
import { CardImg } from './CardImg'

const TYPES: CardType[] = ['Unit', 'Spell', 'Gear', 'Rune', 'Legend', 'Battlefield']

export function DeckBuilder({ collection }: { collection: Collection }) {
  const [decks, setDecks] = useState<Deck[]>(loadDecks)
  const [editingId, setEditingId] = useState<string | null>(null)

  const persist = (next: Deck[]) => {
    setDecks(next)
    saveDecks(next)
  }

  const editing = decks.find((d) => d.id === editingId)
  if (editing) {
    return (
      <DeckEditor
        deck={editing}
        collection={collection}
        onChange={(d) => persist(decks.map((x) => (x.id === d.id ? d : x)))}
        onBack={() => setEditingId(null)}
      />
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h2>Mes decks</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {decks.map((d) => {
          const problems = validateDeck(d)
          return (
            <div
              key={d.id}
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
                <strong>{d.name}</strong>{' '}
                <span className="dim">
                  {mainDeckCount(d)} cartes · {runeCount(d)} runes · {d.battlefieldIds.length} CdB
                </span>
                <div>
                  {deckDomains(d).map((dom) => (
                    <span key={dom} className="domain-dot" style={{ background: DOMAIN_COLORS[dom] }} />
                  ))}
                  {problems.length === 0 ? (
                    <span className="badge" style={{ borderColor: 'var(--accent2)', color: 'var(--accent2)' }}>
                      ✓ légal
                    </span>
                  ) : (
                    <span className="badge" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                      {problems.length} problème(s)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditingId(d.id)}>Éditer</button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`Supprimer le deck « ${d.name} » ?`)) persist(decks.filter((x) => x.id !== d.id))
                }}
              >
                Supprimer
              </button>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          className="primary"
          onClick={() => {
            const name = prompt('Nom du deck ?', `Deck ${decks.length + 1}`)
            if (!name) return
            const d = newDeck(name)
            persist([...decks, d])
            setEditingId(d.id)
          }}
        >
          + Nouveau deck
        </button>
        <button
          title="Recharge les 4 decks officiels Proving Grounds (Annie, Lux, Garen, Master Yi)"
          onClick={() => setDecks(addStarterDecks(STARTER_DECKS))}
        >
          + Decks de démarrage officiels
        </button>
      </div>
    </div>
  )
}

function DeckEditor({
  deck,
  collection,
  onChange,
  onBack,
}: {
  deck: Deck
  collection: Collection
  onChange: (d: Deck) => void
  onBack: () => void
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<CardType | ''>('')
  const [domain, setDomain] = useState<Domain | ''>('')
  const [set, setSet] = useState('')
  const [ownedOnly, setOwnedOnly] = useState(false)

  const hasCollection = Object.keys(collection).length > 0
  const identity = new Set(deckDomains(deck))

  const results = useMemo(() => {
    let cards = allCards
    if (type) cards = cards.filter((c) => c.type === type)
    if (domain) cards = cards.filter((c) => c.domains.includes(domain))
    if (set) cards = cards.filter((c) => c.set === set)
    if (ownedOnly) cards = cards.filter((c) => (collection[c.id] ?? 0) > 0)
    return searchCards(query, cards).slice(0, 60)
  }, [query, type, domain, set, ownedOnly, collection])

  const problems = validateDeck(deck)

  const add = (card: CardDef) => {
    const d = structuredClone(deck)
    if (card.type === 'Legend') {
      d.legendId = card.id
    } else if (card.type === 'Battlefield') {
      if (d.battlefieldIds.includes(card.id)) return
      if (d.battlefieldIds.length >= 3) d.battlefieldIds.shift()
      d.battlefieldIds.push(card.id)
    } else if (card.type === 'Rune') {
      const total = runeCount(d)
      if (total >= 12) return
      d.runes[card.id] = (d.runes[card.id] ?? 0) + 1
    } else {
      const n = d.main[card.id] ?? 0
      if (n >= 3) return
      d.main[card.id] = n + 1
    }
    onChange(d)
  }

  const removeMain = (id: string, zone: 'main' | 'runes') => {
    const d = structuredClone(deck)
    const map = zone === 'main' ? d.main : d.runes
    if (!map[id]) return
    map[id] -= 1
    if (map[id] <= 0) delete map[id]
    if (d.championId === id && !d.main[id]) d.championId = null
    onChange(d)
  }

  const legend = deck.legendId ? allCards.find((c) => c.id === deck.legendId) : null

  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, height: 'calc(100vh - 60px)' }}>
      {/* Search pane */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Rechercher (nom, texte, tag)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <select value={type} onChange={(e) => setType(e.target.value as CardType | '')}>
            <option value="">Tous types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={domain} onChange={(e) => setDomain(e.target.value as Domain | '')}>
            <option value="">Tous domaines</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={set} onChange={(e) => setSet(e.target.value)}>
            <option value="">Tous sets</option>
            {SETS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {hasCollection && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} />
              Possédées
            </label>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 10,
            overflowY: 'auto',
            alignContent: 'start',
          }}
        >
          {results.map((c) => {
            const owned = collection[c.id] ?? 0
            const offIdentity =
              legend != null &&
              c.type !== 'Legend' &&
              c.type !== 'Battlefield' &&
              c.domains.some((d) => !identity.has(d))
            return (
              <div key={c.id} style={{ textAlign: 'center' }}>
                <CardImg
                  card={c}
                  width={120}
                  onClick={() => add(c)}
                  dimmed={offIdentity}
                  badge={hasCollection ? (owned > 0 ? `x${owned}` : '0') : undefined}
                />
                <button className="small" style={{ marginTop: 4 }} onClick={() => add(c)}>
                  + Ajouter
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deck pane */}
      <div
        style={{
          flex: 1,
          minWidth: 320,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 12,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack}>← Retour</button>
          <input
            value={deck.name}
            onChange={(e) => onChange({ ...deck, name: e.target.value })}
            style={{ flex: 1 }}
          />
        </div>

        <h4>
          Légende {legend ? `: ${legend.name}` : ''}{' '}
          {legend && (
            <button className="small danger" onClick={() => onChange({ ...deck, legendId: null })}>
              ✕
            </button>
          )}
        </h4>

        <h4>Champs de bataille ({deck.battlefieldIds.length}/3)</h4>
        {deck.battlefieldIds.map((id) => {
          const c = allCards.find((x) => x.id === id)!
          return (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>{c.name}</span>
              <button
                className="small danger"
                onClick={() =>
                  onChange({ ...deck, battlefieldIds: deck.battlefieldIds.filter((x) => x !== id) })
                }
              >
                ✕
              </button>
            </div>
          )
        })}

        <h4>
          Deck principal ({mainDeckCount(deck)}/40+) — champion :{' '}
          {deck.championId ? allCards.find((c) => c.id === deck.championId)?.name : 'aucun'}
        </h4>
        {cardsIn(deck.main).map(({ card, count }) => (
          <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <span style={{ width: 26 }}>{count}x</span>
            <span
              style={{ flex: 1, cursor: 'pointer' }}
              title={card.text}
              onClick={() => add(card)}
            >
              {card.energy !== null ? `(${card.energy}) ` : ''}
              {card.name}
              {deck.championId === card.id ? ' ⭐' : ''}
            </span>
            {card.supertype === 'Champion' && card.type === 'Unit' && (
              <button
                className="small"
                title="Définir comme Champion choisi"
                onClick={() => onChange({ ...deck, championId: card.id })}
              >
                ⭐
              </button>
            )}
            <button className="small danger" onClick={() => removeMain(card.id, 'main')}>
              −
            </button>
          </div>
        ))}

        <h4>Runes ({runeCount(deck)}/12)</h4>
        {cardsIn(deck.runes).map(({ card, count }) => (
          <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <span style={{ width: 26 }}>{count}x</span>
            <span style={{ flex: 1 }}>{card.name}</span>
            <button className="small" onClick={() => add(card)}>
              +
            </button>
            <button className="small danger" onClick={() => removeMain(card.id, 'runes')}>
              −
            </button>
          </div>
        ))}

        <h4>Validation</h4>
        {problems.length === 0 ? (
          <div style={{ color: 'var(--accent2)' }}>✓ Deck légal</div>
        ) : (
          <ul style={{ color: 'var(--danger)', paddingLeft: 18, margin: 0 }}>
            {problems.map((pr, i) => (
              <li key={i}>{pr.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
