import { describe, expect, it } from 'vitest'
import { exampleVisitors as visitors } from '../data/visitors.fixture'
import {
  classifySubmission,
  findConfidentVisitor,
  findTypingMatch,
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

describe('findConfidentVisitor', () => {
  const people = [...visitors, { id: 'ricardo', name: 'Ricardo Rodriguez', aliases: ['Richi'] }]

  it('accepts a full name, alias, or first name written in full', () => {
    expect(findConfidentVisitor('  MÁRBLE ', people)?.name).toBe('Marble')
    expect(findConfidentVisitor('veil', people)?.name).toBe('Marrow')
    expect(findConfidentVisitor('ricardo', people)?.name).toBe('Ricardo Rodriguez')
    expect(findConfidentVisitor('ricardo rodriguez', people)?.name).toBe('Ricardo Rodriguez')
  })

  it('tolerates one typo on longer names', () => {
    expect(findConfidentVisitor('marbke', people)?.name).toBe('Marble')
    expect(findConfidentVisitor('ricardo rodrigez', people)?.name).toBe('Ricardo Rodriguez')
  })

  it('rejects partial or doubtful input', () => {
    expect(findConfidentVisitor('marb', people)).toBeNull()
    expect(findConfidentVisitor('ric', people)).toBeNull()
    expect(findConfidentVisitor('nobody', people)).toBeNull()
  })
})

describe('findTypingMatch', () => {
  const people = [
    { id: 'martin', name: 'Martín', aliases: [] },
    { id: 'marcos', name: 'Marcos', aliases: [] },
    { id: 'alexander', name: 'Alexander Pérez', aliases: ['Alex'] },
  ]

  it('never guesses from too few letters or a shared start', () => {
    expect(findTypingMatch('ma', people)).toBeNull()
    expect(findTypingMatch('mar', people)).toBeNull()
    expect(findTypingMatch('manu', people)).toBeNull()
    // MARTA must not be taken for MARTÍN.
    expect(findTypingMatch('mart', people)).toBeNull()
  })

  it('guesses once the start points to one person', () => {
    expect(findTypingMatch('marti', people)?.id).toBe('martin')
    expect(findTypingMatch('marco', people)?.id).toBe('marcos')
    expect(findTypingMatch('alex', people)?.id).toBe('alexander')
  })

  it('needs enough of a long name', () => {
    const solo = [{ id: 'alexander', name: 'Alexander', aliases: [] }]
    expect(findTypingMatch('alex', solo)).toBeNull()
    expect(findTypingMatch('alexan', solo)).toBeNull()
    expect(findTypingMatch('alexand', solo)?.id).toBe('alexander')
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
