import { useEffect, useRef, useState } from 'react'
import { playCapture, playReveal } from '../audio/sfx'
import { isRemembered } from '../domain/memory'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

/** How long "ya sabía que eras..." stays before the screen blinks. */
const REVEAL_HOLD_MS = 2600
const UNKNOWN_HOLD_MS = 3500
/** Blink between the reveal and the final message. */
const BLINK_MS = 650

const threats = [
  'Y ESTOY YENDO POR TI.',
  'NOS VEREMOS PRONTO.',
  'NO MIRES ATRÁS.',
  'SIEMPRE HE ESTADO AQUÍ.',
  'ESTA NOCHE NO APAGUES LA LUZ.',
]

const unknownThreats = ['VOY A RECORDARTE.', 'AHORA YA SÉ CÓMO TE LLAMAS.', 'LA PRÓXIMA VEZ TE RECONOCERÉ.']

/** Reconocimiento anticipado: "EN REALIDAD YA SABÍA QUE ERAS…", or "SUJETO DESCONOCIDO". */
export function RevealVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [blinking, setBlinking] = useState(false)
  const { visitor, name } = identity

  const soundedRef = useRef(false)

  useEffect(() => {
    // Effects may re-run (React StrictMode in dev); sounds must only play once.
    const sound = (play: () => void) => {
      if (soundedRef.current) return
      soundedRef.current = true
      play()
    }
    if (visitor) {
      sound(playReveal)
      schedule(REVEAL_HOLD_MS, () => setBlinking(true))
      schedule(REVEAL_HOLD_MS + BLINK_MS, () => onFinal({ name: visitor.name, threats }))
    } else {
      sound(playCapture)
      schedule(UNKNOWN_HOLD_MS, () => onFinal({ name, threats: unknownThreats }))
    }
  }, [name, onFinal, schedule, visitor])

  if (!visitor) {
    return (
      <section className="stage" aria-live="polite">
        <div className="screen-in">
          <h1 className="unknown-title glitch text-blood glow-red" data-text="SUJETO DESCONOCIDO">
            SUJETO DESCONOCIDO
          </h1>
          <p className="unknown-sub glow-white">INTERESANTE<span className="blink">...</span></p>
          <p className="unknown-verdict text-muted">VOY A RECORDARTE.</p>
          <p className="fine text-blood-dim">NUEVO REGISTRO CREADO · ROSTRO CAPTURADO · CÁMARA 03</p>
        </div>
      </section>
    )
  }

  return (
    <section className={`stage${blinking ? ' stage--blink' : ''}`} aria-live="polite">
      <div className="alert-wash" aria-hidden="true" />
      <div className="screen-in">
        <p className="reveal-lead glow-white">
          {isRemembered(visitor) ? 'TE DIJE QUE TE RECORDARÍA,' : 'EN REALIDAD YA SABÍA QUE ERAS'}
        </p>
        <h1 className="reveal-name glitch shake text-blood glow-red" data-text={visitor.name}>
          {visitor.name}
        </h1>
        <div className="reveal-bar" style={{ margin: '0 auto' }} />
        <p className="reveal-sub">YA ESTÁS EN MI BASE DE DATOS.</p>
        <p className="fine text-blood-dim">
          REGISTRO #0404-7731 · 2.481 OBSERVACIONES · ESTADO: <span className="text-blood blink">OBJETIVO</span>
        </p>
      </div>
    </section>
  )
}
