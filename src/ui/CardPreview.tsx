import { useEffect, useState } from 'react'
import { textify, type CardDef } from '../data/cards'

/** Fixed-position large preview of the currently hovered card (never intercepts clicks). */
export function CardPreview() {
  const [card, setCard] = useState<CardDef | null>(null)

  useEffect(() => {
    const on = (e: Event) => setCard((e as CustomEvent<CardDef | null>).detail)
    window.addEventListener('rb-card-hover', on)
    return () => window.removeEventListener('rb-card-hover', on)
  }, [])

  if (!card) return null
  return (
    <div className="card-preview">
      {card.image ? (
        <img src={card.image} alt={card.name} />
      ) : (
        <div className="card-preview-fallback">
          <strong>{card.name}</strong>
          <div>{textify(card.text)}</div>
        </div>
      )}
      <div className="card-preview-text">{textify(card.text)}</div>
    </div>
  )
}
