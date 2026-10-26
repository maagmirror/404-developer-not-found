// The four events and how each one unfolds. Pure: layouts and timings come out, nothing is drawn here.
import { timing } from '../config'
import { centerFaceLayout, faceDuration, peekFaceLayout, type FaceLayout, type FaceTiming } from './face'

export type EventKind = 'peek' | 'stare' | 'video' | 'rush'
export type FaceEventKind = 'peek' | 'stare'

export const EVENT_KINDS: readonly EventKind[] = ['peek', 'stare', 'video', 'rush']

export const EVENT_LABELS: Record<EventKind, string> = {
  peek: 'SE ASOMA DESDE UN COSTADO',
  stare: 'TIEMBLA EN EL CENTRO',
  video: 'VIDEO',
  rush: 'EL FONDO SE DESBOCA',
}

export interface Appearance {
  // Offset from the start of the event.
  at: number
  layout: FaceLayout
  timing: FaceTiming
  gaze: 'erratic' | 'fixed'
  tremble: boolean
  // Horizontal slide: starts `fromX` px away, eases in, slides back out at the end.
  slide?: { fromX: number; inMs: number; outMs: number }
}

export const appearanceEnd = (appearance: Appearance) => appearance.at + faceDuration(appearance.timing)

export function planFaceEvent(kind: FaceEventKind, random: () => number, width: number, height: number, safeInset: number): Appearance[] {
  if (kind === 'stare') {
    const { convergeMs, holdMs, dissolveMs } = timing.stare
    return [{ at: 0, layout: centerFaceLayout(width, height, safeInset), timing: { convergeMs, holdMs, dissolveMs }, gaze: 'erratic', tremble: true }]
  }
  const { convergeMs, holdMs, dissolveMs, slideInMs, slideOutMs } = timing.peek
  const { layout, fromX } = peekFaceLayout(random, width, height, safeInset)
  return [{ at: 0, layout, timing: { convergeMs, holdMs, dissolveMs }, gaze: 'fixed', tremble: false, slide: { fromX, inMs: slideInMs, outMs: slideOutMs } }]
}

export const rushDuration = timing.rush.reduce((sum, step) => sum + step.ms, 0)

// Field speed (rows per second, negative = down) and glitch amount at a moment of the rush.
// Speed eases from the previous step's value during the first 40% of each step, so it accelerates
// instead of jumping. `cut` marks the hard glitch bursts.
export function rushAt(elapsedMs: number) {
  let start = 0
  let previous = 1
  for (const step of timing.rush) {
    if (elapsedMs < start + step.ms) {
      const ramp = Math.min(1, (elapsedMs - start) / (step.ms * 0.4))
      return { speed: previous + (step.speed - previous) * ramp, glitch: step.glitch, cut: step.glitch >= 0.8 }
    }
    previous = step.speed
    start += step.ms
  }
  return { speed: 1, glitch: 0, cut: false }
}
