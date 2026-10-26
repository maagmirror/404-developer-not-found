import { visitors } from '../data/visitors'
import { loadRememberedNames } from './memory'
import { normalizeIdentity } from './recognition'

export const PICKS_STORAGE_KEY = 'error404.survivor-picks'

/** How many times each person was saved, keyed by normalized name. */
export type PickCounts = Record<string, number>

export const pickKey = normalizeIdentity

/** Everyone in the database: the prepopulated visitors plus every name the terminal has added. */
export const databaseNames = () => [...visitors.map((visitor) => visitor.name), ...loadRememberedNames()]

/**
 * The visitor is usually in the database too, so it takes three names to always have two
 * other people to choose between. With fewer, "Elige quién sobrevive" is skipped.
 */
export const MIN_SURVIVOR_NAMES = 3
export const canPlaySurvivor = () => databaseNames().length >= MIN_SURVIVOR_NAMES

export const addPick = (counts: PickCounts, name: string): PickCounts => {
  const key = pickKey(name)
  return { ...counts, [key]: (counts[key] ?? 0) + 1 }
}

/** Two different people from the database, never the visitor themselves. */
export function pickPair(names: string[], visitorName: string | undefined, random: () => number = Math.random): [string, string] {
  const self = visitorName ? pickKey(visitorName) : ''
  const pool = names.filter((name, index) => pickKey(name) !== self && names.findIndex((other) => pickKey(other) === pickKey(name)) === index)
  const first = pool.splice(Math.floor(random() * pool.length), 1)[0] ?? '???'
  const second = pool[Math.floor(random() * pool.length)] ?? '???'
  return [first, second]
}

/** Browser storage can be blocked or cleared; the counts just start over. */
export function loadPickCounts(): PickCounts {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(PICKS_STORAGE_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === 'number'))
  } catch {
    return {}
  }
}

export function savePickCounts(counts: PickCounts): void {
  try {
    window.localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(counts))
  } catch {
    // Storage unavailable: counts last for this session only.
  }
}
