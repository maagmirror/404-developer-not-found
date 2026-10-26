// Decides what interrupts the ambient field next. Pure: time comes in, a plan comes out.
// Only one event runs at a time, so a face and a video can never compete.
import { pickWeighted, randomBetween } from './random'
import type { VideoEntry } from './manifest'

export type EventKind = 'face' | 'video'

export interface PlannedEvent {
  kind: EventKind
  startAt: number
  videoId?: string
}

export interface SchedulerMemory {
  lastKind: EventKind | null
  lastVideoId: string | null
  // When the last video ended. Starts at 0 so the night opens with the field and a face.
  lastVideoEndAt: number
  playedAt: Record<string, number>
}

export interface SchedulerConfig {
  ambientGapMs: readonly [number, number]
  videoChance: number
  videoMinIntervalMs: number
}

export const createMemory = (): SchedulerMemory => ({ lastKind: null, lastVideoId: null, lastVideoEndAt: 0, playedAt: {} })

export function pickVideo(videos: readonly VideoEntry[], memory: SchedulerMemory, at: number, random: () => number): VideoEntry | null {
  if (videos.length === 0) return null
  const notLast = videos.length > 1 ? videos.filter((video) => video.id !== memory.lastVideoId) : videos
  const rested = notLast.filter((video) => {
    const played = memory.playedAt[video.id]
    return played === undefined || at - played >= video.cooldownMs
  })
  return pickWeighted(rested.length > 0 ? rested : notLast, (video) => video.weight, random)
}

export function planNextEvent(
  memory: SchedulerMemory,
  now: number,
  videos: readonly VideoEntry[],
  random: () => number,
  config: SchedulerConfig,
  force?: EventKind,
): PlannedEvent {
  const startAt = force ? now : now + Math.round(randomBetween(random, config.ambientGapMs[0], config.ambientGapMs[1]))
  const roll = random()
  const videoAllowed = videos.length > 0
    && memory.lastKind !== 'video'
    && startAt - memory.lastVideoEndAt >= config.videoMinIntervalMs
  const kind: EventKind = force === 'video' && videos.length > 0
    ? 'video'
    : force === 'face' || !videoAllowed || roll >= config.videoChance ? 'face' : 'video'
  if (kind === 'face') return { kind, startAt }
  const video = pickVideo(videos, memory, startAt, random)
  return video ? { kind, startAt, videoId: video.id } : { kind: 'face', startAt }
}

export function recordStart(memory: SchedulerMemory, event: PlannedEvent): SchedulerMemory {
  if (event.kind === 'face') return { ...memory, lastKind: 'face' }
  return {
    ...memory,
    lastKind: 'video',
    lastVideoId: event.videoId ?? null,
    playedAt: event.videoId ? { ...memory.playedAt, [event.videoId]: event.startAt } : memory.playedAt,
  }
}

export function recordVideoEnd(memory: SchedulerMemory, at: number): SchedulerMemory {
  return { ...memory, lastVideoEndAt: at }
}

// How long a clip may run before the interlude gives up on it.
export function videoTimeoutMs(video: Pick<VideoEntry, 'durationMs'>, maxMs: number, marginMs: number) {
  return video.durationMs === null ? maxMs : Math.min(maxMs, video.durationMs + marginMs)
}
