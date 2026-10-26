// A clip framed as a security camera. Mounted a few seconds early (hidden) so it can buffer;
// `active` starts playback. Any failure reports back so the show returns to the field.
import { useEffect, useRef, useState } from 'react'
import type { VideoEntry } from '../domain/manifest'

export type ClipStatus = 'pendiente' | 'listo' | 'error' | 'no soportado' | 'placeholder'

interface Props {
  video: VideoEntry
  // On screen (playing, or frozen under the signal cut on the way out).
  visible: boolean
  active: boolean
  paused: boolean
  muted: boolean
  volume: number
  onFinish: (reason: 'ended' | 'error') => void
  onStatus: (id: string, status: ClipStatus, durationMs?: number) => void
}

const pad = (value: number) => value.toString().padStart(2, '0')

function CctvClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <span className="cctv-time">
      {pad(now.getDate())}/{pad(now.getMonth() + 1)}/{now.getFullYear()} {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  )
}

export function VideoInterlude({ video, visible, active, paused, muted, volume, onFinish, onStatus }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const finished = useRef(false)
  const finish = (reason: 'ended' | 'error') => {
    if (finished.current || !active) return
    finished.current = true
    onFinish(reason)
  }
  const supported = video.src === null || (typeof document !== 'undefined' && document.createElement('video').canPlayType(video.mimeType) !== '')

  useEffect(() => {
    if (video.src === null) onStatus(video.id, 'placeholder')
    else if (!supported) onStatus(video.id, 'no soportado')
  }, [onStatus, supported, video.id, video.src])

  useEffect(() => {
    if (active && video.src !== null && !supported) finish('error')
  }, [active, supported])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    element.volume = volume
    element.muted = muted
  }, [muted, volume])

  useEffect(() => {
    const element = ref.current
    if (!element || !supported) return
    if (!active || paused) { element.pause(); return }
    element.play().catch((error: DOMException) => {
      // Autoplay with sound refused: fall back to muted playback rather than losing the clip.
      if (error.name === 'NotAllowedError' && !element.muted) {
        element.muted = true
        element.play().catch(() => finish('error'))
      } else if (error.name !== 'AbortError') finish('error')
    })
  }, [active, paused, supported])

  return (
    <section className={`cctv${visible ? ' is-visible' : ''}${video.cctv ? ' is-treated' : ''}`} aria-hidden={!visible}>
      {video.src && supported ? (
        <video
          ref={ref}
          className={`cctv-video fit-${video.fit}`}
          src={video.src}
          preload="auto"
          muted
          playsInline
          disablePictureInPicture
          onLoadedMetadata={(event) => onStatus(video.id, 'listo', Math.round(event.currentTarget.duration * 1000))}
          onEnded={() => finish('ended')}
          onError={() => { onStatus(video.id, 'error'); finish('error') }}
        />
      ) : (
        <div className="cctv-placeholder">
          <div className="cctv-room" />
          <p className="cctv-lost">SIN SEÑAL DE VIDEO</p>
          <p className="cctv-hint">{video.src ? `Formato no soportado: ${video.file}` : 'Placeholder — copiá clips en evil-ai/media/videos/'}</p>
        </div>
      )}
      <div className="cctv-grain" />
      <div className="cctv-overlay">
        <span className="cctv-rec"><i /> REC</span>
        <span className="cctv-label">{video.label}</span>
        <CctvClock />
        <span className="cctv-site">ERR_404 // VIGILANCIA INTERNA</span>
      </div>
    </section>
  )
}
