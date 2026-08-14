// Token definitions used by the `playToken` effect op.
// Tokens exist only on the board (rule 177): when they leave it, they cease
// to exist (handled in the engine cleanup via UnitEntity.isToken).
export interface TokenDef {
  cardId: string // printed token card (art/frame) from cards.json
  name: string
  kind: 'unit' | 'gear'
}

export const TOKENS: Record<string, TokenDef> = {
  recruit: { cardId: 'ogn-271-298', name: 'Recruit', kind: 'unit' },
  sprite: { cardId: 'ogn-274-298', name: 'Sprite', kind: 'unit' },
  gold: { cardId: 'sfd-t03', name: 'Gold', kind: 'gear' },
  mech: { cardId: 'tok-mech', name: 'Mech', kind: 'unit' },
  sandsoldier: { cardId: 'tok-sandsoldier', name: 'Sand Soldier', kind: 'unit' },
  bird: { cardId: 'tok-bird', name: 'Bird', kind: 'unit' },
}
