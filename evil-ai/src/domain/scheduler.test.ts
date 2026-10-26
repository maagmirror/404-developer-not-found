import { describe, expect, it } from 'vitest'
import { EVENT_KINDS } from './events'
import { buildManifest, type VideoEntry } from './manifest'
import { createSeededRandom } from './random'
import { createMemory, planNextEvent, recordStart, videoTimeoutMs, type PlannedEvent, type SchedulerConfig } from './scheduler'

const config: SchedulerConfig = { ambientGapMs: [10000, 20000] }
const clip = (id: string, extra: Partial<VideoEntry> = {}): VideoEntry => ({
  id, src: `/${id}.mp4`, file: `${id}.mp4`, label: id, mimeType: 'video/mp4', durationMs: 8000,
  weight: 1, cooldownMs: 0, fit: 'contain', cctv: true, ...extra,
})
const clips = [clip('a'), clip('b'), clip('c')]

// Runs the night forward: each event lasts 10 s, then the next one is dealt.
function simulate(videos: VideoEntry[], seed: number, count: number) {
  const random = createSeededRandom(seed)
  let memory = createMemory()
  let now = 0
  const events: PlannedEvent[] = []
  for (let index = 0; index < count; index += 1) {
    const planned = planNextEvent(memory, now, videos, random, config)
    events.push(planned.event)
    memory = recordStart(planned.memory, planned.event)
    now = planned.event.startAt + 10000
  }
  return events
}

describe('event deck', () => {
  it('replays the same sequence for the same seed', () => {
    expect(simulate(clips, 404, 40)).toEqual(simulate(clips, 404, 40))
    expect(simulate(clips, 404, 40)).not.toEqual(simulate(clips, 405, 40))
  })

  it('deals every event once per round', () => {
    const events = simulate(clips, 7, EVENT_KINDS.length * 10)
    for (let round = 0; round < 10; round += 1) {
      const kinds = events.slice(round * EVENT_KINDS.length, (round + 1) * EVENT_KINDS.length).map((event) => event.kind)
      expect([...kinds].sort()).toEqual([...EVENT_KINDS].sort())
    }
  })

  it('never repeats an event back to back, even across rounds', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const events = simulate(clips, seed, 100)
      for (let index = 1; index < events.length; index += 1) expect(events[index].kind).not.toBe(events[index - 1].kind)
    }
  })

  it('keeps every idle gap inside the configured window', () => {
    const random = createSeededRandom(1)
    let memory = createMemory()
    for (let index = 0; index < 100; index += 1) {
      const planned = planNextEvent(memory, 5000, clips, random, config)
      memory = planned.memory
      expect(planned.event.startAt - 5000).toBeGreaterThanOrEqual(10000)
      expect(planned.event.startAt - 5000).toBeLessThanOrEqual(20000)
    }
  })

  it('never plays the same clip twice in a row', () => {
    const ids = simulate(clips, 9, 200).filter((event) => event.kind === 'video').map((event) => event.videoId)
    expect(ids.length).toBeGreaterThan(10)
    for (let index = 1; index < ids.length; index += 1) expect(ids[index]).not.toBe(ids[index - 1])
  })

  it('prefers clips whose cooldown has expired', () => {
    const slow = clips.map((entry) => ({ ...entry, cooldownMs: 1e9 }))
    const memory = { ...createMemory(), lastVideoId: 'a', playedAt: { a: 0, b: 1000 } }
    for (let index = 0; index < 20; index += 1) {
      expect(planNextEvent(memory, 100000, slow, createSeededRandom(index), config, 'video').event.videoId).toBe('c')
    }
  })

  it('drops the video event when there are no clips', () => {
    expect(simulate([], 11, 40).some((event) => event.kind === 'video')).toBe(false)
  })

  it('runs a forced event now without using up the deck', () => {
    const memory = createMemory()
    const planned = planNextEvent(memory, 1234, clips, createSeededRandom(2), config, 'rush')
    expect(planned.event).toEqual({ kind: 'rush', startAt: 1234 })
    expect(planned.memory.deck).toEqual(memory.deck)
  })

  it('caps the timeout of unknown or long clips', () => {
    expect(videoTimeoutMs({ durationMs: null }, 45000, 4000)).toBe(45000)
    expect(videoTimeoutMs({ durationMs: 8000 }, 45000, 4000)).toBe(12000)
    expect(videoTimeoutMs({ durationMs: 90000 }, 45000, 4000)).toBe(45000)
  })

  it('works with the placeholder playlist', () => {
    const placeholders = buildManifest({}, {}, { cooldownMs: 0, placeholderMs: 7000 })
    expect(simulate(placeholders, 5, 20).some((event) => event.kind === 'video' && event.videoId?.startsWith('placeholder-'))).toBe(true)
  })
})
