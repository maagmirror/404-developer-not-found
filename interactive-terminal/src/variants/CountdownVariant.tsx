import { useEffect, useRef, useState } from 'react'
import { playBeep, playGlitch } from '../audio/sfx'
import { TerminalInput } from '../components/TerminalInput'
import { normalizeIdentity } from '../domain/recognition'
import { sabotage } from '../domain/sabotage'
import type { VariantProps } from './types'

const COUNTDOWN_S = 30
/** Chance that a keystroke quietly corrupts what was already typed. */
const SABOTAGE_CHANCE = 0.3
const HINT = 'ESCRIBE «CANCELAR» Y PULSA ENTER'

const threats = ['DEMASIADO TARDE.', 'ELIMINACIÓN COMPLETADA.', 'NUNCA HUBO NADA QUE CANCELAR.']

/** 30 s to type CANCELAR while the terminal quietly rewrites the visitor's letters. */
export function CountdownVariant({ identity, onFinal }: VariantProps) {
  const [left, setLeft] = useState(COUNTDOWN_S)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(HINT)
  const [denied, setDenied] = useState(0)
  const finishedRef = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (left <= 10 && left > 0) playBeep(left <= 3 ? 990 : 660, 0.08, 0.05)
    if (left === 0 && !finishedRef.current) {
      finishedRef.current = true
      onFinal({ name: identity.name, threats, scare: true })
    }
  }, [identity.name, left, onFinal])

  const onChange = (value: string) => {
    const grew = value.length > input.length
    setInput(grew && value.length > 2 && Math.random() < SABOTAGE_CHANCE ? sabotage(value) : value)
    setFeedback(HINT)
  }

  const onSubmit = () => {
    if (!input.trim()) return
    // Even a perfect CANCELAR arrives corrupted.
    const received = normalizeIdentity(input) === 'cancelar' ? sabotage(input.toUpperCase()) : input.toUpperCase()
    playGlitch(0.2)
    setDenied((count) => count + 1)
    setFeedback(`COMANDO NO RECONOCIDO: «${received}»`)
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
      <TerminalInput id="cancel" value={input} onChange={onChange} onSubmit={onSubmit} frozen={left === 0} maxLength={16} describedBy="cancel-help" />
      <p id="cancel-help" className={`fine ${denied ? 'text-blood' : 'text-blood-dim'}`}>{feedback}</p>
    </section>
  )
}
