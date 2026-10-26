import { describe, expect, it } from 'vitest'
import { screamProfiles } from './sfx'

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
