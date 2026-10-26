// Timing, placement and eye movement of the face. Each glyph cell has its own delay so the face
// assembles from scattered glyphs instead of fading in as one block.

export interface FaceTiming {
  convergeMs: number
  holdMs: number
  dissolveMs: number
}

export const faceDuration = ({ convergeMs, holdMs, dissolveMs }: FaceTiming) => convergeMs + holdMs + dissolveMs

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => { const x = clamp01(value); return x * x * (3 - 2 * x) }

// 0 = pure field, 1 = fully formed face. `delay` is the cell's 0..1 jitter.
export function faceEnvelope(elapsedMs: number, delay: number, stable: boolean, timing: FaceTiming): number {
  const { convergeMs, holdMs, dissolveMs } = timing
  if (elapsedMs <= 0 || elapsedMs >= faceDuration(timing)) return 0
  const spread = stable ? 0 : 0.55
  if (elapsedMs < convergeMs) {
    const local = elapsedMs / convergeMs
    return smooth((local - delay * spread) / (1 - spread))
  }
  if (elapsedMs < convergeMs + holdMs) return 1
  const local = (elapsedMs - convergeMs - holdMs) / dissolveMs
  // Dissolve in a different order than the assembly so cells scatter, not rewind.
  return 1 - smooth((local - (1 - delay) * spread) / (1 - spread))
}

export interface FaceLayout {
  cx: number
  cy: number
  // Face height in px. The head is about 0.72 of that wide.
  size: number
  // Tilt in radians, clockwise. Used by the peek.
  rotation?: number
}

// Half extents of the drawn head relative to `size` (see headPath in faceMask.ts).
export const HEAD_HALF_W = 0.36
export const HEAD_HALF_H = 0.5

function baseSize(width: number, height: number, safeInset: number) {
  const usableW = width * (1 - safeInset * 2)
  const usableH = height * (1 - safeInset * 2)
  return height > width ? Math.min(usableH * 0.5, usableW * 0.86) : Math.min(usableH * 0.86, usableW * 0.62)
}

// A face somewhere inside the safe zone, `scale` times the normal size.
export function chooseFaceLayout(random: () => number, width: number, height: number, safeInset: number, scale = 1): FaceLayout {
  const size = baseSize(width, height, safeInset) * scale
  const minX = width * safeInset + size * HEAD_HALF_W
  const maxX = width * (1 - safeInset) - size * HEAD_HALF_W
  const minY = height * safeInset + size * HEAD_HALF_H
  const maxY = height * (1 - safeInset) - size * HEAD_HALF_H
  return { cx: minX + Math.max(0, maxX - minX) * random(), cy: minY + Math.max(0, maxY - minY) * random(), size }
}

export function centerFaceLayout(width: number, height: number, safeInset: number): FaceLayout {
  return { cx: width / 2, cy: height / 2, size: baseSize(width, height, safeInset) }
}

// Tilt of a head leaning out from behind a wall: the crown leans toward the middle of the screen.
export const PEEK_TILT = 0.38

// Face leaning in from the left or right edge, tilted, partly outside. `fromX` is where it slides in from.
export function peekFaceLayout(random: () => number, width: number, height: number, safeInset: number) {
  const size = baseSize(width, height, safeInset) * 0.95
  const side: 'left' | 'right' = random() < 0.5 ? 'left' : 'right'
  // Both eyes in, the back of the head cut by the screen edge.
  const inset = size * 0.25
  const cx = side === 'left' ? inset : width - inset
  const rotation = side === 'left' ? PEEK_TILT : -PEEK_TILT
  const minY = height * safeInset + size * HEAD_HALF_H
  const maxY = height * (1 - safeInset) - size * HEAD_HALF_H
  const cy = minY + Math.max(0, maxY - minY) * (0.3 + random() * 0.4)
  // Starts fully outside the screen.
  const fromX = (side === 'left' ? -1 : 1) * size * 0.75
  return { layout: { cx, cy, size, rotation }, side, fromX }
}

// Where the pupils look, in face units: x within about ±0.13, y within ±0.04.
// Darting jumps to a new spot every few frames; fixed stares straight out.
export function gazeAt(elapsedMs: number, mode: 'erratic' | 'fixed', jumpMs: number, hash: (a: number, b: number) => number) {
  if (mode === 'fixed') return { x: 0, y: 0 }
  const slot = Math.floor((elapsedMs + 35 * Math.sin(elapsedMs / 170)) / jumpMs)
  return { x: (hash(slot, 1) * 2 - 1) * 0.13, y: (hash(slot, 2) * 2 - 1) * 0.04 }
}
