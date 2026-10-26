import { describe, expect, it } from 'vitest'
import { faceTotalMs, timing } from '../config'
import { chooseFaceLayout, faceEnvelope } from './face'
import { createSeededRandom } from './random'

describe('face', () => {
  it('assembles, holds and dissolves back to the field', () => {
    const { convergeMs, holdMs } = timing.face
    for (const delay of [0, 0.5, 1]) {
      expect(faceEnvelope(0, delay, false)).toBe(0)
      expect(faceEnvelope(convergeMs + holdMs / 2, delay, false)).toBe(1)
      expect(faceEnvelope(faceTotalMs, delay, false)).toBe(0)
      expect(faceEnvelope(convergeMs - 1, delay, false)).toBeGreaterThan(0.99)
    }
  })

  it('assembles cells at different moments, except in stable mode', () => {
    const early = timing.face.convergeMs * 0.3
    expect(faceEnvelope(early, 0, false)).toBeGreaterThan(faceEnvelope(early, 1, false))
    expect(faceEnvelope(early, 0, true)).toBe(faceEnvelope(early, 1, true))
  })

  it('stays inside the safe zone in landscape and portrait', () => {
    const random = createSeededRandom(404)
    for (const [width, height] of [[1920, 1080], [1080, 1920], [390, 844]]) {
      for (let index = 0; index < 200; index += 1) {
        const inset = 0.05
        const { cx, cy, size } = chooseFaceLayout(random, width, height, inset)
        expect(cx - size * 0.42).toBeGreaterThanOrEqual(width * inset - 0.001)
        expect(cx + size * 0.42).toBeLessThanOrEqual(width * (1 - inset) + 0.001)
        expect(cy - size * 0.5).toBeGreaterThanOrEqual(height * inset - 0.001)
        expect(cy + size * 0.72).toBeLessThanOrEqual(height * (1 - inset) + 0.001)
      }
    }
  })
})
