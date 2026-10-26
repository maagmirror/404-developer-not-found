import { describe, expect, it } from 'vitest'
import { buildManifest, type VideoEntry } from './manifest'
import { createSeededRandom } from './random'
import { createMemory, planNextEvent, recordStart, recordVideoEnd, videoTimeoutMs, type SchedulerConfig, type SchedulerMemory } from './scheduler'

const config: SchedulerConfig = { ambientGapMs: [10000, 20000], videoChance: 0.6, videoMinIntervalMs: 30000 }
const clip = (id: string, extra: Partial<VideoEntry> = {}): VideoEntry => ({
  id, src: `/${id}.mp4`, file: `${id}.mp4`, label: id, mimeType: 'video/mp4', durationMs: 8000,
  weight: 1, cooldownMs: 0, fit: 'contain', cctv: true, ...extra,
})
const clips = [clip('a'), clip('b'), clip('c')]

// Runs the night forward: each event lasts 10 s, then the next one is planned.
function simulate(videos: VideoEntry[], seed: number, count: number) {
  const random = createSeededRandom(seed)
  let memory: SchedulerMemory = createMemory()
  let now = 0
  const events = []
  for (let index = 0; index < count; index += 1) {
    const event = planNextEvent(memory, now, videos, random, config)
    events.push(event)
    memory = recordStart(memory, event)
    now = event.startAt + 10000
    if (event.kind === 'video') memory = recordVideoEnd(memory, now)
  }
  return events
}

describe('event scheduler', () => {
  it('replays the same sequence for the same seed', () => {
    expect(simulate(clips, 404, 40)).toEqual(simulate(clips, 404, 40))
    expect(simulate(clips, 404, 40)).not.toEqual(simulate(clips, 405, 40))
  })

  it('keeps every ambient gap inside the configured window', () => {
    const random = createSeededRandom(1)
    for (let index = 0; index < 200; index += 1) {
      const event = planNextEvent(createMemory(), 5000, clips, random, config)
      expect(event.startAt - 5000).toBeGreaterThanOrEqual(10000)
      expect(event.startAt - 5000).toBeLessThanOrEqual(20000)
    }
  })

  it('never plays two videos in a row and never repeats the same clip back to back', () => {
    const events = simulate(clips, 7, 300)
    expect(events.some((event) => event.kind === 'video')).toBe(true)
    expect(events.some((event) => event.kind === 'face')).toBe(true)
    for (let index = 1; index < events.length; index += 1) {
      expect(events[index - 1].kind === 'video' && events[index].kind === 'video').toBe(false)
    }
    const videoIds = events.filter((event) => event.kind === 'video').map((event) => event.videoId)
    for (let index = 1; index < videoIds.length; index += 1) expect(videoIds[index]).not.toBe(videoIds[index - 1])
  })

  it('respects the minimum interval between videos', () => {
    const random = createSeededRandom(3)
    let memory = recordVideoEnd(recordStart(createMemory(), { kind: 'video', startAt: 0, videoId: 'a' }), 50000)
    memory = recordStart(memory, { kind: 'face', startAt: 60000 })
    for (let index = 0; index < 100; index += 1) {
      // 55 s + at most 20 s gap is still under 50 s + 30 s: always a face.
      expect(planNextEvent(memory, 55000, clips, random, { ...config, videoChance: 1 }).kind).toBe('face')
    }
  })

  it('prefers clips whose cooldown has expired', () => {
    const random = createSeededRandom(9)
    const slow = [clip('a', { cooldownMs: 1e9 }), clip('b', { cooldownMs: 1e9 }), clip('c', { cooldownMs: 1e9 })]
    const memory = { ...createMemory(), lastKind: 'face' as const, lastVideoId: 'a', playedAt: { a: 0, b: 1000 } }
    for (let index = 0; index < 50; index += 1) {
      expect(planNextEvent(memory, 100000, slow, random, config, 'video').videoId).toBe('c')
    }
  })

  it('falls back to faces only when there are no clips', () => {
    expect(simulate([], 11, 50).every((event) => event.kind === 'face')).toBe(true)
  })

  it('starts a forced event immediately', () => {
    const event = planNextEvent(createMemory(), 1234, clips, createSeededRandom(2), config, 'video')
    expect(event).toMatchObject({ kind: 'video', startAt: 1234 })
    expect(planNextEvent(createMemory(), 1234, clips, createSeededRandom(2), config, 'face')).toEqual({ kind: 'face', startAt: 1234 })
  })

  it('caps the timeout of unknown or long clips', () => {
    expect(videoTimeoutMs({ durationMs: null }, 45000, 4000)).toBe(45000)
    expect(videoTimeoutMs({ durationMs: 8000 }, 45000, 4000)).toBe(12000)
    expect(videoTimeoutMs({ durationMs: 90000 }, 45000, 4000)).toBe(45000)
  })

  it('works with the placeholder playlist', () => {
    const placeholders = buildManifest({}, {}, { cooldownMs: 0, placeholderMs: 7000 })
    const events = simulate(placeholders, 5, 100)
    expect(events.some((event) => event.kind === 'video' && event.videoId?.startsWith('placeholder-'))).toBe(true)
  })
})
