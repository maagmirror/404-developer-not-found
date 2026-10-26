// Canvas renderer for the ambient field: several panes of scrolling "machine logs" that the face
// borrows its glyphs from. Glyphs are bucketed by color so each frame changes fillStyle a dozen times,
// not once per cell.
import { timing } from '../config'
import { codeLines, fillerGlyphs, shadeRamp } from '../data/codeLines'
import { faceDuration, faceEnvelope, gazeAt, type FaceLayout, type FaceTiming } from '../domain/face'
import { buildFaceMask, type FaceMask } from './faceMask'

export interface ActiveFace {
  // Unique per appearance; a new key rebuilds the mask.
  key: number
  startedAt: number
  layout: FaceLayout
  timing: FaceTiming
  gaze: 'erratic' | 'fixed'
  tremble: boolean
  slide?: { fromX: number; inMs: number; outMs: number }
}

// Per-frame overrides from the show: field speed in rows per second (null = normal drift)
// and how many rows tear sideways (0..1).
export interface Motion {
  speed: number | null
  glitch: number
}

// Eye centres in face units (see the slits in faceMask.ts).
const EYE_X = 0.32
const EYE_Y = -0.04
const easeOut = (x: number) => 1 - (1 - x) ** 3
const easeIn = (x: number) => x ** 3
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

interface Line {
  id: number
  text: string
  alert: boolean
  base: number
  born: number
}

interface Pane {
  col: number
  width: number
  speed: number
  scroll: number
  lines: Line[]
}

const FONT_STACK = '"Cascadia Mono", "IBM Plex Mono", Consolas, "Courier New", monospace'
const GRAYS = Array.from({ length: 12 }, (_, index) => {
  const value = Math.round(34 + (index / 11) * 200)
  return `rgb(${value},${value},${Math.round(value * 0.97)})`
})
const REDS = ['#4a0b14', '#7c1222', '#b81a2d', '#ff4155']
const TYPE_SPEED = 0.05 // chars per ms for the newest line of each pane

// Cheap integer hash -> [0, 1). Stateless so flicker does not need per-cell storage.
function hash(a: number, b: number, c: number) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35) ^ Math.imul(c + 0x27d4eb2f, 0x165667b1)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296
}

export class FieldEngine {
  private ctx: CanvasRenderingContext2D
  private random: () => number
  private width = 0
  private height = 0
  private dpr = 1
  private cellW = 10
  private cellH = 18
  private fontSize = 16
  private cols = 0
  private rows = 0
  private panes: Pane[] = []
  private lineId = 0
  private faceKey = -1
  private mask: FaceMask | null = null
  private delays = new Float32Array(0)
  private buckets: number[][] = []

  constructor(private canvas: HTMLCanvasElement, random: () => number) {
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.random = random
  }

  get metrics() {
    return { width: this.width, height: this.height, cellW: this.cellW, cellH: this.cellH, cols: this.cols, rows: this.rows }
  }

  resize(width: number, height: number, dpr: number, now: number) {
    this.width = width
    this.height = height
    this.dpr = Math.min(dpr, 2)
    this.canvas.width = Math.round(width * this.dpr)
    this.canvas.height = Math.round(height * this.dpr)
    this.fontSize = Math.max(12, Math.min(22, Math.round(Math.min(width, height) / 60)))
    this.cellW = this.fontSize * 0.62
    this.cellH = this.fontSize * 1.18
    // One extra row and column so the slow drift never shows an empty edge.
    this.cols = Math.ceil(width / this.cellW) + 2
    this.rows = Math.ceil(height / this.cellH) + 2
    const paneCount = Math.max(1, Math.round(this.cols / 64))
    const paneWidth = Math.ceil(this.cols / paneCount)
    this.panes = Array.from({ length: paneCount }, (_, index) => {
      const pane: Pane = { col: index * paneWidth, width: paneWidth, speed: 0.55 + this.random() * 0.7, scroll: this.random(), lines: [] }
      for (let row = 0; row < this.rows + 1; row += 1) pane.lines.push(this.newLine(now - 60000))
      return pane
    })
    this.faceKey = -1
    this.mask = null
    this.delays = new Float32Array(this.cols * this.rows)
  }

