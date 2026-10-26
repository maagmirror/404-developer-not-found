import { describe, expect, it } from 'vitest'
import { addPick, pickPair } from './survivorPicks'

describe('pickPair', () => {
  it('picks two different people and never the visitor', () => {
    for (let i = 0; i < 200; i += 1) {
      const [a, b] = pickPair(['Aster', 'Boreal', 'Ember', 'Ricardo'], 'ricardo')
      expect(a).not.toBe(b)
      expect([a, b]).not.toContain('Ricardo')
    }
  })
})

describe('addPick', () => {
  it('counts by normalized name', () => {
    expect(addPick(addPick({}, 'Ástér'), 'aster')).toEqual({ aster: 2 })
  })
})
