import { useEffect, useRef, useState, type ReactNode } from 'react'

interface VideoTilesProps {
  src: string
  /** Rendered inside tile `index` (0–8, row by row). */
  children: (index: number, canvas: ReactNode) => ReactNode
  /** Called when the video cannot play, so the caller can fall back to placeholders. */
  onUnavailable: () => void
}

/** Plays one looping video and paints it, cut into a 3 × 3 grid, onto nine canvases at full quality. */
export function VideoTiles({ src, children, onUnavailable }: VideoTilesProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvases = useRef<(HTMLCanvasElement | null)[]>([])
  const [size, setSize] = useState({ width: 192, height: 192 })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let frame = 0

    const draw = () => {
      const { videoWidth: width, videoHeight: height } = video
      if (width && height) {
        const sw = width / 3
        const sh = height / 3
        canvases.current.forEach((canvas, index) => {
          const ctx = canvas?.getContext('2d')
          if (!canvas || !ctx) return
          ctx.drawImage(video, (index % 3) * sw, Math.floor(index / 3) * sh, sw, sh, 0, 0, canvas.width, canvas.height)
        })
      }
      frame = requestAnimationFrame(draw)
    }

    const onMetadata = () =>
      setSize({ width: Math.round(video.videoWidth / 3) || 192, height: Math.round(video.videoHeight / 3) || 192 })
    video.addEventListener('loadedmetadata', onMetadata)
    void video.play().catch(() => undefined)
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      video.removeEventListener('loadedmetadata', onMetadata)
    }
  }, [])

  return (
    <>
      <video ref={videoRef} src={src} muted loop autoPlay playsInline hidden onError={onUnavailable} />
      {Array.from({ length: 9 }, (_, index) =>
        children(
          index,
          <canvas
            ref={(canvas) => {
              canvases.current[index] = canvas
            }}
            className="office-img captcha-canvas"
            width={size.width}
            height={size.height}
            style={{ aspectRatio: size.width / size.height }}
            aria-hidden="true"
          />,
        ),
      )}
    </>
  )
}
