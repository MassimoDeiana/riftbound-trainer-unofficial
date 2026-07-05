import { useState } from 'react'
import { DOMAIN_COLORS, type CardDef } from '../data/cards'

export function announceHover(card: CardDef | null) {
  window.dispatchEvent(new CustomEvent('rb-card-hover', { detail: card }))
}

/** Card image with graceful text fallback; hovering shows the fixed preview panel.
 *  `crop` (0..1) shows only the top fraction of the card — art + cost + name, hiding
 *  the rules-text half. Full card is always visible in the hover preview panel. */
export function CardImg({
  card,
  width = 110,
  zoom = true,
  onClick,
  selected,
  dimmed,
  badge,
  crop,
}: {
  card: CardDef
  width?: number
  zoom?: boolean
  onClick?: () => void
  selected?: boolean
  dimmed?: boolean
  badge?: string
  crop?: number
}) {
  const [failed, setFailed] = useState(false)
  const fullHeight = Math.round(width * 1.4)
  const height = crop ? Math.round(fullHeight * crop) : fullHeight
  return (
    <div
      className={`cardimg ${selected ? 'selected' : ''} ${crop ? 'cropped' : ''}`}
      style={{ width, height, opacity: dimmed ? 0.45 : 1 }}
      onClick={onClick}
      onMouseEnter={zoom ? () => announceHover(card) : undefined}
      onMouseLeave={zoom ? () => announceHover(null) : undefined}
    >
      {card.image && !failed ? (
        <img
          className="card-thumb"
          src={card.image}
          alt={card.name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width, height: fullHeight, objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <div className="card-fallback" style={{ width, height: fullHeight }}>
          <div style={{ fontWeight: 600, fontSize: 11 }}>{card.name}</div>
          <div style={{ fontSize: 9 }}>
            {card.energy !== null && <span>⚡{card.energy} </span>}
            {card.might !== null && <span>⚔️{card.might}</span>}
          </div>
          {!crop && <div style={{ fontSize: 8, overflow: 'hidden' }}>{card.text}</div>}
        </div>
      )}
      {!crop && (
        <div className="card-domains">
          {card.domains.map((d) => (
            <span key={d} className="domain-dot" style={{ background: DOMAIN_COLORS[d] }} />
          ))}
        </div>
      )}
      {badge && <div className="card-badge">{badge}</div>}
    </div>
  )
}
