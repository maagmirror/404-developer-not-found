import { useEffect, useState } from 'react'
import { playBeep, playGlitch, playKey, unlockAudio } from '../audio/sfx'
import { OfficeImage } from '../components/OfficeImage'
import { desks } from '../data/office'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

type Phase = 'select' | 'analyzing' | 'verdict'

const ANALYZE_MS = 1400
const TILE_STEP_MS = 220
const VERDICT_HOLD_MS = 2600

const threats = ['YA NO QUEDA NADIE. SOLO TÚ.', 'TÚ ERES EL ÚLTIMO.', 'PRONTO SERÁN CERO.']

/** "Select every image with living people": the office desks are crime scenes and the answer is always none. */
export function CaptchaVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [phase, setPhase] = useState<Phase>('select')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [flagged, setFlagged] = useState(0)

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

  return (
    <section className="stage" aria-live="polite">
      {phase === 'verdict' && <div className="alert-wash" aria-hidden="true" />}
      <p className="kicker text-blood glow-red">
        {identity.name ? `${identity.name}: ` : ''}ANTES DE SEGUIR, DEMUESTRA QUE ERES HUMANO
      </p>
      <div className="captcha">
        <div className="captcha-head">
          <span>Selecciona todas las imágenes con</span>
          <strong>PERSONAS VIVAS</strong>
        </div>
        <div className="captcha-grid">
          {desks.map((desk, index) => {
            const isFlagged = index < flagged
            return (
              <button
                key={desk.id}
                type="button"
                className={`captcha-tile${selected.has(desk.id) ? ' is-selected' : ''}${isFlagged ? ' is-flagged' : ''}`}
                onClick={() => toggle(desk.id)}
                aria-pressed={selected.has(desk.id)}
              >
                <OfficeImage photo={desk.photo} kind="desk" alt={desk.label} />
                <span className="captcha-tag">EVIDENCIA {index + 1} · {desk.label}</span>
                {isFlagged && <span className="captcha-verdict">SIN SIGNOS VITALES</span>}
              </button>
            )
          })}
        </div>
        <div className="captcha-foot">
          <span className="text-muted">1–9 PARA ELEGIR · ENTER PARA VERIFICAR</span>
          <button type="button" className="captcha-verify" onClick={verify} disabled={phase !== 'select'}>
            {phase === 'select' ? 'VERIFICAR' : 'ANALIZANDO…'}
          </button>
        </div>
      </div>
      {phase === 'verdict' && (
        <p className="captcha-result text-blood glow-red screen-in">
          {selected.size === 0 ? 'CORRECTO.' : 'INCORRECTO.'} HUMANOS VIVOS DETECTADOS: 0
        </p>
      )}
    </section>
  )
}
