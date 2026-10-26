// Timing and placement of the face. Each glyph cell has its own delay so the face assembles
// from scattered glyphs instead of fading in as one block.
import { faceTotalMs, timing } from '../config'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => { const x = clamp01(value); return x * x * (3 - 2 * x) }

// 0 = pure ambient field, 1 = fully formed face. `delay` is the cell's 0..1 jitter.
export function faceEnvelope(elapsedMs: number, delay: number, stable: boolean): number {
  const { convergeMs, holdMs, dissolveMs } = timing.face
  if (elapsedMs <= 0 || elapsedMs >= faceTotalMs) return 0
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
  size: number
}

// Picks where the face appears inside the safe zone. Positions vary to spread wear on the panel.
export function chooseFaceLayout(random: () => number, width: number, height: number, safeInset: number): FaceLayout {
  const insetX = width * safeInset
  const insetY = height * safeInset
  const usableW = width - insetX * 2
  const usableH = height - insetY * 2
  const portrait = height > width
  // Face height in px; the face is about 0.82 as wide as it is tall, plus room for the caption.
  const size = Math.min(usableH * (portrait ? 0.5 : 0.74), usableW * (portrait ? 0.86 : 0.62)) * (0.9 + random() * 0.1)
  const halfW = size * 0.42
  const halfH = size * 0.5
  const captionRoom = size * 0.22
  const minX = insetX + halfW
  const maxX = width - insetX - halfW
  const minY = insetY + halfH
  const maxY = height - insetY - halfH - captionRoom
  const cx = minX + (maxX - minX) * (portrait ? 0.5 + (random() - 0.5) * 0.3 : 0.2 + random() * 0.6)
  const cy = minY + Math.max(0, maxY - minY) * (0.3 + random() * 0.4)
  return { cx, cy, size }
}
