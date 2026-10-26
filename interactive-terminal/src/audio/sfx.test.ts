import { describe, expect, it } from 'vitest'
import { jumpscareScreamUrls, measureScream, screamProfiles } from './sfx'

describe('screamProfiles', () => {
  it('offers at least 10 distinct screams', () => {
    expect(screamProfiles.length).toBeGreaterThanOrEqual(10)
    expect(new Set(screamProfiles.map((profile) => profile.name)).size).toBe(screamProfiles.length)
  })

  it('are schedulable: positive pitches, peak inside the duration, at least one voice', () => {
    for (const profile of screamProfiles) {
      expect(profile.pitch.every((hz) => hz > 0)).toBe(true)
      expect(profile.peakAt).toBeLessThan(profile.duration * 0.55)
      expect(profile.voices.length).toBeGreaterThan(0)
      if (profile.crack) expect(profile.crack.at * profile.duration).toBeGreaterThan(profile.peakAt)
    }
  })
})

describe('jumpscareScreamUrls', () => {
  it('picks up every recording in the jumpscares folder', () => {
    expect(jumpscareScreamUrls.length).toBeGreaterThanOrEqual(1)
    expect(jumpscareScreamUrls.every((url) => /\.(ogg|mp3|wav)/.test(url))).toBe(true)
  })
})

describe('measureScream', () => {
  const rate = 1000
  const tone = (amplitude: number, length: number) => Array.from({ length }, (_, i) => (i % 2 ? amplitude : -amplitude))

  it('skips leading silence and evens out loudness', () => {
    const quiet = measureScream(new Float32Array([...Array(500).fill(0), ...tone(0.05, 500)]), rate)
    const loud = measureScream(new Float32Array([...Array(500).fill(0), ...tone(0.5, 500)]), rate)
    expect(quiet.offset).toBeCloseTo(0.48)
    expect(quiet.gain * 0.05).toBeCloseTo(loud.gain * 0.5)
  })

  it('never boosts peaks far past full scale', () => {
    const { gain } = measureScream(new Float32Array([1, ...Array(999).fill(0.01)]), rate)
    expect(gain).toBeLessThanOrEqual(1.4)
  })

  it('leaves silence untouched', () => {
    expect(measureScream(new Float32Array(100), rate)).toEqual({ offset: 0, gain: 1 })
  })
})
