import { describe, expect, it } from 'vitest'
import { planFaceEvent, rushAt, rushDuration } from './events'
import { HEAD_HALF_W } from './face'
import { createSeededRandom } from './random'

describe('events', () => {
  it('peek: one appearance sliding in from a side and staring', () => {
    const [appearance, ...rest] = planFaceEvent('peek', createSeededRandom(4), 1920, 1080, 0.05)
    expect(rest).toHaveLength(0)
    expect(appearance.gaze).toBe('fixed')
    expect(appearance.slide).toBeDefined()
    expect(Math.abs(appearance.slide!.fromX)).toBeGreaterThan(appearance.layout.size * HEAD_HALF_W)
    // Leaning: the crown tilts toward the middle of the screen.
    const fromLeft = appearance.layout.cx < 960
    expect(Math.abs(appearance.layout.rotation!)).toBeGreaterThan(0.2)
    expect(Math.sign(appearance.layout.rotation!)).toBe(fromLeft ? 1 : -1)
  })

  it('stare: centred, trembling, darting eyes', () => {
    const [appearance] = planFaceEvent('stare', createSeededRandom(4), 1920, 1080, 0.05)
    expect(appearance.layout.cx).toBe(960)
    expect(appearance).toMatchObject({ gaze: 'erratic', tremble: true })
  })

  it('rush: speeds up, glitches, runs backwards, then forwards again', () => {
    const samples = Array.from({ length: Math.ceil(rushDuration / 10) }, (_, index) => rushAt(index * 10))
    const firstFast = samples.findIndex((sample) => sample.speed > 60)
    const firstBack = samples.findIndex((sample) => sample.speed < -40)
    const forwardAgain = samples.findIndex((sample, index) => index > firstBack && sample.speed > 60)
    expect(firstFast).toBeGreaterThan(0)
    expect(firstBack).toBeGreaterThan(firstFast)
    expect(forwardAgain).toBeGreaterThan(firstBack)
    // It accelerates gradually rather than jumping straight to full speed.
    expect(samples.some((sample) => sample.speed > 20 && sample.speed < 60)).toBe(true)
    expect(samples.slice(firstFast, firstBack).some((sample) => sample.cut)).toBe(true)
    expect(rushAt(rushDuration + 1)).toEqual({ speed: 1, glitch: 0, cut: false })
  })
})
