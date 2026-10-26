import { describe, expect, it } from 'vitest'
import { exampleVisitors as visitors } from '../data/visitors.fixture'
import { addRememberedName, isRemembered, toRememberedVisitors } from './memory'
import { classifySubmission, findUniqueVisitor } from './recognition'

describe('addRememberedName', () => {
  it('stores a trimmed new name', () => {
    expect(addRememberedName([], '  Night   Signal ', visitors)).toEqual(['Night Signal'])
  })

  it('ignores blanks, seeded names, aliases, and repeats', () => {
    expect(addRememberedName([], '   ', visitors)).toEqual([])
    expect(addRememberedName([], 'ASTER', visitors)).toEqual([])
    expect(addRememberedName([], 'slate', visitors)).toEqual([])
    expect(addRememberedName(['Night'], 'NIGHT', visitors)).toEqual(['Night'])
  })
})

describe('remembered visitors', () => {
  it('are recognized on a later visit', () => {
    const all = [...visitors, ...toRememberedVisitors(['Night'])]
    const match = findUniqueVisitor('nig', all)
    expect(match?.name).toBe('Night')
    expect(match && isRemembered(match)).toBe(true)
    expect(classifySubmission('Night', all)).toMatchObject({ kind: 'known' })
  })
})
