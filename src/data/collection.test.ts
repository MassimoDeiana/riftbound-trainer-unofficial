import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { importCollectionCsv } from './collection'

describe('collection CSV import (riftbound.gg format)', () => {
  it('sums Normal + Foil, matches by CardId, skips zero rows', () => {
    const csv = [
      'CardId,Normal,Foil,Name,Set',
      '"OGN-001",3,0,"Blazing Scorcher","Origins"',
      '"OGN-004",0,1,"Cleave","Origins"',
      '"OGN-010",2,1,"Legion Rearguard","Origins"',
      '"OGN-175",0,0,"Shipyard Skulker","Origins"', // not owned -> skipped
      '"ZZZ-999",2,0,"Carte Inconnue","Mystère"', // unknown id AND name -> unmatched
    ].join('\n')
    const res = importCollectionCsv(csv)
    expect(res.collection['ogn-001-298']).toBe(3)
    expect(res.collection['ogn-004-298']).toBe(1) // foil counts
    expect(res.collection['ogn-010-298']).toBe(3) // 2 normal + 1 foil
    expect(res.collection['ogn-175-298']).toBeUndefined()
    expect(res.matched).toBe(3)
    expect(res.unmatched).toEqual(['Carte Inconnue'])
  })

  it('still supports generic name/quantity formats', () => {
    const csv = ['Quantity,Name', '2,Cleave', '1,Shipyard Skulker'].join('\n')
    const res = importCollectionCsv(csv)
    expect(res.matched).toBe(2)
    expect(Object.values(res.collection).reduce((a, b) => a + b, 0)).toBe(3)
  })

  const realFile = '/Users/massimodeiana/Downloads/collection.csv'
  it.skipIf(!existsSync(realFile))('imports the real riftbound.gg export without unmatched rows', () => {
    const res = importCollectionCsv(readFileSync(realFile, 'utf8'))
    console.log(
      `real export: ${res.matched} lignes importées, ${Object.values(res.collection).reduce((a, b) => a + b, 0)} cartes, non reconnues: ${res.unmatched.length}`,
      res.unmatched.slice(0, 10)
    )
    expect(res.matched).toBeGreaterThan(100)
    expect(res.unmatched).toEqual([])
  })
})
