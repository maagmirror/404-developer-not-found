import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playGlitch } from '../audio/sfx'
import { visitors, type Visitor } from '../data/visitors'
import {
  addRememberedName,
  loadRememberedNames,
  saveRememberedNames,
  toRememberedVisitors,
} from '../domain/memory'
import { findConfidentVisitor, findMatchingVisitors, findTypingMatch, normalizeIdentity } from '../domain/recognition'
import { useTimers } from '../hooks/useTimers'
import type { Identity, Trigger } from '../variants/types'
import { TerminalInput } from './TerminalInput'

/** Short glitch burst over the frozen input before the variant takes over. */
const GLITCH_MS = 420
const IDLE_HINT = 'NO MIENTAS. LO SABRÉ.'
/** The jumpscare cuts in once this many letters are typed. */
const INTERRUPT_AT = 4

interface IdentityPromptProps {
  trigger: Trigger
  /** Watch the typing for someone in the database ("Reconocimiento anticipado"). */
  recognize: boolean
  /** Hand over without the glitch burst (jumpscare). */
  instant?: boolean
  onDone: (identity: Identity) => void
}

/** The start screen of every visit: "¿QUIÉN ERES?" and the name input. */
export function IdentityPrompt({ trigger, recognize, instant = false, onDone }: IdentityPromptProps) {
  const { schedule } = useTimers()
  const [input, setInput] = useState('')
  const [frozen, setFrozen] = useState(false)
  const [feedback, setFeedback] = useState(IDLE_HINT)
  const [rememberedNames, setRememberedNames] = useState(loadRememberedNames)
  const inputRef = useRef<HTMLInputElement>(null)
  const knownVisitors = useMemo(
    () => [...visitors, ...toRememberedVisitors(rememberedNames)],
    [rememberedNames],
  )

  const handOver = useCallback(
    (identity: Identity, skipGlitch = false) => {
      if (frozen) return
      setFrozen(true)
      inputRef.current?.blur()
      if (skipGlitch) {
        onDone(identity)
        return
      }
      playGlitch(GLITCH_MS / 1000)
      schedule(GLITCH_MS, () => onDone(identity))
    },
    [frozen, onDone, schedule],
  )

  // Names are shown inside sentences, so hand them over already uppercased.
  const known = (visitor: Visitor): Identity => ({ visitor, name: visitor.name.toUpperCase() })

  // Two things may cut in before Enter: recognizing someone from the database, which wins,
  // and the jumpscare after a few letters (the name is lost, and it is not saved). The
  // jumpscare holds off while the letters could still become someone it would recognize.
  useEffect(() => {
    if (frozen) return
    const match = recognize ? findTypingMatch(input, knownVisitors) : null
    if (match) {
      handOver(known(match))
      return
    }
    const couldBeKnown = recognize && findMatchingVisitors(input, knownVisitors).length > 0
    if (trigger === 'interrupt' && !couldBeKnown && normalizeIdentity(input).replace(/ /g, '').length >= INTERRUPT_AT) {
      handOver({}, instant)
    }
  }, [frozen, handOver, input, instant, knownVisitors, recognize, trigger])

  const onSubmit = () => {
    if (frozen || normalizeIdentity(input).length === 0) return

    // Only "Reconocimiento anticipado" puts a database name on the visitor; every other event
    // uses exactly what was typed ("Pedro" is not "Pedro Gómez", "Sofi" is not "Sofía").
    const match = recognize ? findConfidentVisitor(input, knownVisitors) : null
    if (match) {
      handOver(known(match), instant)
      return
    }

    // Everyone who submits a new name ends up in the database for the next visit.
    const name = input.trim().replace(/\s+/g, ' ')
    const next = addRememberedName(rememberedNames, name, visitors)
    setRememberedNames(next)
    saveRememberedNames(next)
    handOver({ name: name.toUpperCase() }, instant)
  }

  return (
    <section className={`stage${frozen && !instant ? ' stage--glitching' : ''}`} aria-live="polite">
      <p className="kicker text-blood glow-red">ERROR 404 — CAPDEV NOT FOUND</p>
      <h1 className="title glitch glow-white" data-text="¿QUIÉN ERES?">¿QUIÉN ERES?</h1>
      <label htmlFor="identity" className="label text-muted">ESCRIBE TU NOMBRE</label>
      <TerminalInput
        ref={inputRef}
        id="identity"
        value={input}
        frozen={frozen}
        onChange={(value) => {
          setInput(value)
          setFeedback(IDLE_HINT)
        }}
        onSubmit={onSubmit}
        describedBy="identity-help"
      />
      <p id="identity-help" className="fine text-blood-dim">{feedback}</p>
    </section>
  )
}
