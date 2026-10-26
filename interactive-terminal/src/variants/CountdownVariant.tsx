import { useEffect, useRef, useState } from 'react'
import { playBeep, playGlitch } from '../audio/sfx'
import { TerminalInput } from '../components/TerminalInput'
import { normalizeIdentity } from '../domain/recognition'
import { sabotageKeystroke } from '../domain/sabotage'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

const COUNTDOWN_S = 30
/** This variant cuts the visitor off mid-name: keystrokes that were already on their way are dropped. */
const ARM_MS = 1200
/** The jumpscare hits a few seconds before the clock runs out (between 3 and 6 left). */
const pickScareAt = () => 3 + Math.floor(Math.random() * 4)
/** Chance that a keystroke comes out wrong, while the text is still on track. */
const SABOTAGE_CHANCE = 0.6
const TARGET = 'cancelar'

/** True while what is typed could still become CANCELAR (case, accents and spaces aside). */
const onTrack = (value: string) => !/\s/.test(value.trim()) && TARGET.startsWith(normalizeIdentity(value))
const HINT = 'ESCRIBE «CANCELAR» Y PULSA ENTER'

const threats = ['DEMASIADO TARDE.', 'ELIMINACIÓN COMPLETADA.', 'NUNCA HUBO NADA QUE CANCELAR.']
const cancelledThreats = ['CANCELAR NUNCA FUE UNA OPCIÓN.', 'BUEN INTENTO.', 'NUNCA HUBO NADA QUE CANCELAR.']

/** 30 s to type CANCELAR while the terminal quietly rewrites the visitor's letters. */
export function CountdownVariant({ identity, onFinal }: VariantProps) {
  const [left, setLeft] = useState(COUNTDOWN_S)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(HINT)
  const [denied, setDenied] = useState(0)
  const [scareAt] = useState(pickScareAt)
  const [armed, setArmed] = useState(false)
  const { schedule } = useTimers()
  const finishedRef = useRef(false)

  const finish = (finalThreats: string[]) => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinal({ name: identity.name, threats: finalThreats, scare: true })
  }

  useEffect(() => schedule(ARM_MS, () => setArmed(true)), [schedule])

  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (left <= 10 && left > scareAt) playBeep(left <= 6 ? 990 : 660, 0.08, 0.05)
    if (left <= scareAt) finish(threats)
    // Only once per tick, not on every keystroke.
  }, [left, scareAt])

  const onChange = (value: string) => {
    // Once the text is wrong it is left alone until the visitor fixes it.
    const grew = value.length > input.length
    const strike = grew && value.length > 1 && onTrack(value) && Math.random() < SABOTAGE_CHANCE
    setInput(strike ? sabotageKeystroke(value) : value)
    setFeedback(HINT)
  }

  const onSubmit = () => {
    if (!input.trim()) return
    // Getting CANCELAR through the sabotage only brings the jumpscare forward.
    if (normalizeIdentity(input) === TARGET) {
      finish(cancelledThreats)
      return
    }
    playGlitch(0.2)
    setDenied((count) => count + 1)
    setFeedback(`COMANDO NO RECONOCIDO: «${input.toUpperCase()}»`)
    setInput('')
  }

  const clock = `00:${String(left).padStart(2, '0')}`
  const critical = left <= 10

  return (
    <section className="stage" aria-live="polite">
      <div className="alert-wash" aria-hidden="true" />
      <p className="kicker text-blood glow-red">ENTRADA NO AUTORIZADA // PROTOCOLO 404-Ω</p>
      <h1 className="title glitch glow-white" data-text="ELIMINACIÓN EN CURSO">ELIMINACIÓN EN CURSO</h1>
      <p className={`countdown text-blood glow-red${critical ? ' blink' : ''}`} aria-label={`${left} segundos`}>
        {clock}
      </p>
      <TerminalInput id="cancel" value={input} onChange={onChange} onSubmit={onSubmit} frozen={!armed || left <= scareAt} maxLength={16} describedBy="cancel-help" />
      <p id="cancel-help" className={`fine ${denied ? 'text-blood' : 'text-blood-dim'}`}>{feedback}</p>
    </section>
  )
}
