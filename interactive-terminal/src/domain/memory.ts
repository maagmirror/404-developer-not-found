import type { Visitor } from '../data/visitors'
import { normalizeIdentity } from './recognition'

export const MEMORY_STORAGE_KEY = 'error404.remembered-names'
export const REMEMBERED = 'remembered'

/** Adds a display name unless it is blank or already known (by normalized identity). */
export function addRememberedName(names: string[], input: string, known: Visitor[]): string[] {
  const name = input.trim().replace(/\s+/g, ' ')
  const key = normalizeIdentity(name)
  if (!key) return names

  const taken = [...known.flatMap((visitor) => [visitor.name, ...visitor.aliases]), ...names]
  if (taken.some((identity) => normalizeIdentity(identity) === key)) return names
  return [...names, name]
}

export function toRememberedVisitors(names: string[]): Visitor[] {
  return names.map((name) => ({
    id: `${REMEMBERED}:${normalizeIdentity(name)}`,
    name,
    aliases: [],
    metadata: { source: REMEMBERED },
  }))
}

export const isRemembered = (visitor: Visitor) => visitor.metadata?.source === REMEMBERED

/** Browser storage can be blocked or cleared; the terminal keeps working without it. */
export function loadRememberedNames(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(MEMORY_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === 'string') : []
  } catch {
    return []
  }
}

export function saveRememberedNames(names: string[]): void {
  try {
    window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(names))
  } catch {
    // Storage unavailable: the name is still remembered for this session.
  }
}
