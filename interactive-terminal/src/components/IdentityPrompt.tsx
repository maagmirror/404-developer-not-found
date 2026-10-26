import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playGlitch } from '../audio/sfx'
import { visitors, type Visitor } from '../data/visitors'
import {
  addRememberedName,
  loadRememberedNames,
  saveRememberedNames,
  toRememberedVisitors,
} from '../domain/memory'
import { classifySubmission, findUniqueVisitor, normalizeIdentity } from '../domain/recognition'
import { useTimers } from '../hooks/useTimers'
import type { Identity, Trigger } from '../variants/types'
import { TerminalInput } from './TerminalInput'

/** Short glitch burst over the frozen input before the variant takes over. */
const GLITCH_MS = 420
const IDLE_HINT = 'NO MIENTAS. LO SABRÉ.'

interface IdentityPromptProps {
  trigger: Trigger
  /** Hand over without the glitch burst (jumpscare). */
  instant?: boolean
  onDone: (identity: Identity) => void
}

/** The start screen of every visit: "¿QUIÉN ERES?" and the name input. */
export function IdentityPrompt({ trigger, instant = false, onDone }: IdentityPromptProps) {
  const { schedule } = useTimers()
  const [input, setInput] = useState('')
  const [frozen, setFrozen] = useState(false)
  const [feedback, setFeedback] = useState(IDLE_HINT)
  const [rememberedNames, setRememberedNames] = useState(loadRememberedNames)
  // Interrupting variants strike after 2–4 letters so it cannot be anticipated.
  const [interruptAfter] = useState(() => 2 + Math.floor(Math.random() * 3))
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

  useEffect(() => {
    if (frozen) return
    if (trigger === 'recognize') {
      const unique = findUniqueVisitor(input, knownVisitors)
      if (unique) handOver(known(unique))
    }
    if (trigger === 'interrupt' && normalizeIdentity(input).replace(/ /g, '').length >= interruptAfter) {
      // The name is only "known" if those few letters already single someone out.
      const unique = findUniqueVisitor(input, knownVisitors)
      handOver(unique ? known(unique) : {}, instant)
    }
  }, [frozen, handOver, input, instant, interruptAfter, knownVisitors, trigger])

  const onSubmit = () => {
    if (frozen || normalizeIdentity(input).length === 0) return

    const decision = classifySubmission(input, knownVisitors)
    if (decision.kind === 'known') {
      handOver(known(decision.visitor))
      return
    }
    if (decision.kind === 'ambiguous' && trigger === 'recognize') {
      setFeedback('NO TE RECONOZCO DEL TODO… SIGUE ESCRIBIENDO')
      inputRef.current?.focus()
      return
    }

    const name = input.trim().replace(/\s+/g, ' ')
    if (decision.kind === 'unknown') {
      // "VOY A RECORDARTE" is a promise: the next visit recognizes this name.
      const next = addRememberedName(rememberedNames, name, visitors)
      setRememberedNames(next)
      saveRememberedNames(next)
    }
    handOver({ name: name.toUpperCase() })
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
