// Decides what interrupts the idle field next. Pure: time comes in, a plan comes out.
// Events are dealt from a shuffled deck of the five kinds: every kind once per round,
// no kind twice in a row across rounds, and only one event at a time.
import type { EventKind } from './events'
import { EVENT_KINDS } from './events'
import type { VideoEntry } from './manifest'
import { pickWeighted, randomBetween } from './random'

export interface PlannedEvent {
  kind: EventKind
  startAt: number
  videoId?: string
}

export interface SchedulerMemory {
  deck: EventKind[]
  lastKind: EventKind | null
  lastVideoId: string | null
  playedAt: Record<string, number>
}

export interface SchedulerConfig {
  ambientGapMs: readonly [number, number]
}

export const createMemory = (): SchedulerMemory => ({ deck: [], lastKind: null, lastVideoId: null, playedAt: {} })

export function shuffleDeck(kinds: readonly EventKind[], random: () => number, previous: EventKind | null): EventKind[] {
  const deck = [...kinds]
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[deck[index], deck[target]] = [deck[target], deck[index]]
  }
  if (deck.length > 1 && deck[0] === previous) [deck[0], deck[1]] = [deck[1], deck[0]]
  return deck
}

export function pickVideo(videos: readonly VideoEntry[], memory: SchedulerMemory, at: number, random: () => number): VideoEntry | null {
  if (videos.length === 0) return null
  const notLast = videos.length > 1 ? videos.filter((video) => video.id !== memory.lastVideoId) : videos
  const rested = notLast.filter((video) => {
    const played = memory.playedAt[video.id]
    return played === undefined || at - played >= video.cooldownMs
  })
  return pickWeighted(rested.length > 0 ? rested : notLast, (video) => video.weight, random)
}

// Deals the next event. `force` runs a given kind right now without touching the deck.
export function planNextEvent(
  memory: SchedulerMemory,
  now: number,
  videos: readonly VideoEntry[],
  random: () => number,
  config: SchedulerConfig,
  force?: EventKind,
): { event: PlannedEvent; memory: SchedulerMemory } {
  const kinds = videos.length > 0 ? EVENT_KINDS : EVENT_KINDS.filter((kind) => kind !== 'video')
  let deck = memory.deck.filter((kind) => kinds.includes(kind))
  let kind: EventKind
  if (force) kind = force === 'video' && videos.length === 0 ? 'stare' : force
  else {
    if (deck.length === 0) deck = shuffleDeck(kinds, random, memory.lastKind)
    ;[kind, ...deck] = deck
  }
  const startAt = force ? now : now + Math.round(randomBetween(random, config.ambientGapMs[0], config.ambientGapMs[1]))
  const next = { ...memory, deck }
  if (kind !== 'video') return { event: { kind, startAt }, memory: next }
  const video = pickVideo(videos, memory, startAt, random)!
  return { event: { kind, startAt, videoId: video.id }, memory: next }
}

export function recordStart(memory: SchedulerMemory, event: PlannedEvent): SchedulerMemory {
  if (event.kind !== 'video' || !event.videoId) return { ...memory, lastKind: event.kind }
  return {
    ...memory,
    lastKind: 'video',
    lastVideoId: event.videoId,
    playedAt: { ...memory.playedAt, [event.videoId]: event.startAt },
  }
}

// How long a clip may run before the interlude gives up on it.
export function videoTimeoutMs(video: Pick<VideoEntry, 'durationMs'>, maxMs: number, marginMs: number) {
  return video.durationMs === null ? maxMs : Math.min(maxMs, video.durationMs + marginMs)
}
