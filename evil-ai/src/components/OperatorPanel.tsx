import { EVENT_KINDS, EVENT_LABELS, type EventKind } from '../domain/events'
import type { VideoEntry } from '../domain/manifest'
import type { ClipStatus } from './VideoInterlude'

export interface PanelState {
  stage: string
  nextLabel: string
  seed: number
  seedFixed: boolean
  clockMs: number
  paused: boolean
  stable: boolean
  muted: boolean
  volume: number
  fullscreen: boolean
  usingPlaceholders: boolean
}

export interface PanelActions {
  close: () => void
  togglePause: () => void
  nextEvent: () => void
  runEvent: (kind: EventKind) => void
  videoNow: (id: string) => void
  restart: () => void
  toggleStable: () => void
  toggleMute: () => void
  setVolume: (value: number) => void
  toggleFullscreen: () => void
}

const formatClock = (ms: number) => {
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function OperatorPanel({ state, actions, videos, statuses }: {
  state: PanelState
  actions: PanelActions
  videos: readonly VideoEntry[]
  statuses: Record<string, { status: ClipStatus; durationMs?: number }>
}) {
  return (
    <aside className="operator" aria-label="Panel de operador">
      <header>
        <strong>OPERADOR // EVIL AI</strong>
        <button type="button" onClick={actions.close} aria-label="Cerrar panel">[ESC] CERRAR</button>
      </header>

      <dl className="operator-readout">
        <div><dt>ESTADO</dt><dd>{state.paused ? 'PAUSA' : state.stage}</dd></div>
        <div><dt>PRÓXIMO</dt><dd>{state.nextLabel}</dd></div>
        <div><dt>TIEMPO</dt><dd>{formatClock(state.clockMs)}</dd></div>
        <div><dt>SEED</dt><dd>{state.seed}{state.seedFixed ? ' (fija)' : ''}</dd></div>
      </dl>

      <div className="operator-buttons">
        <button type="button" onClick={actions.togglePause} aria-pressed={state.paused}>[ESPACIO] {state.paused ? 'REANUDAR' : 'PAUSAR'}</button>
        <button type="button" onClick={actions.nextEvent}>[N] SIGUIENTE EVENTO</button>
        <button type="button" onClick={actions.restart}>[R] REINICIAR</button>
        <button type="button" onClick={actions.toggleStable} aria-pressed={state.stable}>[S] MODO ESTABLE {state.stable ? 'ON' : 'OFF'}</button>
        <button type="button" onClick={actions.toggleMute} aria-pressed={!state.muted}>[M] {state.muted ? 'ACTIVAR AUDIO' : 'SILENCIAR'}</button>
        <button type="button" onClick={actions.toggleFullscreen}>[F] {state.fullscreen ? 'SALIR FULLSCREEN' : 'FULLSCREEN'}</button>
      </div>

      <div className="operator-events">
        {EVENT_KINDS.map((kind, index) => (
          <button type="button" key={kind} onClick={() => actions.runEvent(kind)}>[{index + 1}] {EVENT_LABELS[kind]}</button>
        ))}
      </div>

      <label className="operator-volume">
        <span>VOL {Math.round(state.volume * 100)}%</span>
        <input type="range" min={0} max={1} step={0.05} value={state.volume} onChange={(event) => actions.setVolume(Number(event.target.value))} />
      </label>

      <section className="operator-assets">
        <h2>VIDEOS {state.usingPlaceholders ? '// PLACEHOLDERS' : `// ${videos.length}`}</h2>
        {state.usingPlaceholders && <p>No hay clips en <code>evil-ai/media/videos/</code>. Se usan feeds de prueba.</p>}
        <ul>
          {videos.map((video) => {
            const info = statuses[video.id] ?? (video.src === null ? { status: 'placeholder' as const } : undefined)
            return (
              <li key={video.id}>
                <span>{video.label}<small>{video.file || 'placeholder'}{info?.durationMs ? ` · ${(info.durationMs / 1000).toFixed(1)} s` : ''}</small></span>
                <em className={`clip-${(info?.status ?? 'pendiente').replace(' ', '-')}`}>{info?.status ?? 'pendiente'}</em>
                <button type="button" onClick={() => actions.videoNow(video.id)}>PROBAR</button>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="operator-help">SHIFT+O abre y cierra este panel. Los atajos (1–4 para cada evento) sólo funcionan con el panel abierto. URL: <code>?seed=404</code> fija la secuencia, <code>?stable=1</code> arranca en modo estable, <code>?safe=0.08</code> agranda la zona segura.</p>
    </aside>
  )
}
