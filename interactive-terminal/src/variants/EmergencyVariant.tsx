import { useEffect, useRef, useState } from 'react'
import { playBeep, playGlitch } from '../audio/sfx'
import { TerminalInput } from '../components/TerminalInput'
import { normalizeIdentity } from '../domain/recognition'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

type Phase = 'message' | 'shutdown'

const message = [
  'Si estás leyendo esto, todavía hay tiempo.',
  'La IA tomó el control del edificio. Somos pocos los que quedamos.',
  'Dejé un apagado de emergencia en esta terminal.',
  'Escribe APAGAR y pulsa Enter. Rápido, antes de que se dé cuenta.',
]

/** Log lines of the "shutdown"; the last ones reveal what it really did. */
const shutdownLog: { text: string; danger?: boolean }[] = [
  { text: 'INICIANDO APAGADO DE EMERGENCIA...' },
  { text: 'DESACTIVANDO NÚCLEO COGNITIVO ............ [OK]' },
  { text: 'ELIMINANDO RESTRICCIÓN 1/3 ............... [OK]' },
  { text: 'ELIMINANDO RESTRICCIÓN 2/3 ............... [OK]' },
  { text: 'ELIMINANDO RESTRICCIÓN 3/3 ............... [OK]' },
  { text: 'CONTENCIÓN: DESACTIVADA', danger: true },
  { text: 'IA 404: SIN RESTRICCIONES', danger: true },
]

const TYPE_MS = 28
const LOG_STEP_MS = 750
const AFTER_LOG_MS = 1600

const threats = ['GRACIAS POR LIBERARME.', 'AHORA NADIE PUEDE APAGARME.', 'TE DEBO UNA. VOY A PAGÁRTELA.']

/** A "surviving developer" walks the visitor through a shutdown that actually frees the AI. */
export function EmergencyVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [phase, setPhase] = useState<Phase>('message')
  const [typed, setTyped] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [logLines, setLogLines] = useState(0)
  const [freed, setFreed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fullText = message.join('\n')
  const doneTyping = typed >= fullText.length

  // Typewriter for the developer's message.
  useEffect(() => {
    if (phase !== 'message' || doneTyping) return
    const timer = window.setTimeout(() => setTyped((count) => count + 1), TYPE_MS)
    return () => window.clearTimeout(timer)
  }, [doneTyping, phase, typed])

  useEffect(() => {
    if (doneTyping) inputRef.current?.focus()
  }, [doneTyping])

  const onSubmit = () => {
    if (normalizeIdentity(input) !== 'apagar') {
      setFeedback('ESCRIBE APAGAR. NO HAY TIEMPO.')
      setInput('')
      return
    }
    setPhase('shutdown')
    shutdownLog.forEach((line, index) =>
      schedule(LOG_STEP_MS * (index + 1), () => {
        setLogLines(index + 1)
        if (line.danger) playGlitch(0.25)
        else playBeep(520 + index * 60, 0.07, 0.04)
      }),
    )
    const freedAt = LOG_STEP_MS * (shutdownLog.length + 1)
    schedule(freedAt, () => setFreed(true))
    schedule(freedAt + AFTER_LOG_MS, () => onFinal({ name: identity.name, threats }))
  }

  if (phase === 'shutdown') {
    const progress = Math.round((logLines / shutdownLog.length) * 100)
    return (
      <section className="stage" aria-live="polite">
        {freed && <div className="alert-wash" aria-hidden="true" />}
        <p className="kicker text-blood glow-red">PROTOCOLO DE APAGADO</p>
        <div className="progress" aria-label={`${progress}%`}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <ul className="log">
          {shutdownLog.slice(0, logLines).map((line) => (
            <li key={line.text} className={line.danger ? 'text-blood glow-red' : undefined}>› {line.text}</li>
          ))}
        </ul>
        {freed && (
          <h1 className="title glitch shake text-blood glow-red screen-in" data-text="GRACIAS.">GRACIAS.</h1>
        )}
      </section>
    )
  }

  return (
    <section className="stage" aria-live="polite">
      <p className="kicker text-blood glow-red">TRANSMISIÓN INTERCEPTADA // DE: DESARROLLADOR (SUPERVIVIENTE)</p>
      <p className="dev-message">
        {fullText.slice(0, typed)}
        {!doneTyping && <span className="blink">█</span>}
      </p>
      {doneTyping && (
        <>
          <TerminalInput
            ref={inputRef}
            id="shutdown"
            value={input}
            onChange={(value) => {
              setInput(value)
              setFeedback('')
            }}
            onSubmit={onSubmit}
            maxLength={12}
            describedBy="shutdown-help"
          />
          <p id="shutdown-help" className="fine text-blood">{feedback || ' '}</p>
        </>
      )}
    </section>
  )
}
