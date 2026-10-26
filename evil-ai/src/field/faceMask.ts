// Draws the hostile face once per appearance and samples it down to the glyph grid.
// `lum` is how bright each cell should become; `red` marks eyes and teeth.
import type { FaceLayout } from '../domain/face'

export interface FaceMask {
  cols: number
  rows: number
  lum: Float32Array
  red: Float32Array
  // 1 inside the head silhouette: there, dark cells stay empty so sockets and mouth read as holes.
  area: Float32Array
}

const SUPERSAMPLE = 3

type Ctx = CanvasRenderingContext2D

// Face in unit space: y from -1 (crown) to 1 (chin), x mirrored around 0.
function headPath(ctx: Ctx) {
  ctx.beginPath()
  ctx.moveTo(0, -1)
  ctx.bezierCurveTo(0.6, -0.98, 0.72, -0.5, 0.67, -0.12)
  ctx.lineTo(0.6, 0.3)
  ctx.bezierCurveTo(0.5, 0.64, 0.24, 0.94, 0, 0.98)
  ctx.bezierCurveTo(-0.24, 0.94, -0.5, 0.64, -0.6, 0.3)
  ctx.lineTo(-0.67, -0.12)
  ctx.bezierCurveTo(-0.72, -0.5, -0.6, -0.98, 0, -1)
  ctx.closePath()
}

function mirrored(ctx: Ctx, draw: (side: 1 | -1) => void) {
  draw(1)
  draw(-1)
}

function polygon(ctx: Ctx, points: number[][], side: number) {
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x * side, y) : ctx.lineTo(x * side, y)))
  ctx.closePath()
  ctx.fill()
}

function line(ctx: Ctx, points: number[][], side: number) {
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x * side, y) : ctx.lineTo(x * side, y)))
  ctx.stroke()
}

function drawLuminance(ctx: Ctx, random: () => number) {
  // Head: lit from above so it reads as a volume, not a flat sticker.
  const shade = ctx.createRadialGradient(0, -0.25, 0.05, 0, -0.1, 1.1)
  shade.addColorStop(0, 'rgba(255,255,255,0.95)')
  shade.addColorStop(0.5, 'rgba(255,255,255,0.6)')
  shade.addColorStop(1, 'rgba(255,255,255,0.22)')
  headPath(ctx)
  ctx.fillStyle = shade
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,1)'
  ctx.lineWidth = 0.05
  ctx.stroke()

  // Circuit traces leaving the head into the field: the face is wired into the system.
  ctx.lineWidth = 0.022
  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  for (const y of [-0.62, -0.18, 0.36, 0.72]) {
    mirrored(ctx, (side) => {
      const edgeX = y < 0.3 ? 0.66 : 0.56
      const bend = 0.95 + random() * 0.5
      const drop = (random() - 0.5) * 0.3
      line(ctx, [[edgeX, y], [bend, y], [bend + 0.15, y + drop], [12, y + drop]], side)
      ctx.fillRect(side * bend - 0.03, y - 0.03, 0.06, 0.06)
    })
  }

  // Seam down the forehead.
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'
  ctx.lineWidth = 0.03
  line(ctx, [[0, -1], [0, -0.3]], 1)

  // Cheek plates.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 0.025
  mirrored(ctx, (side) => line(ctx, [[0.5, 0.06], [0.42, 0.3], [0.38, 0.44]], side))

  // Eye sockets, angled down toward the nose: anger without a cartoon.
  ctx.fillStyle = 'rgba(0,0,0,0.92)'
  mirrored(ctx, (side) => polygon(ctx, [[0.6, -0.3], [0.07, -0.1], [0.09, 0.15], [0.5, 0.1]], side))

  // Mouth: a long, slightly upturned slit.
  ctx.fillStyle = 'rgba(0,0,0,0.92)'
  ctx.beginPath()
  ctx.moveTo(-0.44, 0.38)
  ctx.quadraticCurveTo(0, 0.5, 0.44, 0.38)
  ctx.lineTo(0.32, 0.58)
  ctx.quadraticCurveTo(0, 0.66, -0.32, 0.58)
  ctx.closePath()
  ctx.fill()
}

function drawRed(ctx: Ctx) {
  // Dim red slits; the bright pupils are drawn by the engine every frame so they can move.
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  mirrored(ctx, (side) => polygon(ctx, [[0.5, -0.16], [0.14, -0.04], [0.16, 0.07], [0.46, 0.02]], side))
  // Teeth.
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 0.03
  const teeth: number[][] = []
  for (let index = 0; index <= 10; index += 1) {
    const x = -0.32 + index * 0.064
    teeth.push([x, index % 2 === 0 ? 0.46 : 0.57])
  }
  line(ctx, teeth, 1)
}

function sample(canvas: HTMLCanvasElement, cols: number, rows: number) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const out = new Float32Array(cols * rows)
  const width = canvas.width
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let sum = 0
      for (let y = 0; y < SUPERSAMPLE; y += 1) {
        for (let x = 0; x < SUPERSAMPLE; x += 1) {
          sum += data[((row * SUPERSAMPLE + y) * width + col * SUPERSAMPLE + x) * 4]
        }
      }
      out[row * cols + col] = sum / (SUPERSAMPLE * SUPERSAMPLE * 255)
    }
  }
  return out
}

function render(cols: number, rows: number, cellW: number, cellH: number, layout: FaceLayout, draw: (ctx: Ctx) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = cols * SUPERSAMPLE
  canvas.height = rows * SUPERSAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // Pixel space -> supersampled cell space, then unit face space.
  ctx.scale(SUPERSAMPLE / cellW, SUPERSAMPLE / cellH)
  ctx.translate(layout.cx, layout.cy)
  ctx.rotate(layout.rotation ?? 0)
  ctx.scale(layout.size / 2, layout.size / 2)
  draw(ctx)
  return sample(canvas, cols, rows)
}

export function buildFaceMask(cols: number, rows: number, cellW: number, cellH: number, layout: FaceLayout, random: () => number): FaceMask {
  return {
    cols,
    rows,
    lum: render(cols, rows, cellW, cellH, layout, (ctx) => drawLuminance(ctx, random)),
    red: render(cols, rows, cellW, cellH, layout, drawRed),
    area: render(cols, rows, cellW, cellH, layout, (ctx) => { headPath(ctx); ctx.fillStyle = '#fff'; ctx.fill() }),
  }
}
