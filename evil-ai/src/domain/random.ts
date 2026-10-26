// Small deterministic PRNG (mulberry32): the same seed replays the same night.
export function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

export const randomBetween = (random: () => number, min: number, max: number) => min + random() * (max - min)

export function pickWeighted<T>(items: readonly T[], weight: (item: T) => number, random: () => number): T | null {
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0)
  if (items.length === 0) return null
  if (total <= 0) return items[Math.floor(random() * items.length)]
  let target = random() * total
  for (const item of items) {
    target -= Math.max(0, weight(item))
    if (target < 0) return item
  }
  return items[items.length - 1]
}

// Picks from a list without returning the previous pick when there is any alternative.
export function pickFresh<T>(items: readonly T[], previous: T | undefined, random: () => number): T {
  const pool = items.length > 1 ? items.filter((item) => item !== previous) : items
  return pool[Math.floor(random() * pool.length)]
}
