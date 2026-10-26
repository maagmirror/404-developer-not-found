import { describe, expect, it } from 'vitest'
import { timing } from '../config'
import { HEAD_HALF_H, HEAD_HALF_W, centerFaceLayout, chooseFaceLayout, faceDuration, faceEnvelope, gazeAt, peekFaceLayout } from './face'
import { createSeededRandom } from './random'

const stare = timing.stare

describe('face', () => {
  it('assembles, holds and dissolves back to the field', () => {
    for (const delay of [0, 0.5, 1]) {
      expect(faceEnvelope(0, delay, false, stare)).toBe(0)
      expect(faceEnvelope(stare.convergeMs + stare.holdMs / 2, delay, false, stare)).toBe(1)
      expect(faceEnvelope(faceDuration(stare), delay, false, stare)).toBe(0)
      expect(faceEnvelope(stare.convergeMs - 1, delay, false, stare)).toBeGreaterThan(0.99)
    }
  })

  it('assembles cells at different moments, except in stable mode', () => {
    const early = stare.convergeMs * 0.3
    expect(faceEnvelope(early, 0, false, stare)).toBeGreaterThan(faceEnvelope(early, 1, false, stare))
    expect(faceEnvelope(early, 0, true, stare)).toBe(faceEnvelope(early, 1, true, stare))
  })

  it('forms faster than before (under 1.5 s)', () => {
    expect(timing.stare.convergeMs).toBeLessThanOrEqual(1500)
    expect(timing.peek.convergeMs).toBeLessThanOrEqual(1500)
  })

  it('keeps faces inside the safe zone in landscape and portrait', () => {
    const random = createSeededRandom(404)
    for (const [width, height] of [[1920, 1080], [1080, 1920], [390, 844]]) {
      const inset = 0.05
      for (let index = 0; index < 200; index += 1) {
        const { cx, cy, size } = chooseFaceLayout(random, width, height, inset, 0.4 + random() * 0.6)
        expect(cx - size * HEAD_HALF_W).toBeGreaterThanOrEqual(width * inset - 0.001)
        expect(cx + size * HEAD_HALF_W).toBeLessThanOrEqual(width * (1 - inset) + 0.001)
        expect(cy - size * HEAD_HALF_H).toBeGreaterThanOrEqual(height * inset - 0.001)
        expect(cy + size * HEAD_HALF_H).toBeLessThanOrEqual(height * (1 - inset) + 0.001)
      }
      const center = centerFaceLayout(width, height, inset)
      expect(center.cx).toBe(width / 2)
      expect(center.cy + center.size * HEAD_HALF_H).toBeLessThanOrEqual(height * (1 - inset) + 0.001)
    }
  })

  it('peeks tilted, with part of the head off screen, both eyes in, starting fully outside', () => {
    const random = createSeededRandom(3)
    for (let index = 0; index < 50; index += 1) {
      const { layout, side, fromX } = peekFaceLayout(random, 1920, 1080, 0.05)
      const left = layout.cx - layout.size * HEAD_HALF_W
      const right = layout.cx + layout.size * HEAD_HALF_W
      // Outer corner of the near eye, turned with the tilt.
      const eyeOffset = layout.size * 0.25 * Math.cos(layout.rotation!)
      if (side === 'left') {
        expect(left).toBeLessThan(0)
        expect(layout.cx - eyeOffset).toBeGreaterThan(0)
        expect(right + fromX).toBeLessThanOrEqual(0)
      } else {
        expect(right).toBeGreaterThan(1920)
        expect(layout.cx + eyeOffset).toBeLessThan(1920)
        expect(left + fromX).toBeGreaterThanOrEqual(1920)
      }
    }
  })

  it('darts the pupils around but stares straight when fixed', () => {
    const hash = (a: number, b: number) => createSeededRandom(a * 31 + b)()
    const spots = new Set<string>()
    for (let ms = 0; ms < 2000; ms += 20) {
      const gaze = gazeAt(ms, 'erratic', 110, hash)
      expect(Math.abs(gaze.x)).toBeLessThanOrEqual(0.13)
      expect(Math.abs(gaze.y)).toBeLessThanOrEqual(0.04)
      spots.add(`${gaze.x.toFixed(3)},${gaze.y.toFixed(3)}`)
      expect(gazeAt(ms, 'fixed', 110, hash)).toEqual({ x: 0, y: 0 })
    }
    expect(spots.size).toBeGreaterThan(12)
  })
})
