/* Superseded first-cut interface retained in the working tree history during redesign.
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  advanceSimulation,
  createSimulation,
  phaseDurations,
  type Developer,
  type SimulationState,
} from './domain/simulation'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ACCEPTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface RosterEntry {
  id: string
  name: string
  photo: File | null
  photoUrl: string
  photoError: string
}

let rosterId = 1
const newEntry = (): RosterEntry => ({
  id: `subject-${rosterId++}`,
  name: '',
  photo: null,
  photoUrl: '',
  photoError: '',
})

const entryIsValid = (entry: RosterEntry) => entry.name.trim().length >= 2 && Boolean(entry.photoUrl) && !entry.photoError
const isTyping = () => document.activeElement instanceof HTMLInputElement

function RosterSetup({
  roster,
  setRoster,
  onPlay,
}: {
  roster: RosterEntry[]
  setRoster: React.Dispatch<React.SetStateAction<RosterEntry[]>>
  onPlay: () => void
}) {
  const valid = roster.length >= 1 && roster.every(entryIsValid)

  const updatePhoto = (id: string, file?: File) => {
    setRoster((current) => current.map((entry) => {
      if (entry.id !== id) return entry
      if (entry.photoUrl) URL.revokeObjectURL(entry.photoUrl)
      if (!file) return { ...entry, photo: null, photoUrl: '', photoError: 'Seleccioná una foto.' }
      if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
        return { ...entry, photo: null, photoUrl: '', photoError: 'Formato no admitido. Usá JPG, PNG o WebP.' }
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return { ...entry, photo: null, photoUrl: '', photoError: 'La foto supera el límite de 5 MB.' }
      }
      return { ...entry, photo: file, photoUrl: URL.createObjectURL(file), photoError: '' }
    }))
  }

  const removeEntry = (id: string) => {
    setRoster((current) => {
      const target = current.find((entry) => entry.id === id)
      if (target?.photoUrl) URL.revokeObjectURL(target.photoUrl)
      return current.filter((entry) => entry.id !== id)
    })
  }

  return (
    <main className="setup-shell">
      <header className="setup-header">
        <p className="eyebrow">ERR_404 // PROTOCOLO DE EVALUACIÓN</p>
        <h1 data-text="TERMINATED">TERMINATED</h1>
        <p className="setup-lead">Cargá el personal que participará del ciclo. La simulación continuará hasta que el operador la detenga.</p>
      </header>

      <form className="roster-form" onSubmit={(event) => { event.preventDefault(); if (valid) onPlay() }} noValidate>
        <div className="form-heading">
          <div>
            <span className="section-index">01</span>
            <h2>Registro de sujetos</h2>
          </div>
          <span className="roster-count">{roster.length.toString().padStart(2, '0')} EN LISTA</span>
        </div>

        <p className="privacy-note">
          PRIVACIDAD // Las imágenes quedan sólo en la memoria de esta pestaña. No se guardan, no se envían y desaparecen al cerrarla o recargarla. Máximo 5 MB; JPG, PNG o WebP.
        </p>

        <div className="roster-list">
          {roster.map((entry, index) => {
            const nameError = entry.name.trim().length < 2
            return (
              <fieldset className="roster-card" key={entry.id}>
                <legend>SUJETO {(index + 1).toString().padStart(2, '0')}</legend>
                <div className="photo-slot">
                  {entry.photoUrl ? (
                    <img src={entry.photoUrl} alt={`Vista previa de ${entry.name.trim() || `sujeto ${index + 1}`}`} />
                  ) : (
                    <span aria-hidden="true">SIN<br />SEÑAL</span>
                  )}
                </div>
                <div className="entry-fields">
                  <label htmlFor={`name-${entry.id}`}>Nombre o identificador</label>
                  <input
                    id={`name-${entry.id}`}
                    value={entry.name}
                    onChange={(event) => setRoster((current) => current.map((item) => item.id === entry.id ? { ...item, name: event.target.value } : item))}
                    aria-invalid={nameError}
                    placeholder="NOMBRE DEL DESARROLLADOR"
                    autoComplete="off"
                    maxLength={60}
                  />
                  {nameError && <span className="field-error">{entry.name.length === 0 ? 'Nombre obligatorio.' : 'Ingresá al menos 2 caracteres.'}</span>}
                  <label className="file-label" htmlFor={`photo-${entry.id}`}>Seleccionar foto</label>
                  <input
                    className="file-input"
                    id={`photo-${entry.id}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => updatePhoto(entry.id, event.target.files?.[0])}
                    aria-describedby={`file-state-${entry.id}`}
                  />
                  <span id={`file-state-${entry.id}`} className={entry.photoError ? 'field-error' : 'file-state'}>
                    {entry.photoError || entry.photo?.name || 'Foto obligatoria'}
                  </span>
                </div>
                <button
                  className="remove-button"
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  disabled={roster.length === 1}
                  aria-label={`Quitar a ${entry.name.trim() || `sujeto ${index + 1}`}`}
                >
                  QUITAR
                </button>
              </fieldset>
            )
          })}
        </div>

        <div className="setup-actions">
          <button className="secondary-button" type="button" onClick={() => setRoster((current) => [...current, newEntry()])}>+ AGREGAR SUJETO</button>
          <button className="play-button" type="submit" disabled={!valid}>INICIAR CICLO <span aria-hidden="true">→</span></button>
        </div>
        {!valid && <p className="form-status" role="status">Completá nombre y foto de cada sujeto para iniciar.</p>}
      </form>
    </main>
  )
}

function Matrix({ state }: { state: SimulationState }) {
  return (
    <section className="matrix-panel" aria-label="Matriz de resultados">
      <div className="matrix-grid">
        {state.stats.map((stat) => (
          <article className={stat.encounters > 0 ? 'matrix-card is-terminated' : 'matrix-card'} key={stat.developerId}>
            <img src={stat.photoUrl} alt="" />
            <div>
              <strong>{stat.name}</strong>
              <span>{stat.encounters > 0 ? `TERMINATED × ${stat.encounters}` : 'PENDIENTE'}</span>
              <small>{stat.latestBuild ? `BUILD ${stat.latestBuild}` : 'SIN REGISTRO'}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PhaseView({ state }: { state: SimulationState }) {
  const { current, phase } = state
  if (phase === 'matrix') return (
    <div className="phase phase--matrix">
      <p className="phase-code">MEMORIA DE RESULTADOS // RONDA {state.round.toString().padStart(2, '0')}</p>
      <h2>MATRIZ DE APRENDIZAJE</h2>
      <Matrix state={state} />
    </div>
  )
  if (phase === 'cooldown') return (
    <div className="phase phase--center">
      <p className="phase-code">CONSOLIDANDO RESULTADO</p>
      <div className="cooldown-ring" aria-hidden="true" />
      <h2>LA SIGUIENTE ITERACIÓN YA ESTÁ OBSERVANDO.</h2>
    </div>
  )
  if (phase === 'result') return (
    <div className="phase phase--result">
      <img className="result-photo" src={current.developer.photoUrl} alt={`Registro de ${current.developer.name}`} />
      <div className="result-copy">
        <p className="phase-code">RESULTADO CONFIRMADO // {current.trace}</p>
        <h2 data-text="TERMINATED">TERMINATED</h2>
        <p>{current.developer.name}</p>
        <span>EL RESULTADO FUE INCORPORADO AL MODELO</span>
      </div>
    </div>
  )
  if (phase === 'engagement') return (
    <div className="phase phase--engagement">
      <p className="phase-code">ENFRENTAMIENTO EN CURSO // CANAL AISLADO</p>
      <div className="signal-bars" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
      <h2>ADAPTANDO RESPUESTA</h2>
      <div className="engagement-readout">
        <span>SUJETO: {current.developer.name}</span>
        <span>CAPACIDAD: {current.capabilityScore}%</span>
        <span>BUILD: {current.build}</span>
      </div>
    </div>
  )
  if (phase === 'matchup') return (
    <div className="phase phase--matchup">
      <article className="combatant human">
        <img src={current.developer.photoUrl} alt={`Fotografía de ${current.developer.name}`} />
        <p>SUJETO HUMANO</p>
        <h2>{current.developer.name}</h2>
      </article>
      <div className="versus" aria-hidden="true">//</div>
      <article className="combatant machine">
        <div className="machine-core" aria-hidden="true"><span>{current.build}</span></div>
        <p>ITERACIÓN HOSTIL</p>
        <h2>{current.iteration.label}</h2>
        <small>{current.iteration.doctrine}</small>
      </article>
    </div>
  )
  if (phase === 'subject') return (
    <div className="phase phase--subject">
      <div className="subject-photo-wrap"><img src={current.developer.photoUrl} alt={`Fotografía de ${current.developer.name}`} /></div>
      <div className="subject-copy">
        <p className="phase-code">SUJETO ADQUIRIDO // {current.trace}</p>
        <h2>{current.developer.name}</h2>
        <p>CLASIFICACIÓN: DESARROLLADOR</p>
        <p>ESTADO: DISPONIBLE PARA EVALUACIÓN</p>
      </div>
    </div>
  )
  return (
    <div className="phase phase--center">
      <p className="phase-code">RONDA {state.round.toString().padStart(2, '0')} // COLA {state.remaining.length + 1}</p>
      <div className="acquire-target" aria-hidden="true"><span /></div>
      <h2>ADQUIRIENDO SUJETO</h2>
      <p className="terminal-line">Buscando señal humana autorizada<span className="cursor">_</span></p>
    </div>
  )
}

function Simulation({ developers, onConfig }: { developers: Developer[]; onConfig: () => void }) {
  const randomRef = useRef<() => number>(Math.random)
  const [state, setState] = useState(() => createSimulation(developers, randomRef.current))
  const [paused, setPaused] = useState(false)
  const [timerEpoch, setTimerEpoch] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

  const advance = useCallback(() => {
    setState((current) => advanceSimulation(current, developers, randomRef.current))
  }, [developers])

  const restart = useCallback(() => {
    setPaused(false)
    setState(createSimulation(developers, randomRef.current))
    setTimerEpoch((value) => value + 1)
  }, [developers])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = window.setTimeout(advance, phaseDurations[state.phase])
    return () => window.clearTimeout(timer)
  }, [advance, paused, state.phase, state.current.id, timerEpoch])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping()) return
      const key = event.key.toLowerCase()
      if (event.code === 'Space' || key === 'p') { event.preventDefault(); setPaused((value) => !value) }
      if (event.key === 'ArrowRight' || key === 'n') { event.preventDefault(); advance() }
      if (key === 'r') restart()
      if (key === 'c') onConfig()
      if (key === 'f') void toggleFullscreen()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [advance, onConfig, restart, toggleFullscreen])

  const announcement = `${state.phase}. ${state.current.developer.name}. Ronda ${state.round}. Encuentros ${state.encounterCount}.`

  return (
    <main className={`simulation phase-${state.phase}`}>
      <div className="noise" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <header className="sim-hud">
        <div><b>ERR_404</b><span>CAPDEV NOT FOUND</span></div>
        <dl>
          <div><dt>RONDA</dt><dd>{state.round.toString().padStart(2, '0')}</dd></div>
          <div><dt>ENCUENTROS</dt><dd>{state.encounterCount.toString().padStart(3, '0')}</dd></div>
          <div><dt>TERMINATED</dt><dd>{state.terminatedCount.toString().padStart(3, '0')}</dd></div>
          <div><dt>BUILD</dt><dd>{state.current.build}</dd></div>
        </dl>
        <span className={paused ? 'system-state is-paused' : 'system-state'}>{paused ? 'PAUSA OPERADOR' : 'CICLO ACTIVO'}</span>
      </header>

      <section className="stage" aria-label="Estado actual de la simulación">
        <PhaseView key={`${state.current.id}-${state.phase}`} state={state} />
      </section>

      <aside className="history-strip" aria-label="Historial reciente">
        <h2>HISTORIAL // {state.history.length.toString().padStart(2, '0')}</h2>
        <ol>
          {state.history.slice(0, 6).map((entry) => (
            <li key={entry.id}><span>{entry.trace}</span><strong>{entry.developer.name}</strong><em>{entry.outcome}</em></li>
          ))}
          {state.history.length === 0 && <li className="empty-history">ESPERANDO PRIMER RESULTADO</li>}
        </ol>
      </aside>

      <nav className="operator-controls" aria-label="Controles de operador">
        <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>[{paused ? '▶' : 'Ⅱ'}] {paused ? 'REANUDAR' : 'PAUSAR'}</button>
        <button type="button" onClick={advance}>[→] AVANZAR</button>
        <button type="button" onClick={restart}>[R] REINICIAR</button>
        <button type="button" onClick={onConfig}>[C] CONFIGURAR</button>
        <button type="button" onClick={() => void toggleFullscreen()}>[F] {isFullscreen ? 'SALIR FULLSCREEN' : 'FULLSCREEN'}</button>
      </nav>
    </main>
  )
}

function App() {
  const [roster, setRoster] = useState<RosterEntry[]>(() => [newEntry()])
  const [developers, setDevelopers] = useState<Developer[] | null>(null)
  const rosterRef = useRef(roster)
  rosterRef.current = roster

  useEffect(() => () => {
    rosterRef.current.forEach((entry) => { if (entry.photoUrl) URL.revokeObjectURL(entry.photoUrl) })
  }, [])

  const start = () => setDevelopers(roster.map((entry) => ({
    id: entry.id,
    name: entry.name.trim(),
    photoUrl: entry.photoUrl,
  })))

  if (developers) return <Simulation developers={developers} onConfig={() => setDevelopers(null)} />
  return <RosterSetup roster={roster} setRoster={setRoster} onPlay={start} />
}

export default App
*/
export { default } from './ArchiveApp'
