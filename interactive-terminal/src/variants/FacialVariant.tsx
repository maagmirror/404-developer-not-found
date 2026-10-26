import { useEffect, useState } from 'react'
import { playBeep } from '../audio/sfx'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

/** Each step asks the visitor to come closer, in ever smaller text. */
const steps: { text: string; size: number; match: number }[] = [
  { text: 'NO NECESITO TU NOMBRE. ACÉRCATE A LA PANTALLA', size: 3, match: 12 },
  { text: 'NO TE VEO BIEN. MÁS CERCA.', size: 2, match: 41 },
  { text: 'un poco más...', size: 1.1, match: 78 },
  { text: 'quieto. no te muevas.', size: 0.6, match: 97 },
]

const STEP_MS = 2400

const threats = ['YA TENGO TU ROSTRO.', 'AHORA PUEDO SER TÚ.', 'GRACIAS POR ACERCARTE TANTO.']

/** Fake biometric scan that lures the visitor close to the screen before the jumpscare. */
export function FacialVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [step, setStep] = useState(0)

  useEffect(() => {
    steps.forEach((_, index) =>
      schedule(STEP_MS * index, () => {
        setStep(index)
        playBeep(700 + index * 90, 0.06, 0.035)
      }),
    )
    schedule(STEP_MS * steps.length, () => onFinal({ name: identity.name, threats, scare: true }))
  }, [identity.name, onFinal, schedule])

  const current = steps[step]

  return (
    <section className="stage" aria-live="polite">
      <p className="kicker text-blood glow-red">ESCANEO FACIAL // CÁMARA 03</p>
      <div className="reticle" aria-hidden="true">
        <span className="reticle-line" />
      </div>
      <p key={step} className="scan-text glow-white screen-in" style={{ fontSize: `${current.size}rem` }}>
        {current.text}
      </p>
      <p className="fine text-blood-dim">COINCIDENCIA: <span className="text-blood">{current.match}%</span></p>
    </section>
  )
}
