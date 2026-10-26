import { useCallback, useEffect, useRef, useState } from 'react'
import { useAmbientAudio } from './audio/useAmbientAudio'
import { useShowClock } from './clock'
import { CodeField } from './components/CodeField'
import { OperatorPanel } from './components/OperatorPanel'
import { VideoInterlude, type ClipStatus } from './components/VideoInterlude'
import { faceTotalMs, timing } from './config'
import { captions } from './data/captions'
import { usingPlaceholders, videos } from './data/videos'
import { chooseFaceLayout, type FaceLayout } from './domain/face'
import type { VideoEntry } from './domain/manifest'
import { createSeededRandom, pickFresh } from './domain/random'
import {
  createMemory,
  planNextEvent,
  recordStart,
  recordVideoEnd,
  videoTimeoutMs,
  type EventKind,
  type PlannedEvent,
} from './domain/scheduler'
import type { ActiveFace } from './field/FieldEngine'

type Stage =
  | { kind: 'ambient' }
  | { kind: 'face'; startedAt: number; layout: FaceLayout; caption: string; captionOn: boolean }
  | { kind: 'glitch-in'; video: VideoEntry; until: number }
  | { kind: 'video'; video: VideoEntry; startedAt: number; timeoutMs: number }
  | { kind: 'glitch-out'; video: VideoEntry; until: number }

type Statuses = Record<string, { status: ClipStatus; durationMs?: number }>
type Audio = ReturnType<typeof useAmbientAudio>

const params = new URLSearchParams(window.location.search)
const urlSeed = params.has('seed') ? Number.parseInt(params.get('seed')!, 10) : Number.NaN
const seedFixed = Number.isFinite(urlSeed)
const safeParam = Number(params.get('safe'))
const safeInset = Number.isFinite(safeParam) && safeParam > 0 ? Math.min(0.3, safeParam) : 0.05
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const newSeed = () => (seedFixed ? urlSeed : Math.floor(Math.random() * 1e6))
// The first face comes soon after boot so whoever turns the monitor on sees the system work.
const FIRST_FACE_AT = 8000
const HUD_CORNER_MS = 5 * 60 * 1000

const schedulerConfig = {
  ambientGapMs: timing.ambientGapMs,
  videoChance: timing.videoChance,
  videoMinIntervalMs: timing.videoMinIntervalMs,
}

const isTyping = () => document.activeElement instanceof HTMLInputElement && document.activeElement.type !== 'range'

interface ShowProps {
  seed: number
  paused: boolean
  setPaused: React.Dispatch<React.SetStateAction<boolean>>
  stable: boolean
  setStable: React.Dispatch<React.SetStateAction<boolean>>
  audio: Audio
  panelOpen: boolean
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  onRestart: () => void
  statuses: Statuses
  onStatus: (id: string, status: ClipStatus, durationMs?: number) => void
  fullscreen: boolean
  toggleFullscreen: () => void
}

