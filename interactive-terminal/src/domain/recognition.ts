import type { Visitor } from '../data/visitors'

export const MIN_RECOGNITION_LENGTH = 3

export type SubmissionDecision =
  | { kind: 'known'; visitor: Visitor }
  | { kind: 'ambiguous' }
  | { kind: 'unknown' }

export function normalizeIdentity(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US')
}

export function findMatchingVisitors(input: string, visitors: Visitor[]): Visitor[] {
  const query = normalizeIdentity(input)
  if (query.length < MIN_RECOGNITION_LENGTH) return []

  return visitors.filter((visitor) =>
    [visitor.name, ...visitor.aliases].some((identity) =>
      normalizeIdentity(identity).startsWith(query),
    ),
  )
}

export function findUniqueVisitor(input: string, visitors: Visitor[]): Visitor | null {
  const matches = findMatchingVisitors(input, visitors)
  return matches.length === 1 ? matches[0] : null
}

export function classifySubmission(input: string, visitors: Visitor[]): SubmissionDecision {
  const matches = findMatchingVisitors(input, visitors)
  if (matches.length === 1) return { kind: 'known', visitor: matches[0] }
  if (matches.length > 1) return { kind: 'ambiguous' }
  return { kind: 'unknown' }
}
