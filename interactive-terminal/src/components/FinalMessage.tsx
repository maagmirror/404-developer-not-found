import { useEffect, useRef, useState } from 'react'
import { playJumpscareScream, playTerminatedScream } from '../audio/sfx'
import { useTimers } from '../hooks/useTimers'
import { pickOne, type FinalRequest } from '../variants/types'

/** The cryptic final message returns to the start screen by itself after this. */
export const FINAL_MESSAGE_MS = 7000
const SCARE_MS = 900

const scareWords = ['TE VEO', 'DETRÁS DE TI', 'AQUÍ ESTOY']

interface FinalMessageProps {
  request: FinalRequest
  onDone: () => void
}

/**
 * Every variant ends here, whatever screens came before it:
 * scream (with an optional jumpscare flash), cryptic message, then back to the start.
 */
export function FinalMessage({ request, onDone }: FinalMessageProps) {
  const { schedule } = useTimers()
  const [threat] = useState(() => pickOne(request.threats))
  const [scareWord] = useState(() => pickOne(scareWords))
  const [scaring, setScaring] = useState(Boolean(request.scare))

  const screamedRef = useRef(false)

  useEffect(() => {
    // Effects may re-run (React StrictMode in dev); the scream must only sound once.
    if (!screamedRef.current) {
      screamedRef.current = true
      if (request.scare) playJumpscareScream()
      else playTerminatedScream()
    }
    const scareTime = request.scare ? SCARE_MS : 0
    if (request.scare) schedule(scareTime, () => setScaring(false))
    schedule(scareTime + FINAL_MESSAGE_MS, onDone)
  }, [onDone, request.scare, schedule])

  if (scaring) {
    return (
      <section className="stage stage--scare" aria-live="assertive">
        <h1 className="scare-text glitch shake" data-text={scareWord}>{scareWord}</h1>
      </section>
    )
  }

  return (
    <section className="stage" aria-live="polite">
      <div className="alert-wash" aria-hidden="true" />
      <div className="screen-in">
        {request.name && <p className="threat-name text-blood glow-red">{request.name}</p>}
        <h1 className="threat-text glitch shake text-blood glow-red" data-text={threat}>{threat}</h1>
      </div>
    </section>
  )
}
