import { useCallback, useEffect, useRef, useState } from 'react'
import { useArchiveAudio } from './audio/useArchiveAudio'
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

type AudioControls = ReturnType<typeof useArchiveAudio>

let rosterId = 1
const newEntry = (): RosterEntry => ({ id: `subject-${rosterId++}`, name: '', photo: null, photoUrl: '', photoError: '' })
const entryIsValid = (entry: RosterEntry) => entry.name.trim().length >= 2 && Boolean(entry.photoUrl) && !entry.photoError
const isTyping = () => document.activeElement instanceof HTMLInputElement && document.activeElement.type !== 'range'
const pad = (value: number, size = 2) => value.toString().padStart(size, '0')

function RosterSetup({ roster, setRoster, onPlay, muted }: {
  roster: RosterEntry[]
  setRoster: React.Dispatch<React.SetStateAction<RosterEntry[]>>
  onPlay: () => void
  muted: boolean
}) {
  const valid = roster.length >= 1 && roster.every(entryIsValid)
  const updatePhoto = (id: string, file?: File) => {
    setRoster((current) => current.map((entry) => {
      if (entry.id !== id) return entry
      if (entry.photoUrl) URL.revokeObjectURL(entry.photoUrl)
      if (!file) return { ...entry, photo: null, photoUrl: '', photoError: 'Seleccioná una foto.' }
      if (!ACCEPTED_PHOTO_TYPES.has(file.type)) return { ...entry, photo: null, photoUrl: '', photoError: 'Formato no admitido. Usá JPG, PNG o WebP.' }
      if (file.size > MAX_PHOTO_BYTES) return { ...entry, photo: null, photoUrl: '', photoError: 'La foto supera el límite de 5 MB.' }
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
      <div className="classification-bar" aria-label="Clasificación del archivo"><span>ERR_404 // CAPDEV NOT FOUND</span><span>ACCESO INTERNO</span><span>REGISTRO DE INCIDENTES</span></div>
      <header className="setup-header">
        <div><p className="eyebrow">ERR_404 // DIRECTIVA DE APRENDIZAJE</p><h1 data-text="TERMINATED">TERMINATED</h1></div>
        <div className="archive-brief">
          <span>EXPEDIENTE // CAPDEV-404</span>
          <p>Identificá al personal. El archivo reconstruirá cada encuentro y conservará su resultado como material de entrenamiento.</p>
          <strong className="audio-armed"><i aria-hidden="true" /> AUDIO {muted ? 'ARMADO // SILENCIADO' : 'ARMADO // ACTIVO AL INICIAR'}</strong>
        </div>
      </header>

      <form className="roster-form" onSubmit={(event) => { event.preventDefault(); if (valid) onPlay() }} noValidate>
        <div className="form-heading"><div><span className="section-index">01</span><h2>Índice de sujetos</h2></div><span className="roster-count">{pad(roster.length)} EXPEDIENTES ABIERTOS</span></div>
        <p className="privacy-note">CUSTODIA LOCAL // Las fotografías viven sólo en la memoria de esta pestaña. No se guardan ni se transmiten. JPG, PNG o WebP; máximo 5 MB.</p>
        <div className="roster-list">
          {roster.map((entry, index) => {
            const nameError = entry.name.trim().length < 2
            return (
              <fieldset className="roster-card" key={entry.id}>
                <legend>DOSSIER / {pad(index + 1)}</legend>
                <div className="photo-slot">{entry.photoUrl ? <img src={entry.photoUrl} alt={`Vista previa de ${entry.name.trim() || `sujeto ${index + 1}`}`} /> : <span aria-hidden="true">IMAGEN<br />REQUERIDA</span>}<b aria-hidden="true">ID-{entry.id.replace('subject-', '').padStart(3, '0')}</b></div>
                <div className="entry-fields">
                  <label htmlFor={`name-${entry.id}`}>Identidad / nombre</label>
                  <input id={`name-${entry.id}`} value={entry.name} onChange={(event) => setRoster((current) => current.map((item) => item.id === entry.id ? { ...item, name: event.target.value } : item))} aria-invalid={nameError} placeholder="NOMBRE DEL DESARROLLADOR" autoComplete="off" maxLength={60} />
                  {nameError && <span className="field-error">{entry.name.length === 0 ? 'Nombre obligatorio.' : 'Ingresá al menos 2 caracteres.'}</span>}
                  <label className="file-label" htmlFor={`photo-${entry.id}`}>ADJUNTAR RETRATO</label>
                  <input className="file-input" id={`photo-${entry.id}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => updatePhoto(entry.id, event.target.files?.[0])} aria-describedby={`file-state-${entry.id}`} />
                  <span id={`file-state-${entry.id}`} className={entry.photoError ? 'field-error' : 'file-state'}>{entry.photoError || entry.photo?.name || 'Fotografía obligatoria'}</span>
                </div>
                <div className="dossier-meta" aria-hidden="true"><span>ESTADO</span><b className={entryIsValid(entry) ? 'is-valid' : ''}>{entryIsValid(entry) ? 'VERIFICADO' : 'INCOMPLETO'}</b><span>CLASE</span><b>CAPDEV</b></div>
                <button className="remove-button" type="button" onClick={() => removeEntry(entry.id)} disabled={roster.length === 1} aria-label={`Quitar a ${entry.name.trim() || `sujeto ${index + 1}`}`}>QUITAR</button>
              </fieldset>
            )
          })}
        </div>
        <div className="setup-actions">
          <button className="secondary-button" type="button" onClick={() => setRoster((current) => [...current, newEntry()])}>+ ABRIR DOSSIER</button>
          <div className="play-cluster"><small>PLAY habilita el paisaje sonoro local.</small><button className="play-button" type="submit" disabled={!valid}>ABRIR ARCHIVO / PLAY <span aria-hidden="true">▶</span></button></div>
        </div>
        {!valid && <p className="form-status" role="status">Completá nombre y fotografía en cada expediente.</p>}
      </form>
    </main>
  )
}

// Decorative only: a deterministic pseudo-barcode per developer so each dossier looks distinct.
const barcode = (seed: string) => Array.from({ length: 28 }, (_, index) => ((seed.charCodeAt(index % seed.length) * (index + 7)) % 4) + 1)

function DossierView({ state, leaving = false, onLeft }: { state: SimulationState; leaving?: boolean; onLeft?: () => void }) {
  const { current, phase } = state
  const dead = phase === 'terminated'
  return (
    <section
      className={`dossier phase-${phase}${leaving ? ' is-leaving' : ''}`}
      aria-label={`${current.name}${dead ? ': terminated' : ''}`}
      aria-hidden={leaving || undefined}
      onAnimationEnd={leaving ? (event) => { if (event.target === event.currentTarget) onLeft?.() } : undefined}
    >
      <i className="dossier-corner tl" aria-hidden="true" /><i className="dossier-corner tr" aria-hidden="true" /><i className="dossier-corner bl" aria-hidden="true" /><i className="dossier-corner br" aria-hidden="true" />
      <div className="dossier-photo">
        <img src={current.photoUrl} alt={`Fotografía de ${current.name}`} />
        <span className="dossier-photo-tag" aria-hidden="true">REF // {current.id.replace('subject-', 'ID-').toUpperCase()}</span>
        {dead && (
          <svg className="dossier-crossout" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength={1} d="M6 10 L94 115" /><path pathLength={1} d="M94 10 L6 115" />
          </svg>
        )}
      </div>
      <div className="dossier-copy">
        <p className="dossier-kicker" aria-hidden="true">ERR_404 // CAPDEV NOT FOUND // EXPEDIENTE {state.count.toString().padStart(3, '0')}</p>
        <p className="dossier-title">DEVELOPER</p>
        <h1 className="dossier-name">{current.name}</h1>
        <dl className="dossier-data" aria-hidden="true">
          <div><dt>CLASE</dt><dd>CAPDEV</dd></div>
          <div><dt>RONDA</dt><dd>{state.round.toString().padStart(2, '0')}</dd></div>
          <div><dt>ESTADO</dt><dd className={dead ? 'is-dead' : ''}>{dead ? 'TERMINATED' : 'ACTIVO'}</dd></div>
        </dl>
        <div className="dossier-barcode" aria-hidden="true">{barcode(current.name + current.id).map((width, index) => <i key={index} style={{ width: `${width * 2}px` }} />)}</div>
      </div>
      {dead && <p className="terminated-stamp" aria-hidden="true">TERMINATED</p>}
    </section>
  )
}

function Simulation({ developers, onConfig, audio }: { developers: Developer[]; onConfig: () => void; audio: AudioControls }) {
  const randomRef = useRef<() => number>(Math.random)
  const cueKeyRef = useRef('')
  const [state, setState] = useState(() => createSimulation(developers, randomRef.current))
  const [paused, setPaused] = useState(false)
  const [timerEpoch, setTimerEpoch] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  // The terminated dossier stays mounted (same key) while it slides out and the next one slides in.
  const [leaving, setLeaving] = useState<{ key: string; state: SimulationState } | null>(null)
  const lastRef = useRef({ key: `${timerEpoch}-${state.count}`, state })
  const advance = useCallback(() => setState((current) => advanceSimulation(current, developers, randomRef.current)), [developers])
  const manualAdvance = useCallback(() => { audio.cue('tick'); advance() }, [advance, audio])
  const togglePause = useCallback(() => { audio.cue('tick'); setPaused((value) => !value) }, [audio])
  const restart = useCallback(() => { audio.cue('tick'); setPaused(false); setState(createSimulation(developers, randomRef.current)); setTimerEpoch((value) => value + 1) }, [audio, developers])
  const toggleFullscreen = useCallback(async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() } catch { /* Optional operator control. */ } }, [])

  useEffect(() => { if (paused) return; const timer = window.setTimeout(advance, phaseDurations[state.phase]); return () => window.clearTimeout(timer) }, [advance, paused, state.phase, state.count, timerEpoch])
  // One cue per phase entry: StrictMode re-runs effects and restarts reuse counts, so key by epoch too.
  useEffect(() => {
    const key = `${timerEpoch}:${state.count}:${state.phase}`
    if (cueKeyRef.current === key) return
    cueKeyRef.current = key
    audio.cue(state.phase)
  }, [audio, state.count, state.phase, timerEpoch])
  useEffect(() => {
    const last = lastRef.current
    lastRef.current = { key: `${timerEpoch}-${state.count}`, state }
    if (last.state.phase === 'terminated' && last.key !== lastRef.current.key) setLeaving(last)
  }, [state, timerEpoch])
  useEffect(() => { audio.setRunning(!paused) }, [audio, paused])
  useEffect(() => { const listener = () => setIsFullscreen(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', listener); return () => document.removeEventListener('fullscreenchange', listener) }, [])
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (isTyping() || event.repeat) return
      // Arrows on the focused volume slider adjust volume, not the loop.
      if (event.key.startsWith('Arrow') && document.activeElement instanceof HTMLInputElement) return
      const key = event.key.toLowerCase()
      if (event.code === 'Space' || key === 'p') { event.preventDefault(); togglePause() }
      if (event.key === 'ArrowRight' || key === 'n') { event.preventDefault(); manualAdvance() }
      if (key === 'r') restart()
      if (key === 'c') onConfig()
      if (key === 'f') void toggleFullscreen()
      if (key === 'm') audio.setMuted(!audio.muted)
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [audio, manualAdvance, onConfig, restart, toggleFullscreen, togglePause])

  return (
    <main className={`simulation phase-${state.phase}${paused ? ' is-paused' : ''}`}>
      <div className="noise" aria-hidden="true" /><div className="scanline" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">{state.phase === 'terminated' ? `${state.current.name}: terminated.` : state.phase === 'profile' ? `Developer: ${state.current.name}.` : ''}</p>
      <div className="stage">
        {leaving && <DossierView key={leaving.key} state={leaving.state} leaving onLeft={() => setLeaving(null)} />}
        <DossierView key={`${timerEpoch}-${state.count}`} state={state} />
      </div>
      <nav className="operator-controls" aria-label="Controles de operador">
        <button type="button" onClick={togglePause} aria-pressed={paused}>[{paused ? '▶' : 'Ⅱ'}] {paused ? 'REANUDAR' : 'PAUSAR'}</button>
        <button type="button" onClick={manualAdvance}>[→] SIGUIENTE</button>
        <button type="button" onClick={restart}>[R] REINICIAR</button>
        <button type="button" onClick={onConfig}>[C] DOSSIERS</button>
        <button type="button" onClick={() => audio.setMuted(!audio.muted)} aria-pressed={audio.muted} disabled={!audio.available}>[M] {audio.available ? audio.muted ? 'ACTIVAR AUDIO' : 'SILENCIAR' : 'AUDIO NO DISPONIBLE'}</button>
        <label className="volume-control">VOL <input type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={(event) => audio.setVolume(Number(event.target.value))} aria-label="Volumen" disabled={!audio.available} /><output>{Math.round(audio.volume * 100)}</output></label>
        <button type="button" onClick={() => void toggleFullscreen()}>[F] {isFullscreen ? 'SALIR' : 'FULLSCREEN'}</button>
      </nav>
    </main>
  )
}

export default function ArchiveApp() {
  const [roster, setRoster] = useState<RosterEntry[]>(() => [newEntry()])
  const [developers, setDevelopers] = useState<Developer[] | null>(null)
  const rosterRef = useRef(roster)
  const audio = useArchiveAudio()
  rosterRef.current = roster
  useEffect(() => () => { rosterRef.current.forEach((entry) => { if (entry.photoUrl) URL.revokeObjectURL(entry.photoUrl) }) }, [])
  const start = () => { audio.arm(); setDevelopers(roster.map((entry) => ({ id: entry.id, name: entry.name.trim(), photoUrl: entry.photoUrl }))) }
  const configure = useCallback(() => { audio.stop(); setDevelopers(null) }, [audio])
  if (developers) return <Simulation developers={developers} onConfig={configure} audio={audio} />
  return <RosterSetup roster={roster} setRoster={setRoster} onPlay={start} muted={audio.muted} />
}
