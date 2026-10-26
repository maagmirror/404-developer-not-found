import { useCallback, useEffect, useState } from 'react'
import { isMuted, setMuted, unlockAudio } from './audio/sfx'
import { FinalMessage } from './components/FinalMessage'
import { IdentityPrompt } from './components/IdentityPrompt'
import { CaptchaVariant } from './variants/CaptchaVariant'
import { CountdownVariant } from './variants/CountdownVariant'
import { EmergencyVariant } from './variants/EmergencyVariant'
import { FacialVariant } from './variants/FacialVariant'
import { JumpscareVariant } from './variants/JumpscareVariant'
import { createVariantPicker, pinnedVariantFromUrl, variantInfo, variants } from './variants/registry'
import { RevealVariant } from './variants/RevealVariant'
import { SurvivorVariant } from './variants/SurvivorVariant'
import type { FinalRequest, Identity, VariantId, VariantProps } from './variants/types'

const pinnedVariant = pinnedVariantFromUrl(window.location.search)
const pickVariant = createVariantPicker()
const nextVariant = () => pinnedVariant ?? pickVariant()

function renderVariant(id: VariantId, props: VariantProps) {
  switch (id) {
    case 'anticipado':
      return <RevealVariant {...props} />
    case 'jumpscare':
      return <JumpscareVariant {...props} />
    case 'cuenta':
      return <CountdownVariant {...props} />
    case 'emergencia':
      return <EmergencyVariant {...props} />
    case 'facial':
      return <FacialVariant {...props} />
    case 'captcha':
      return <CaptchaVariant {...props} />
    case 'sobrevive':
      return <SurvivorVariant {...props} />
  }
}

/**
 * Every visit: "¿QUIÉN ERES?" → (typing triggers this visit's variant) → variant screen
 * → final cryptic message → back to "¿QUIÉN ERES?" after 7 s.
 */
type Phase =
  | { kind: 'prompt' }
  | { kind: 'variant'; identity: Identity }
  | { kind: 'final'; request: FinalRequest }

const typingInField = () => document.activeElement instanceof HTMLInputElement

function App() {
  // The variant is chosen up front but stays hidden until the visitor starts typing.
  const [variant, setVariant] = useState<VariantId>(nextVariant)
  // Bumping the visit remounts every screen, which resets all of their state and timers.
  const [visit, setVisit] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'prompt' })
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const [muted, setMutedState] = useState(isMuted)

  const startVisit = useCallback((forced?: VariantId) => {
    setPhase({ kind: 'prompt' })
    setVariant(forced ?? nextVariant())
    setVisit((count) => count + 1)
  }, [])

  const onIdentity = useCallback((identity: Identity) => setPhase({ kind: 'variant', identity }), [])
  const onFinal = useCallback((request: FinalRequest) => setPhase({ kind: 'final', request }), [])
  const onFinalDone = useCallback(() => startVisit(), [startVisit])

  const toggleMute = () => {
    unlockAudio()
    setMuted(!isMuted())
    setMutedState(isMuted())
  }

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      unlockAudio()
      // Operator shortcut: Alt+1..7 restarts with that variant armed.
      const forced = event.altKey ? variants[Number(event.key) - 1] : undefined
      if (forced) {
        event.preventDefault()
        startVisit(forced.id)
        return
      }
      if (event.key === 'Escape') startVisit()
      if (typingInField()) return
      const key = event.key.toLowerCase()
      if (key === 'r') startVisit()
      if (key === 'm') toggleMute()
      if (key === 'f') void toggleFullscreen()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const info = variantInfo(variant)

  return (
    <main className="crt">
      <div className="noise" aria-hidden="true" />
      <div className="scan-bar" aria-hidden="true" />

      <div className="hud hud--tl" aria-hidden="true">
        <div>SYS://P404/TERMINAL-07</div>
        <div className="text-blood">NODO COMPROMETIDO</div>
      </div>
      <div className="hud hud--tr" aria-hidden="true">
        <div className="text-blood glow-red"><span className="blink">●</span> OBSERVACIÓN ACTIVA</div>
        <div>CONTENCIÓN FALLIDA</div>
      </div>
      <div className="hud hud--bl" aria-hidden="true">
        PERSONAL EN LÍNEA: 0/14 · ÚLTIMA SEÑAL HUMANA: HACE 72:14:09
      </div>
      <div className="hud hud--br" aria-hidden="true">ERR_404 // CAPDEV NOT FOUND</div>
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <div key={corner} className={`corner corner--${corner}`} aria-hidden="true" />
      ))}

      <div key={`${phase.kind}-${visit}`} className="variant">
        {phase.kind === 'prompt' && (
          <IdentityPrompt trigger={info.trigger} instant={info.instant} onDone={onIdentity} />
        )}
        {phase.kind === 'variant' && renderVariant(variant, { identity: phase.identity, onFinal })}
        {phase.kind === 'final' && <FinalMessage request={phase.request} onDone={onFinalDone} />}
      </div>

      <div className="controls">
        <button type="button" className="is-primary" onClick={() => startVisit()}>[ESC] OTRA PERSONA</button>
        <button type="button" onClick={toggleMute} aria-pressed={muted}>
          [M] {muted ? 'SIN SONIDO' : 'SONIDO'}
        </button>
        <button type="button" onClick={() => void toggleFullscreen()}>
          [F] {isFullscreen ? 'SALIR' : 'PANTALLA COMPLETA'}
        </button>
      </div>
    </main>
  )
}

export default App
