// Three-step loop: the developer's dossier, a short screen flicker, the same dossier crossed out as TERMINATED.
export type Phase = 'profile' | 'flicker' | 'terminated'

export interface Developer {
  id: string
  name: string
  photoUrl: string
}

export interface SimulationState {
  phase: Phase
  round: number
  count: number
  current: Developer
  remaining: Developer[]
}

export const phaseDurations: Record<Phase, number> = {
  profile: 3500,
  flicker: 900,
  terminated: 3000,
}

export function shuffleRound<T>(items: readonly T[], random: () => number, previous?: T): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  if (result.length > 1 && previous !== undefined && result[0] === previous) {
    ;[result[0], result[1]] = [result[1], result[0]]
  }
  return result
}

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

export function createSimulation(developers: readonly Developer[], random: () => number): SimulationState {
  if (developers.length < 1) throw new Error('At least one developer is required')
  const [current, ...remaining] = shuffleRound(developers, random)
  return { phase: 'profile', round: 1, count: 1, current, remaining }
}

export function advanceSimulation(
  state: SimulationState,
  developers: readonly Developer[],
  random: () => number,
): SimulationState {
  if (state.phase === 'profile') return { ...state, phase: 'flicker' }
  if (state.phase === 'flicker') return { ...state, phase: 'terminated' }

  let round = state.round
  let remaining = state.remaining
  if (remaining.length === 0) {
    round += 1
    remaining = shuffleRound(developers, random, state.current)
  }
  const [current, ...rest] = remaining
  return { phase: 'profile', round, count: state.count + 1, current, remaining: rest }
}
