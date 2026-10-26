import { useEffect, useRef, useState } from 'react'
import { playBeep, playGlitch, playKey, playReveal, unlockAudio } from '../audio/sfx'
import { OfficeImage } from '../components/OfficeImage'
import { developers, type Developer } from '../data/office'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

type Phase = 'choose' | 'chosen' | 'first-gone' | 'both-gone'

const DECIDE_S = 15
const CHOSEN_MS = 1800
const FIRST_GONE_MS = 1700
const BOTH_GONE_MS = 2200

function pickPair(): [Developer, Developer] {
  const pool = [...developers]
  const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
  const second = pool[Math.floor(Math.random() * pool.length)] ?? first
  return [first, second]
}

/** Personalized against the visitor's own choice (or their refusal to make one). */
function threatsFor(saved: Developer, sacrificed: Developer, byVisitor: boolean): string[] {
  if (!byVisitor) {
    return [
      'NO ELEGIR TAMBIÉN ES ELEGIR.',
      `${sacrificed.name} CONFIABA EN TI.`,
      'TU SILENCIO LOS MATÓ A LOS DOS.',
    ]
  }
  return [
    `${sacrificed.name} TE ESCUCHÓ ELEGIR.`,
    `${saved.name} NO TE LO VA A AGRADECER.`,
    `ELEGISTE RÁPIDO. ${sacrificed.name} LO NOTÓ.`,
    'LOS DOS MURIERON PENSANDO EN TI.',
  ]
}

/** Save one of two developers; the AI kills both and turns the choice against the visitor. */
export function SurvivorVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [pair] = useState(pickPair)
  const [phase, setPhase] = useState<Phase>('choose')
  const [savedIndex, setSavedIndex] = useState<0 | 1 | null>(null)
  const [left, setLeft] = useState(DECIDE_S)
  const decidedRef = useRef(false)

  const decide = (index: 0 | 1, byVisitor: boolean) => {
    if (decidedRef.current) return
    decidedRef.current = true
    unlockAudio()
    playKey()
    setSavedIndex(index)
    setPhase('chosen')

    const saved = pair[index]
    const sacrificed = pair[index === 0 ? 1 : 0]
    schedule(CHOSEN_MS, () => {
      setPhase('first-gone')
      playGlitch(0.3)
    })
    schedule(CHOSEN_MS + FIRST_GONE_MS, () => {
      setPhase('both-gone')
      playReveal()
    })
    schedule(CHOSEN_MS + FIRST_GONE_MS + BOTH_GONE_MS, () =>
      onFinal({ name: identity.name, threats: threatsFor(saved, sacrificed, byVisitor) }),
    )
  }

  // If the visitor does not choose, the AI does.
  useEffect(() => {
    if (phase !== 'choose') return
    if (left === 0) {
      decide(Math.random() < 0.5 ? 0 : 1, false)
      return
    }
    if (left <= 5) playBeep(660, 0.06, 0.04)
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === '1' || event.key === 'ArrowLeft') decide(0, true)
      if (event.key === '2' || event.key === 'ArrowRight') decide(1, true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const sacrificedIndex = savedIndex === null ? null : savedIndex === 0 ? 1 : 0
  const isGone = (index: number) =>
    phase === 'both-gone' || (phase === 'first-gone' && index === sacrificedIndex)

  const headline = (() => {
    if (phase === 'choose') {
      return identity.name ? `${identity.name}, SOLO PUEDO DEJAR VIVO A UNO.` : 'SOLO PUEDO MANTENER CON VIDA A UNO.'
    }
    const saved = pair[savedIndex ?? 0]
    if (phase === 'chosen') return `SALVASTE A ${saved.name}.`
    if (phase === 'first-gone') return `${pair[sacrificedIndex ?? 1].name}: ELIMINADO.`
    return `${saved.name} TAMBIÉN.`
  })()

  return (
    <section className="stage" aria-live="polite">
      {phase !== 'choose' && phase !== 'chosen' && <div className="alert-wash" aria-hidden="true" />}
      <p className="kicker text-blood glow-red">PROTOCOLO DE SELECCIÓN</p>
      <h1 key={headline} className="survivor-head glitch glow-white screen-in" data-text={headline}>
        {headline}
      </h1>
      <div className="survivor-pair">
        {pair.map((developer, index) => (
          <button
            key={developer.id}
            type="button"
            className={`survivor-card${savedIndex === index ? ' is-saved' : ''}${isGone(index) ? ' is-gone' : ''}`}
            onClick={() => decide(index as 0 | 1, true)}
            disabled={phase !== 'choose'}
          >
            <OfficeImage photo={developer.photo} kind="person" alt={developer.name} />
            <span className="survivor-name">[{index + 1}] {developer.name}</span>
            <span className="survivor-role text-muted">{developer.role}</span>
            {isGone(index) && <span className="survivor-x" aria-hidden="true">✕</span>}
          </button>
        ))}
      </div>
      <p className="fine text-blood-dim">
        {phase === 'choose'
          ? <>ELIGE CON 1 O 2 · SI NO ELIGES, ELIJO YO EN <span className="text-blood">{left}</span></>
          : ' '}
      </p>
    </section>
  )
}
