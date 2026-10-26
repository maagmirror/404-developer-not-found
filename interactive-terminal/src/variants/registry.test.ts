import { describe, expect, it } from 'vitest'
import { createVariantPicker, pinnedVariantFromUrl, variants } from './registry'

describe('createVariantPicker', () => {
  it('plays every variant once per round without back-to-back repeats', () => {
    const pick = createVariantPicker()
    const history = Array.from({ length: variants.length * 20 }, pick)

    for (let round = 0; round < 20; round += 1) {
      const slice = history.slice(round * variants.length, (round + 1) * variants.length)
      expect(new Set(slice).size).toBe(variants.length)
    }
    history.slice(1).forEach((id, index) => expect(id).not.toBe(history[index]))
  })
})

describe('pinnedVariantFromUrl', () => {
  it('accepts known ids only', () => {
    expect(pinnedVariantFromUrl('?v=cuenta')).toBe('cuenta')
    expect(pinnedVariantFromUrl('?v=nope')).toBeNull()
    expect(pinnedVariantFromUrl('')).toBeNull()
  })
})
