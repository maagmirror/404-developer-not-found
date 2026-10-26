import { useEffect, useRef } from 'react'

// Rendered at a tiny resolution and scaled up with pixelated sampling: reads as degraded surveillance footage.
const WIDTH = 88
const HEIGHT = 110
const LEVELS = 10

function degrade(context: CanvasRenderingContext2D) {
  const frame = context.getImageData(0, 0, WIDTH, HEIGHT)
  const { data } = frame
  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
    const contrasted = Math.min(255, Math.max(0, (luminance - 128) * 1.45 + 112 + (Math.random() - 0.5) * 30))
    const level = Math.round((contrasted / 255) * (LEVELS - 1)) / (LEVELS - 1) * 255
    data[index] = level
    data[index + 1] = level * 0.94
    data[index + 2] = level * 0.92
  }
  context.putImageData(frame, 0, 0)
}

// Without a photo: a featureless head-and-shoulders silhouette in the same degraded style.
function drawSilhouette(context: CanvasRenderingContext2D) {
  context.fillStyle = '#151515'
  context.fillRect(0, 0, WIDTH, HEIGHT)
  context.fillStyle = '#5a5a58'
  context.beginPath()
  context.ellipse(WIDTH / 2, HEIGHT * 0.36, WIDTH * 0.2, HEIGHT * 0.19, 0, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.ellipse(WIDTH / 2, HEIGHT * 0.98, WIDTH * 0.42, HEIGHT * 0.34, 0, Math.PI, 0)
  context.fill()
  context.fillStyle = '#0a0a0a'
  context.fillRect(WIDTH * 0.32, HEIGHT * 0.33, WIDTH * 0.36, HEIGHT * 0.06)
}

export function CreepyPhoto({ url, name, dead, tag }: { url: string; name: string; dead: boolean; tag: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d', { willReadFrequently: true })
    if (!context) return
    let cancelled = false
    if (!url) {
      drawSilhouette(context)
      degrade(context)
      return
    }
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      context.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height)
      degrade(context)
    }
    image.onerror = () => { if (!cancelled) { drawSilhouette(context); degrade(context) } }
    image.src = url
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="creepy-photo">
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} role="img" aria-label={url ? `Fotografía de ${name}` : `Silueta sin fotografía de ${name}`} />
      <i className="creepy-grain" aria-hidden="true" />
      <i className="creepy-bands" aria-hidden="true" />
      <span className="creepy-tag" aria-hidden="true">{tag}</span>
      <span className="creepy-rec" aria-hidden="true">● CAM-04</span>
      {dead && (
        <svg className="dossier-crossout" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength={1} d="M6 10 L94 115" /><path pathLength={1} d="M94 10 L6 115" />
        </svg>
      )}
    </div>
  )
}