function Show({ seed, paused, setPaused, stable, setStable, audio, panelOpen, setPanelOpen, onRestart, statuses, onStatus, fullscreen, toggleFullscreen }: ShowProps) {
  const clock = useShowClock(paused)
  // Separate streams so drawing the field never shifts the rehearsal sequence of events.
  const [random] = useState(() => ({
    schedule: createSeededRandom(seed),
    field: createSeededRandom(seed ^ 0x5f3759df),
    face: createSeededRandom(seed + 404),
  }))
  const [stage, setStage] = useState<Stage>({ kind: 'ambient' })
  const [plan, setPlan] = useState<PlannedEvent | null>({ kind: 'face', startAt: FIRST_FACE_AT })
  const [preloadId, setPreloadId] = useState<string | null>(null)
  const [hudCorner, setHudCorner] = useState(0)
  const [, setRefresh] = useState(0)
  const stageRef = useRef<Stage>(stage)
  const planRef = useRef<PlannedEvent | null>(plan)
  const preloadRef = useRef<string | null>(null)
  const memoryRef = useRef(createMemory())
  const faceRef = useRef<ActiveFace | null>(null)
  const captionRef = useRef<string | undefined>(undefined)
  const durationsRef = useRef<Record<string, number>>({})

  const go = (next: Stage) => { stageRef.current = next; setStage(next) }
  const setPlanned = (next: PlannedEvent | null) => { planRef.current = next; setPlan(next) }
  const preload = (id: string | null) => { preloadRef.current = id; setPreloadId(id) }

  const toAmbient = (now: number) => {
    faceRef.current = null
    go({ kind: 'ambient' })
    if (!planRef.current) setPlanned(planNextEvent(memoryRef.current, now, videos, random.schedule, schedulerConfig))
  }

  const startEvent = (event: PlannedEvent, now: number) => {
    setPlanned(null)
    const video = event.kind === 'video' ? videos.find(({ id }) => id === event.videoId) : undefined
    memoryRef.current = recordStart(memoryRef.current, video ? event : { kind: 'face', startAt: event.startAt })
    if (video) {
      preload(video.id)
      go({ kind: 'glitch-in', video, until: now + timing.glitchMs })
      audio.cue('glitch')
      return
    }
    const layout = chooseFaceLayout(random.face, window.innerWidth, window.innerHeight, safeInset)
    const caption = pickFresh(captions, captionRef.current, random.face)
    captionRef.current = caption
    faceRef.current = { startedAt: now, layout }
    go({ kind: 'face', startedAt: now, layout, caption, captionOn: false })
    audio.cue('face')
  }

  const endVideo = (now: number) => {
    const current = stageRef.current
    if (current.kind !== 'video' && current.kind !== 'glitch-in') return
    go({ kind: 'glitch-out', video: current.video, until: now + timing.glitchMs })
    audio.cue('glitch')
  }

  const tick = (now: number) => {
    const current = stageRef.current
    const corner = Math.floor(now / HUD_CORNER_MS) % 4
    if (corner !== hudCorner) setHudCorner(corner)

    if (current.kind === 'ambient') {
      const next = planRef.current
      if (!next) return toAmbient(now)
      if (next.kind === 'video' && next.videoId && next.startAt - now <= timing.preloadLeadMs && preloadRef.current !== next.videoId) preload(next.videoId)
      if (now >= next.startAt) startEvent(next, now)
    } else if (current.kind === 'face') {
      const elapsed = now - current.startedAt
      if (elapsed >= faceTotalMs) return toAmbient(now)
      const { convergeMs, holdMs } = timing.face
      const captionOn = elapsed >= convergeMs * 0.85 && elapsed < convergeMs + holdMs
      if (captionOn !== current.captionOn) go({ ...current, captionOn })
    } else if (current.kind === 'glitch-in') {
      if (now < current.until) return
      const { video } = current
      const timeoutMs = video.src === null
        ? video.durationMs ?? timing.placeholderMs
        : videoTimeoutMs({ durationMs: video.durationMs ?? durationsRef.current[video.id] ?? null }, timing.videoMaxMs, timing.videoTimeoutMarginMs)
      go({ kind: 'video', video, startedAt: now, timeoutMs })
    } else if (current.kind === 'video') {
      if (now - current.startedAt >= current.timeoutMs) endVideo(now)
    } else if (now >= current.until) {
      memoryRef.current = recordVideoEnd(memoryRef.current, now)
      preload(null)
      toAmbient(now)
    }
  }
  const tickRef = useRef(tick)
  tickRef.current = tick
  useEffect(() => clock.subscribe((now) => tickRef.current(now)), [clock])

  // Operator: cut whatever is on screen and run a specific kind of event next.
  const force = (kind: EventKind | 'next', videoId?: string) => {
    const now = clock.now
    const current = stageRef.current
    let event: PlannedEvent
    if (kind === 'next') event = planRef.current ? { ...planRef.current, startAt: now } : planNextEvent(memoryRef.current, now, videos, random.schedule, schedulerConfig, 'face')
    else if (kind === 'video' && videoId) event = { kind: 'video', startAt: now, videoId }
    else event = planNextEvent(memoryRef.current, now, videos, random.schedule, schedulerConfig, kind)
    if (current.kind === 'video' || current.kind === 'glitch-in') {
      if (kind === 'next') { setPlanned(null); endVideo(now); return }
      setPlanned({ ...event, startAt: now + timing.glitchMs })
      endVideo(now)
      return
    }
    if (current.kind === 'face') {
      if (kind === 'next') { setPlanned(null); toAmbient(now); return }
      faceRef.current = null
      go({ kind: 'ambient' })
    }
    if (current.kind === 'glitch-out') { setPlanned({ ...event, startAt: current.until }); return }
    setPlanned(event)
    if (event.kind === 'video' && event.videoId) preload(event.videoId)
  }
  const forceRef = useRef(force)
  forceRef.current = force

  const handleStatus = useCallback((id: string, status: ClipStatus, durationMs?: number) => {
    if (durationMs && Number.isFinite(durationMs)) durationsRef.current[id] = durationMs
    onStatus(id, status, durationMs)
  }, [onStatus])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === 'o') { event.preventDefault(); setPanelOpen((value) => !value); return }
      if (!panelOpen || isTyping() || event.ctrlKey || event.metaKey || event.altKey) return
      const key = event.key.toLowerCase()
      if (key === 'escape') setPanelOpen(false)
      else if (event.code === 'Space' || key === 'p') { event.preventDefault(); setPaused((value) => !value) }
      else if (key === 'n') forceRef.current('next')
      else if (key === 'c') forceRef.current('face')
      else if (key === 'v') forceRef.current('video')
      else if (key === 'r') onRestart()
      else if (key === 's') setStable((value) => !value)
      else if (key === 'm') audio.toggleMute()
      else if (key === 'f') toggleFullscreen()
      else if (key === '+' || key === '=') audio.setVolume(Math.min(1, Math.round((audio.volume + 0.05) * 100) / 100))
      else if (key === '-') audio.setVolume(Math.max(0, Math.round((audio.volume - 0.05) * 100) / 100))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [audio, onRestart, panelOpen, setPanelOpen, setPaused, setStable, toggleFullscreen])

  // The panel shows live countdowns; refresh it only while it is open.
  useEffect(() => {
    if (!panelOpen) return
    const timer = window.setInterval(() => setRefresh((value) => value + 1), 500)
    return () => window.clearInterval(timer)
  }, [panelOpen])

  const cutting = stage.kind === 'glitch-in' || stage.kind === 'glitch-out'
  const clipOnScreen = stage.kind === 'video' || stage.kind === 'glitch-out'
  const clip = stage.kind === 'glitch-in' || stage.kind === 'video' || stage.kind === 'glitch-out'
    ? stage.video
    : preloadId ? videos.find(({ id }) => id === preloadId) : undefined

  const stageLabel = stage.kind === 'ambient' ? 'CAMPO' : stage.kind === 'face' ? 'ROSTRO' : stage.kind === 'video' ? `VIDEO // ${stage.video.label}` : 'CORTE'
  const nextLabel = plan
    ? `${plan.kind === 'face' ? 'ROSTRO' : `VIDEO // ${videos.find(({ id }) => id === plan.videoId)?.label ?? '?'}`} en ${Math.max(0, Math.ceil((plan.startAt - clock.now) / 1000))} s`
    : 'EN CURSO'

  return (
    <main className={`show stage-${stage.kind}${cutting ? ' is-cutting' : ''}${stable ? ' is-stable' : ''}${paused ? ' is-paused' : ''}${panelOpen ? ' has-panel' : ''}`} style={{ '--safe': `${safeInset * 100}vmin` } as React.CSSProperties}>
      <CodeField clock={clock} random={random.field} faceRef={faceRef} stable={stable} />
      <div className="crt" aria-hidden="true" />

      <p className={`hud hud-${hudCorner}`} aria-hidden="true">
        <b>ERR_404</b> CAPDEV NOT FOUND<br />
        <span>NODO PRINCIPAL // SUPERVISIÓN HUMANA: 0</span>
      </p>

      {stage.kind === 'face' && stage.captionOn && (
        <p
          className="face-caption"
          style={{ left: stage.layout.cx, top: stage.layout.cy + stage.layout.size * 0.56, fontSize: Math.max(16, stage.layout.size * 0.05) }}
        >
          <span style={{ '--chars': stage.caption.length } as React.CSSProperties}>{stage.caption}</span>
        </p>
      )}

      {clip && (
        <VideoInterlude
          key={clip.id}
          video={clip}
          visible={clipOnScreen}
          active={stage.kind === 'video'}
          paused={paused}
          muted={audio.muted}
          volume={audio.volume}
          onFinish={() => endVideo(clock.now)}
          onStatus={handleStatus}
        />
      )}

      {cutting && <div className="signal-cut" aria-hidden="true"><i /><i /><i /><i /></div>}

      <p className="sr-only" aria-live="polite">{stage.kind === 'face' && stage.captionOn ? stage.caption : ''}</p>

      {panelOpen && (
        <OperatorPanel
          videos={videos}
          statuses={statuses}
          state={{
            stage: stageLabel,
            nextLabel,
            seed,
            seedFixed,
            clockMs: clock.now,
            paused,
            stable,
            muted: audio.muted,
            volume: audio.volume,
            fullscreen,
            usingPlaceholders,
          }}
          actions={{
            close: () => setPanelOpen(false),
            togglePause: () => setPaused((value) => !value),
            nextEvent: () => force('next'),
            faceNow: () => force('face'),
            videoNow: (id) => force('video', id),
            restart: onRestart,
            toggleStable: () => setStable((value) => !value),
            toggleMute: audio.toggleMute,
            setVolume: audio.setVolume,
            toggleFullscreen,
          }}
        />
      )}
    </main>
  )
}

