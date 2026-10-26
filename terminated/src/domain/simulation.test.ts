import { describe, expect, it } from 'vitest'
import {
  advanceSimulation,
  createSeededRandom,
  createSimulation,
  shuffleRound,
  type Developer,
} from './simulation'

const developers: Developer[] = ['Aster', 'Boreal', 'Cipher'].map((name, index) => ({
  id: `dev-${index}`,
  name,
  photoUrl: `memory:${index}`,
}))

const nextDeveloper = (state: ReturnType<typeof createSimulation>, random: () => number) => {
  let next = state
  for (let step = 0; step < 3; step += 1) next = advanceSimulation(next, developers, random)
  return next
}

describe('terminated loop', () => {
  it('is deterministic with an injected seeded random source', () => {
    const first = shuffleRound(developers, createSeededRandom(404)).map(({ id }) => id)
    const second = shuffleRound(developers, createSeededRandom(404)).map(({ id }) => id)
    expect(first).toEqual(second)
  })

  it('runs exactly profile -> flicker -> terminated -> next profile', () => {
    const random = createSeededRandom(404)
    let state = createSimulation(developers, random)
    const first = state.current.id
    const phases = [state.phase]
    for (let step = 0; step < 3; step += 1) {
      state = advanceSimulation(state, developers, random)
      phases.push(state.phase)
    }
    expect(phases).toEqual(['profile', 'flicker', 'terminated', 'profile'])
    expect(state.current.id).not.toBe(first)
    expect(state.count).toBe(2)
  })

  it('keeps the same developer through flicker and terminated', () => {
    const random = createSeededRandom(7)
    let state = createSimulation(developers, random)
    const id = state.current.id
    state = advanceSimulation(state, developers, random)
    expect(state.current.id).toBe(id)
    state = advanceSimulation(state, developers, random)
    expect(state.current.id).toBe(id)
  })

  it('visits every developer once per round and avoids a boundary repeat', () => {
    const random = () => 0.999
    let state = createSimulation(developers, random)
    const seen = [state.current.id]
    state = nextDeveloper(state, random)
    seen.push(state.current.id)
    state = nextDeveloper(state, random)
    seen.push(state.current.id)
    const previous = state.current.id
    state = nextDeveloper(state, random)

    expect(new Set(seen)).toEqual(new Set(developers.map(({ id }) => id)))
    expect(state.round).toBe(2)
    expect(state.current.id).not.toBe(previous)
  })

  it('loops forever with a single developer', () => {
    const solo = [developers[0]]
    let state = createSimulation(solo, Math.random)
    for (let step = 0; step < 30; step += 1) state = advanceSimulation(state, solo, Math.random)
    expect(state.current.id).toBe(solo[0].id)
    expect(state.round).toBe(11)
  })

  it('rejects an empty roster', () => {
    expect(() => createSimulation([], Math.random)).toThrow(/one developer/i)
  })
})