  private newLine(now: number): Line {
    if (this.random() < 0.14) return { id: this.lineId++, text: '', alert: false, base: 0, born: now }
    let text = codeLines[Math.floor(this.random() * codeLines.length)]
    const alert = text.startsWith('!')
    if (alert) text = text.slice(1)
    text = text
      .replace(/#/g, () => Math.floor(this.random() * 256).toString(16).padStart(2, '0').toUpperCase())
      .replace(/@/g, () => Math.floor(1 + this.random() * 24).toString().padStart(2, '0'))
      .replace(/%/g, () => `${Math.floor(this.random() * 100)}%`)
    const indent = ' '.repeat(this.random() < 0.6 ? Math.floor(this.random() * 6) : 0)
    return { id: this.lineId++, text: indent + text, alert, base: 0.14 + this.random() * 0.24, born: now }
  }

  private syncFace(face: ActiveFace | null) {
    if (!face) {
      this.faceKey = -1
      this.mask = null
      return
    }
    if (face.key === this.faceKey) return
    this.faceKey = face.key
    // The grid is drawn about one cell up-left of the screen origin (see the drift in render).
    const layout = { ...face.layout, cx: face.layout.cx + this.cellW, cy: face.layout.cy + this.cellH * 0.5 }
    this.mask = buildFaceMask(this.cols, this.rows, this.cellW, this.cellH, layout, this.random)
    for (let index = 0; index < this.delays.length; index += 1) this.delays[index] = this.random()
  }

  // Small bright pupils inside the slits. Darting: they jump to a new spot every ~0.1 s.
  private drawPupils(face: ActiveFace, elapsed: number, stable: boolean, offsetX: number, offsetY: number, buckets: number[][], chars: string[]) {
    const { cellW, cellH } = this
    const f = faceEnvelope(elapsed, 0.5, true, face.timing)
    if (f < 0.35) return
    const unit = face.layout.size / 2
    const gaze = gazeAt(elapsed, face.gaze, stable ? 600 : timing.gazeJumpMs, (a, b) => hash(face.key, a, b))
    // Same grid shift as the mask (see syncFace).
    const baseX = face.layout.cx + this.cellW + offsetX
    const baseY = face.layout.cy + this.cellH * 0.5 + offsetY
    const cos = Math.cos(face.layout.rotation ?? 0)
    const sin = Math.sin(face.layout.rotation ?? 0)
    const radiusX = Math.max(cellW * 0.5, unit * 0.035)
    const radiusY = Math.max(cellH * 0.45, unit * 0.022)
    for (const side of [-1, 1]) {
      // Eye position in face units, turned with the head's tilt.
      const ex = side * EYE_X + gaze.x
      const ey = EYE_Y + gaze.y
      const px = baseX + (ex * cos - ey * sin) * unit
      const py = baseY + (ex * sin + ey * cos) * unit
      for (let row = Math.floor((py - radiusY) / cellH); row <= Math.floor((py + radiusY) / cellH); row += 1) {
        for (let col = Math.floor((px - radiusX) / cellW); col <= Math.floor((px + radiusX) / cellW); col += 1) {
          const dx = (col + 0.5) * cellW - px
          const dy = (row + 0.5) * cellH - py
          if ((dx / (radiusX + cellW * 0.3)) ** 2 + (dy / (radiusY + cellH * 0.3)) ** 2 > 1) continue
          chars.push(f > 0.7 ? '@' : '#')
          buckets[GRAYS.length + (f > 0.7 ? 3 : 2)].push(col * cellW, row * cellH, chars.length - 1)
        }
      }
    }
  }

  render(now: number, dt: number, face: ActiveFace | null, stable: boolean, motion: Motion = { speed: null, glitch: 0 }) {
    this.syncFace(face)
    const { ctx, cellW, cellH, cols, rows, mask } = this
    const faceElapsed = face ? now - face.startedAt : 0
    // The logs slow down while the face holds so it can be read.
    const faceCalm = face ? faceEnvelope(faceElapsed, 0.5, true, face.timing) : 0
    const speedScale = motion.speed === null
      ? (stable ? 0.35 : 1) * (1 - faceCalm * 0.8)
      : motion.speed * (stable ? 0.15 : 1)
    const glitchRate = stable ? 0.0006 : 0.004
    const flickerSlot = Math.floor(now / 180)
    const faceSlot = Math.floor(now / (stable ? 1200 : 380))
    const breathe = 0.92 + 0.08 * Math.sin(now / 900)

    // Torn rows: whole lines shoved sideways for a few frames. Off in stable mode.
    const tear = stable ? 0 : motion.glitch
    const tearSlot = Math.floor(now / 70)
    const rowShift = (row: number) => (tear > 0 && hash(row, tearSlot, 5) < tear * 0.35 ? (hash(tearSlot, row, 9) - 0.5) * cellW * 26 : 0)

    // Face offset: the peek slides in and out, the stare trembles.
    let faceX = 0
    let faceY = 0
    if (face?.slide) {
      const { fromX, inMs, outMs } = face.slide
      const total = faceDuration(face.timing)
      faceX = fromX * (1 - easeOut(clamp01(faceElapsed / inMs))) + fromX * easeIn(clamp01((faceElapsed - (total - outMs)) / outMs))
    }
    if (face?.tremble && !stable) {
      const shake = Math.floor(now / 45)
      faceX += (hash(shake, 1, 21) - 0.5) * cellW * 1.1
      faceY += (hash(shake, 2, 21) - 0.5) * cellH * 0.5
    }
    const faceCol = Math.round(faceX / cellW)
    const faceRow = Math.round(faceY / cellH)

    for (const pane of this.panes) {
      // A pane keeps its own character: some columns run faster than others, even in the rush.
      pane.scroll += (pane.speed * speedScale * dt) / 1000
      while (pane.scroll >= 1) {
        pane.scroll -= 1
        pane.lines.shift()
        pane.lines.push(this.newLine(now))
      }
      while (pane.scroll < 0) {
        pane.scroll += 1
        pane.lines.pop()
        pane.lines.unshift(this.newLine(now - 60000))
      }
    }

    if (this.buckets.length === 0) this.buckets = Array.from({ length: GRAYS.length + REDS.length }, () => [])
    const buckets = this.buckets
    for (const bucket of buckets) bucket.length = 0
    const chars: string[] = []

    for (const pane of this.panes) {
      const fraction = pane.scroll
      const newest = pane.lines.length - 1
      for (let row = 0; row < pane.lines.length; row += 1) {
        const line = pane.lines[row]
        const y = (row - fraction) * cellH
        const screenRow = Math.round(row - fraction)
        if (screenRow < 0 || screenRow >= rows) continue
        // Depth: the top of the screen fades out.
        const fade = Math.min(1, 0.35 + (screenRow / rows) * 1.1)
        const revealed = row === newest ? Math.floor((now - line.born) * TYPE_SPEED) : Infinity
        for (let local = 0; local < pane.width - 2; local += 1) {
          const col = pane.col + local
          if (col >= cols) break
          let char = local < line.text.length && local < revealed ? line.text[local] : ' '
          let lum = line.base * (0.75 + 0.25 * hash(line.id, local, 7)) * fade
          let red = line.alert ? 0.3 : 0
          if (row === newest && local === revealed && revealed < line.text.length) { char = '█'; lum = 0.55 }
          if (char !== ' ' && hash(line.id, local, flickerSlot) < glitchRate) {
            char = fillerGlyphs[Math.floor(hash(local, line.id, flickerSlot) * fillerGlyphs.length)]
            lum = Math.min(1, lum * 1.6)
          }

          // Under the face the logs fade out; the face itself is drawn on a fixed grid below,
          // so it stays aligned across panes that scroll at different speeds.
          const maskRow = screenRow - faceRow
          const maskCol = col - faceCol
          if (mask && face && faceElapsed > 0 && maskRow >= 0 && maskRow < rows && maskCol >= 0 && maskCol < cols) {
            const cell = maskRow * cols + maskCol
            const f = faceEnvelope(faceElapsed, this.delays[cell], stable, face.timing)
            if (f > 0) {
              const covered = mask.area[cell] > 0.4 || Math.max(mask.lum[cell], mask.red[cell]) > 0.05
              lum *= covered ? 1 - f : 1 - 0.8 * f
              red *= 1 - f
            }
          }

          if (char === ' ' || lum < 0.035) continue
          let bucket: number
          if (red > 0.25) bucket = GRAYS.length + (red >= 0.85 ? 3 : red >= 0.55 ? 2 : lum > 0.3 ? 1 : 0)
          else bucket = Math.min(GRAYS.length - 1, Math.floor(lum * GRAYS.length))
          chars.push(char)
          buckets[bucket].push(col * cellW + rowShift(screenRow), y, chars.length - 1)
        }
      }
    }

    if (mask && face && faceElapsed > 0) {
      for (let row = 0; row < rows; row += 1) {
        const shift = faceX + rowShift(row + faceRow)
        for (let col = 0; col < cols; col += 1) {
          const cell = row * cols + col
          const f = faceEnvelope(faceElapsed, this.delays[cell], stable, face.timing)
          if (f <= 0) continue
          const target = mask.lum[cell] * breathe
          const eye = mask.red[cell]
          const shape = Math.max(target, eye)
          if (shape <= 0.08 || hash(row, col, 3) >= f) continue
          // Glyph density follows brightness (ASCII shading), with a one-step shimmer so it feels alive.
          const shimmer = hash(col, row, faceSlot + 11) < 0.3 ? 1 : 0
          const char = shadeRamp[Math.min(shadeRamp.length - 1, Math.floor(shape * (shadeRamp.length - 1)) + shimmer)]
          const lum = Math.max(target, eye) * f
          if (lum < 0.035) continue
          const red = eye * f
          const bucket = red > 0.25
            ? GRAYS.length + (red >= 0.85 ? 3 : red >= 0.55 ? 2 : 1)
            : Math.min(GRAYS.length - 1, Math.floor(lum * GRAYS.length))
          chars.push(char)
          buckets[bucket].push(col * cellW + shift, row * cellH + faceY, chars.length - 1)
        }
      }
      this.drawPupils(face, faceElapsed, stable, faceX, faceY, buckets, chars)
    }

    const drift = stable ? 0.3 : 1
    const dx = Math.sin(now / 53000) * cellW * 1.2 * drift - cellW
    const dy = Math.sin(now / 71000) * cellH * 0.6 * drift - cellH * 0.5
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.font = `${this.fontSize}px ${FONT_STACK}`
    ctx.textBaseline = 'top'
    ctx.translate(dx, dy)
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index]
      if (bucket.length === 0) continue
      ctx.fillStyle = index < GRAYS.length ? GRAYS[index] : REDS[index - GRAYS.length]
      for (let item = 0; item < bucket.length; item += 3) ctx.fillText(chars[bucket[item + 2]], bucket[item], bucket[item + 1])
    }
  }
}
