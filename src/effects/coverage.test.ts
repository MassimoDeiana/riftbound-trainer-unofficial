import { describe, expect, it } from 'vitest'
import { coverage } from './registry'

// Set gates: every card of a completed set must be scripted (or explicitly
// vanilla/manual). Extend the list as milestones land: M2 OGN+OGS, M3 SFD, M4 all.
const COMPLETED_SETS = ['OGN', 'OGS', 'SFD', 'UNL', 'OPP', 'PR', 'JDG']

describe('effect-script coverage', () => {
  it(`covers every card of: ${COMPLETED_SETS.join(', ')}`, () => {
    const { missing } = coverage()
    const gaps = missing.filter((id) => COMPLETED_SETS.includes(id.split('-')[0].toUpperCase()))
    expect(gaps).toEqual([])
  })
})
