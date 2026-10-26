import { useEffect, useRef, useState } from 'react'
import { playBeep, playGlitch, playKey, playReveal, unlockAudio } from '../audio/sfx'
import { OfficeImage } from '../components/OfficeImage'
import { addPick, databaseNames, loadPickCounts, pickPair, savePickCounts } from '../domain/survivorPicks'
import { useTimers } from '../hooks/useTimers'
import type { VariantProps } from './types'

type Phase = 'choose' | 'chosen' | 'first-gone' | 'both-gone'

const DECIDE_S = 15
const CHOSEN_MS = 1800
const FIRST_GONE_MS = 1700
const BOTH_GONE_MS = 2200

/** Personalized against the visitor's own choice (or their refusal to make one). */
function threatsFor(saved: string, sacrificed: string, byVisitor: boolean): string[] {
  if (!byVisitor) {
    return [
      'NO ELEGIR TAMBIÉN ES ELEGIR.',
      `${sacrificed.toUpperCase()} CONFIABA EN TI.`,
      'TU SILENCIO LOS MATÓ A LOS DOS.',
    ]
  }
  return [
    `${sacrificed.toUpperCase()} TE ESCUCHÓ ELEGIR.`,
    `${saved.toUpperCase()} NO TE LO VA A AGRADECER.`,
    `ELEGISTE RÁPIDO. ${sacrificed.toUpperCase()} LO NOTÓ.`,
    'LOS DOS MURIERON PENSANDO EN TI.',
  ]
}

/** Save one of two people from the database; the AI kills both and turns the choice against the visitor. */
export function SurvivorVariant({ identity, onFinal }: VariantProps) {
  const { schedule } = useTimers()
  const [pair] = useState(() => pickPair(databaseNames(), identity.name))
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
    if (byVisitor) {
      // Counted silently for now; not shown on screen.
      savePickCounts(addPick(loadPickCounts(), saved))
    }
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

  // Not choosing (or running out of time) lets the AI choose.
  const skip = () => decide(Math.random() < 0.5 ? 0 : 1, false)

  // If the visitor does not choose, the AI does.
  useEffect(() => {
    if (phase !== 'choose') return
    if (left === 0) {
      skip()
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
      if (event.key === '0') skip()
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
    const saved = pair[savedIndex ?? 0].toUpperCase()
    if (phase === 'chosen') return `SALVASTE A ${saved}.`
    if (phase === 'first-gone') return `${pair[sacrificedIndex ?? 1].toUpperCase()}: ELIMINADO.`
    return `${saved} TAMBIÉN.`
  })()

  return (
    <section className="stage" aria-live="polite">
      {phase !== 'choose' && phase !== 'chosen' && <div className="alert-wash" aria-hidden="true" />}
      <p className="kicker text-blood glow-red">PROTOCOLO DE SELECCIÓN</p>
      <h1 key={headline} className="survivor-head glitch glow-white screen-in" data-text={headline}>
        {headline}
      </h1>
      <div className="survivor-pair">
        {pair.map((person, index) => (
          <button
            key={`${index}-${person}`}
            type="button"
            className={`survivor-card${savedIndex === index ? ' is-saved' : ''}${isGone(index) ? ' is-gone' : ''}`}
            onClick={() => decide(index as 0 | 1, true)}
            disabled={phase !== 'choose'}
          >
            <OfficeImage kind="person" alt={person} />
            <span className="survivor-name">[{index + 1}] {person.toUpperCase()}</span>
            {isGone(index) && <span className="survivor-x" aria-hidden="true">✕</span>}
          </button>
        ))}
      </div>
      <p className="fine text-blood-dim">
        {phase === 'choose'
          ? <>ELIGE CON 1 O 2 · SI NO ELIGES, ELIJO YO EN <span className="text-blood">{left}</span></>
          : ' '}
      </p>
      <button type="button" className="survivor-skip" onClick={skip} disabled={phase !== 'choose'}>
        [0] NO ELEGIR
      </button>
    </section>
  )
}
