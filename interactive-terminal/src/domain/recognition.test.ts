import { describe, expect, it } from 'vitest'
import { visitors } from '../data/visitors'
import {
  classifySubmission,
  findMatchingVisitors,
  findUniqueVisitor,
  normalizeIdentity,
} from './recognition'

describe('normalizeIdentity', () => {
  it('normalizes case, accents, and unnecessary whitespace', () => {
    expect(normalizeIdentity('  MÁR   BLE  ')).toBe('mar ble')
    expect(normalizeIdentity('BÓREAL')).toBe('boreal')
  })
})

describe('visitor recognition', () => {
  it('does not recognize fewer than three normalized characters', () => {
    expect(findMatchingVisitors(' ma ', visitors)).toEqual([])
  })

  it('keeps a shared prefix ambiguous', () => {
    expect(findMatchingVisitors('mar', visitors).map(({ name }) => name)).toEqual([
      'Marble',
      'Marrow',
    ])
    expect(findUniqueVisitor('mar', visitors)).toBeNull()
  })

  it.each([
    ['marb', 'Marble'],
    ['marr', 'Marrow'],
    ['slat', 'Marble'],
    ['veil', 'Marrow'],
  ])('recognizes %s as %s', (input, expected) => {
    expect(findUniqueVisitor(input, visitors)?.name).toBe(expected)
  })

  it('returns no unique visitor for an unknown identity', () => {
    expect(findUniqueVisitor('nobody', visitors)).toBeNull()
    expect(findMatchingVisitors('nobody', visitors)).toEqual([])
  })

  it('classifies ambiguous submission separately from unknown submission', () => {
    expect(classifySubmission('mar', visitors)).toEqual({ kind: 'ambiguous' })
    expect(classifySubmission('nobody', visitors)).toEqual({ kind: 'unknown' })
    expect(classifySubmission('marb', visitors)).toEqual({
      kind: 'known',
      visitor: visitors[2],
    })
  })
})