export default function App() {
  const audio = useAmbientAudio()
  const [run, setRun] = useState(() => ({ seed: newSeed(), epoch: 0 }))
  const [paused, setPaused] = useState(false)
  const [stable, setStable] = useState(params.get('stable') === '1' || reducedMotion)
  const [panelOpen, setPanelOpen] = useState(params.get('panel') === '1')
  const [statuses, setStatuses] = useState<Statuses>({})
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const cornerClicks = useRef<number[]>([])

  const onStatus = useCallback((id: string, status: ClipStatus, durationMs?: number) => {
    setStatuses((current) => current[id]?.status === status && current[id]?.durationMs === durationMs ? current : { ...current, [id]: { status, durationMs } })
  }, [])

  const restart = useCallback(() => {
    setPaused(false)
    setRun((current) => ({ seed: newSeed(), epoch: current.epoch + 1 }))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    else void document.documentElement.requestFullscreen?.().catch(() => undefined)
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Five quick clicks in the top-left corner open the panel, for a kiosk without a keyboard.
  const cornerClick = () => {
    const now = performance.now()
    cornerClicks.current = [...cornerClicks.current.filter((time) => now - time < 3000), now]
    if (cornerClicks.current.length >= 5) {
      cornerClicks.current = []
      setPanelOpen((value) => !value)
    }
  }

  return (
    <>
      <Show
        key={run.epoch}
        seed={run.seed}
        paused={paused}
        setPaused={setPaused}
        stable={stable}
        setStable={setStable}
        audio={audio}
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        onRestart={restart}
        statuses={statuses}
        onStatus={onStatus}
        fullscreen={fullscreen}
        toggleFullscreen={toggleFullscreen}
      />
      <button type="button" className="corner-hotspot" onClick={cornerClick} aria-label="Panel de operador (cinco clics)" tabIndex={-1} />
    </>
  )
}
