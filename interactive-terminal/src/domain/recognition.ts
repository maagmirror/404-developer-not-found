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

/** Levenshtein distance, capped: anything above `max` is reported as `max + 1`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    previous = current
  }
  return Math.min(previous[b.length], max + 1)
}

/** Typos tolerated against a full name: one for names of 5+ letters, none for shorter ones. */
const allowedTypos = (identity: string) => (identity.length >= 5 ? 1 : 0)

/** Whether `query` is a near-certain reading of one identity (a name or an alias). */
function isConfidentMatch(query: string, identity: string): boolean {
  if (query === identity) return true
  // The first word(s) of a longer name, typed in full: "ricardo" for "ricardo rodriguez".
  if (identity.startsWith(`${query} `)) return true
  return editDistance(query, identity, allowedTypos(identity)) <= allowedTypos(identity)
}

/**
 * Near-certain recognition (the "Reconocimiento anticipado" bar): what was typed is someone's
 * full name or alias, their first name(s) written in full, or one of those with a single typo,
 * and it points to exactly one person.
 */
export function findConfidentVisitor(input: string, visitors: Visitor[]): Visitor | null {
  const query = normalizeIdentity(input)
  if (query.length < MIN_RECOGNITION_LENGTH) return null
  const matches = visitors.filter((visitor) =>
    [visitor.name, ...visitor.aliases].some((identity) => isConfidentMatch(query, normalizeIdentity(identity))),
  )
  return matches.length === 1 ? matches[0] : null
}

/** "Reconocimiento anticipado" never guesses from fewer letters than this ("MA" could be anyone). */
export const MIN_PREFIX_LETTERS = 4
/** ...nor from less than this share of the first word of the name it guesses ("MARTI" for MARTÍN). */
export const MIN_PREFIX_COVERAGE = 0.75

const letterCount = (value: string) => value.replace(/ /g, '').length

/**
 * Recognition while the visitor is still typing. It fires when either:
 * - what is typed is already a near-certain match (see findConfidentVisitor), or
 * - it has at least MIN_PREFIX_LETTERS letters, covers at least MIN_PREFIX_COVERAGE of the
 *   first word of a name or alias, and that start belongs to exactly one person.
 */
export function findTypingMatch(input: string, visitors: Visitor[]): Visitor | null {
  const confident = findConfidentVisitor(input, visitors)
  if (confident) return confident

  const query = normalizeIdentity(input)
  if (letterCount(query) < MIN_PREFIX_LETTERS) return null

  const startsWithQuery = (identity: string) => normalizeIdentity(identity).startsWith(query)
  const candidates = visitors.filter((visitor) => [visitor.name, ...visitor.aliases].some(startsWithQuery))
  if (candidates.length !== 1) return null

  const [visitor] = candidates
  return [visitor.name, ...visitor.aliases].some((identity) => {
    const firstWord = normalizeIdentity(identity).split(' ')[0]
    return startsWithQuery(identity) && query.length >= Math.ceil(firstWord.length * MIN_PREFIX_COVERAGE)
  })
    ? visitor
    : null
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
