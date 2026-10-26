import { useEffect, useState, type ReactNode } from 'react'
import { playBeep, playGlitch, playKey, unlockAudio } from '../audio/sfx'
import { OfficeImage } from '../components/OfficeImage'
import { VideoTiles } from '../components/VideoTiles'
import { captchaVideoUrl, desks } from '../data/office'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

type Phase = 'select' | 'analyzing' | 'verdict'

const ANALYZE_MS = 1400
const TILE_STEP_MS = 220
const VERDICT_HOLD_MS = 2600

const threats = ['YA NO QUEDA NADIE. SOLO TÚ.', 'TÚ ERES EL ÚLTIMO.', 'PRONTO SERÁN CERO.']

/** "Select every square with life" over a CCTV loop: whatever the visitor picks, it always fails. */
export function CaptchaVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [phase, setPhase] = useState<Phase>('select')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [flagged, setFlagged] = useState(0)
  const [hasVideo, setHasVideo] = useState(true)

  const toggle = (id: string) => {
    if (phase !== 'select') return
    unlockAudio()
    playKey()
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const verify = () => {
    if (phase !== 'select') return
    unlockAudio()
    setPhase('analyzing')
    playBeep(440, 0.12, 0.05)
    desks.forEach((_, index) =>
      schedule(ANALYZE_MS + TILE_STEP_MS * index, () => {
        setFlagged(index + 1)
        playBeep(220, 0.05, 0.04)
      }),
    )
    const verdictAt = ANALYZE_MS + TILE_STEP_MS * desks.length
    schedule(verdictAt, () => {
      setPhase('verdict')
      playGlitch(0.3)
    })
    schedule(verdictAt + VERDICT_HOLD_MS, () => onFinal({ name: identity.name, threats, scare: true }))
  }

  // Keyboard: 1–9 toggles a tile, Enter verifies.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const index = Number(event.key) - 1
      if (index >= 0 && index < desks.length) toggle(desks[index].id)
      if (event.key === 'Enter') {
        event.preventDefault()
        verify()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const tile = (index: number, picture: ReactNode) => {
    const desk = desks[index]
    const isFlagged = index < flagged
    return (
      <button
        key={desk.id}
        type="button"
        className={`captcha-tile${selected.has(desk.id) ? ' is-selected' : ''}${isFlagged ? ' is-flagged' : ''}`}
        onClick={() => toggle(desk.id)}
        aria-pressed={selected.has(desk.id)}
        aria-label={`Casilla ${index + 1}`}
      >
        {picture}
        <span className="captcha-tag">{index + 1}</span>
        {isFlagged && <span className="captcha-verdict">SIN SIGNOS VITALES</span>}
      </button>
    )
  }

  return (
    <section className="stage" aria-live="polite">
      {phase === 'verdict' && <div className="alert-wash" aria-hidden="true" />}
      <p className="kicker text-blood glow-red">
        {identity.name ? `${identity.name}: ` : ''}ANTES DE SEGUIR, DEMUESTRA QUE ERES HUMANO
      </p>
      <div className="captcha">
        <div className="captcha-head">
          <span>Selecciona todas las casillas con</span>
          <strong>VIDA</strong>
        </div>
        <div className={`captcha-grid${hasVideo ? ' is-video' : ''}`}>
          {hasVideo ? (
            <VideoTiles src={captchaVideoUrl} onUnavailable={() => setHasVideo(false)}>
              {(index, canvas) => tile(index, canvas)}
            </VideoTiles>
          ) : (
            desks.map((desk, index) => tile(index, <OfficeImage photo={desk.photo} kind="desk" alt={desk.label} />))
          )}
        </div>
        <div className="captcha-foot">
          <span className="text-muted">1–9 ELEGIR · ENTER VERIFICAR</span>
          <button type="button" className="captcha-verify" onClick={verify} disabled={phase !== 'select'}>
            {phase === 'select' ? 'VERIFICAR' : 'ANALIZANDO…'}
          </button>
        </div>
      </div>
      {/* Always rendered so its space is reserved and the layout does not jump. */}
      <p className={`captcha-result text-blood glow-red${phase === 'verdict' ? ' screen-in' : ' is-pending'}`}>
        VERIFICACIÓN FALLIDA. HUMANOS VIVOS DETECTADOS: 0
      </p>
    </section>
  )
}
