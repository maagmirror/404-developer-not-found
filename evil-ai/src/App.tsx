import { useCallback, useEffect, useRef, useState } from 'react'
import { useAmbientAudio } from './audio/useAmbientAudio'
import { useShowClock } from './clock'
import { CodeField } from './components/CodeField'
import { OperatorPanel } from './components/OperatorPanel'
import { VideoInterlude, type ClipStatus } from './components/VideoInterlude'
import { timing } from './config'
import { playbackNames } from './data/captions'
import { usingPlaceholders, videos } from './data/videos'
import {
  EVENT_KINDS,
  EVENT_LABELS,
  appearanceEnd,
  planFaceEvent,
  rushAt,
  rushDuration,
  type Appearance,
  type EventKind,
  type FaceEventKind,
} from './domain/events'
import type { VideoEntry } from './domain/manifest'
import { createSeededRandom, pickFresh } from './domain/random'
import { createMemory, planNextEvent, recordStart, videoTimeoutMs, type PlannedEvent } from './domain/scheduler'
import type { ActiveFace, Motion } from './field/FieldEngine'

type Stage =
  | { kind: 'idle' }
  | { kind: 'face'; event: FaceEventKind; startedAt: number; appearances: Appearance[]; endsAt: number }
  | { kind: 'rush'; startedAt: number; endsAt: number }
  | { kind: 'glitch-in'; video: VideoEntry; headline: string; until: number }
  | { kind: 'video'; video: VideoEntry; headline: string; startedAt: number; timeoutMs: number }
  | { kind: 'glitch-out'; video: VideoEntry; headline: string; until: number }

type Statuses = Record<string, { status: ClipStatus; durationMs?: number }>
type Audio = ReturnType<typeof useAmbientAudio>

const params = new URLSearchParams(window.location.search)
const urlSeed = params.has('seed') ? Number.parseInt(params.get('seed')!, 10) : Number.NaN
const seedFixed = Number.isFinite(urlSeed)
const safeParam = Number(params.get('safe'))
const safeInset = Number.isFinite(safeParam) && safeParam > 0 ? Math.min(0.3, safeParam) : 0.05
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const newSeed = () => (seedFixed ? urlSeed : Math.floor(Math.random() * 1e6))
const HUD_CORNER_MS = 5 * 60 * 1000
const STILL: Motion = { speed: null, glitch: 0 }

const schedulerConfig = { ambientGapMs: timing.ambientGapMs }

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
  const [initial] = useState(() => {
    const { event, memory } = planNextEvent(createMemory(), 0, videos, random.schedule, schedulerConfig)
    return { event: { ...event, startAt: timing.firstEventMs }, memory }
  })
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  const [plan, setPlan] = useState<PlannedEvent | null>(initial.event)
  const [preloadId, setPreloadId] = useState<string | null>(null)
  const [blip, setBlip] = useState(false)
  const [hudCorner, setHudCorner] = useState(0)
  const [, setRefresh] = useState(0)
  const stageRef = useRef<Stage>(stage)
  const planRef = useRef<PlannedEvent | null>(plan)
  const preloadRef = useRef<string | null>(null)
  const blipRef = useRef(false)
  const memoryRef = useRef(initial.memory)
  const faceRef = useRef<ActiveFace | null>(null)
  const motionRef = useRef<Motion>(STILL)
  const faceKeyRef = useRef(0)
  const headlineRef = useRef<string | undefined>(undefined)
  const durationsRef = useRef<Record<string, number>>({})

  const go = (next: Stage) => { stageRef.current = next; setStage(next) }
  const setPlanned = (next: PlannedEvent | null) => { planRef.current = next; setPlan(next) }
  const preload = (id: string | null) => { preloadRef.current = id; setPreloadId(id) }
  const setGlitch = (on: boolean) => {
    if (on === blipRef.current) return
    blipRef.current = on
    setBlip(on)
    if (on) audio.cue('glitch')
  }

  const planNext = (now: number) => {
    const { event, memory } = planNextEvent(memoryRef.current, now, videos, random.schedule, schedulerConfig)
    memoryRef.current = memory
    setPlanned(event)
  }

  const toIdle = (now: number, replan = true) => {
    faceRef.current = null
    motionRef.current = STILL
    setGlitch(false)
    go({ kind: 'idle' })
    if (replan && !planRef.current) planNext(now)
  }

  const startEvent = (event: PlannedEvent, now: number) => {
    setPlanned(null)
    memoryRef.current = recordStart(memoryRef.current, event)
    if (event.kind === 'video') {
      const video = videos.find(({ id }) => id === event.videoId) ?? videos[0]
      const name = pickFresh(playbackNames, headlineRef.current, random.face)
      headlineRef.current = name
      const headline = `REPRODUCIENDO ${name}:`
      preload(video.id)
      go({ kind: 'glitch-in', video, headline, until: now + timing.glitchMs })
      audio.cue('glitch')
      return
    }
    if (event.kind === 'rush') {
      go({ kind: 'rush', startedAt: now, endsAt: now + rushDuration })
      audio.cue('rush', rushDuration / 1000)
      return
    }
    const appearances = planFaceEvent(event.kind, random.face, window.innerWidth, window.innerHeight, safeInset)
    const endsAt = now + Math.max(...appearances.map(appearanceEnd))
    faceKeyRef.current += 100
    go({ kind: 'face', event: event.kind, startedAt: now, appearances, endsAt })
    audio.cue('face', (endsAt - now) / 1000)
  }

  const endVideo = (now: number) => {
    const current = stageRef.current
    if (current.kind !== 'video' && current.kind !== 'glitch-in') return
    go({ kind: 'glitch-out', video: current.video, headline: current.headline, until: now + timing.glitchMs })
    audio.cue('glitch')
  }

  const tick = (now: number) => {
    const current = stageRef.current
    const corner = Math.floor(now / HUD_CORNER_MS) % 4
    if (corner !== hudCorner) setHudCorner(corner)

    if (current.kind === 'idle') {
      const next = planRef.current
      if (!next) return planNext(now)
      if (next.kind === 'video' && next.videoId && next.startAt - now <= timing.preloadLeadMs && preloadRef.current !== next.videoId) preload(next.videoId)
      if (now >= next.startAt) startEvent(next, now)
    } else if (current.kind === 'face') {
      if (now >= current.endsAt) return toIdle(now)
      const elapsed = now - current.startedAt
      const index = current.appearances.findIndex((appearance) => elapsed >= appearance.at && elapsed < appearanceEnd(appearance))
      const appearance = current.appearances[index]
      faceRef.current = appearance
        ? { key: faceKeyRef.current + index, startedAt: current.startedAt + appearance.at, ...appearance }
        : null
      // A short glitch each time the face snaps in and each time it starts to dissolve.
      const glitching = current.appearances.some(({ at, timing: face }) => {
        const dissolveAt = at + face.convergeMs + face.holdMs
        return (elapsed >= at && elapsed < at + timing.blipMs) || (elapsed >= dissolveAt && elapsed < dissolveAt + timing.blipMs)
      })
      motionRef.current = glitching ? { speed: null, glitch: 0.6 } : STILL
      setGlitch(glitching)
    } else if (current.kind === 'rush') {
      if (now >= current.endsAt) return toIdle(now)
      const { speed, glitch, cut } = rushAt(now - current.startedAt)
      motionRef.current = { speed, glitch }
      setGlitch(cut)
    } else if (current.kind === 'glitch-in') {
      if (now < current.until) return
      const { video, headline } = current
      const timeoutMs = video.src === null
        ? video.durationMs ?? timing.placeholderMs
        : videoTimeoutMs({ durationMs: video.durationMs ?? durationsRef.current[video.id] ?? null }, timing.videoMaxMs, timing.videoTimeoutMarginMs)
      go({ kind: 'video', video, headline, startedAt: now, timeoutMs })
    } else if (current.kind === 'video') {
      if (now - current.startedAt >= current.timeoutMs) endVideo(now)
    } else if (now >= current.until) {
      preload(null)
      toIdle(now)
    }
  }
  const tickRef = useRef(tick)
  tickRef.current = tick
  useEffect(() => clock.subscribe((now) => tickRef.current(now)), [clock])

  // Operator: cut whatever is on screen and run a given event, or skip ahead with 'next'.
  const force = (kind: EventKind | 'next', videoId?: string) => {
    const now = clock.now
    const current = stageRef.current
    if (kind === 'next') {
      if (current.kind === 'video' || current.kind === 'glitch-in') endVideo(now)
      else if (current.kind === 'face' || current.kind === 'rush') toIdle(now)
      else if (planRef.current) setPlanned({ ...planRef.current, startAt: now })
      return
    }
    const event: PlannedEvent = kind === 'video' && videoId
      ? { kind, startAt: now, videoId }
      : planNextEvent(memoryRef.current, now, videos, random.schedule, schedulerConfig, kind).event
    if (current.kind === 'video' || current.kind === 'glitch-in') {
      setPlanned({ ...event, startAt: now + timing.glitchMs })
      endVideo(now)
      return
    }
    if (current.kind === 'glitch-out') { setPlanned({ ...event, startAt: current.until }); return }
    if (current.kind !== 'idle') toIdle(now, false)
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
      const eventIndex = Number(key) - 1
      if (key === 'escape') setPanelOpen(false)
      else if (event.code === 'Space' || key === 'p') { event.preventDefault(); setPaused((value) => !value) }
      else if (eventIndex >= 0 && eventIndex < EVENT_KINDS.length) forceRef.current(EVENT_KINDS[eventIndex])
      else if (key === 'n') forceRef.current('next')
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
  const headline = stage.kind === 'glitch-in' || stage.kind === 'video' || stage.kind === 'glitch-out' ? stage.headline : ''

  const stageLabel = stage.kind === 'idle' ? 'IDLE'
    : stage.kind === 'face' ? EVENT_LABELS[stage.event]
    : stage.kind === 'rush' ? EVENT_LABELS.rush
    : stage.kind === 'video' ? `VIDEO // ${stage.video.label}` : 'CORTE'
  const nextLabel = plan
    ? `${EVENT_LABELS[plan.kind]}${plan.kind === 'video' ? ` // ${videos.find(({ id }) => id === plan.videoId)?.label ?? '?'}` : ''} en ${Math.max(0, Math.ceil((plan.startAt - clock.now) / 1000))} s`
    : 'EN CURSO'

  return (
    <main
      className={`show stage-${stage.kind}${cutting ? ' is-cutting' : ''}${blip ? ' is-blip' : ''}${stable ? ' is-stable' : ''}${paused ? ' is-paused' : ''}${panelOpen ? ' has-panel' : ''}`}
      style={{ '--safe': `${safeInset * 100}vmin` } as React.CSSProperties}
    >
      <CodeField clock={clock} random={random.field} faceRef={faceRef} motionRef={motionRef} stable={stable} />
      <div className="crt" aria-hidden="true" />

      <p className={`hud hud-${hudCorner}`} aria-hidden="true">
        <b>ERR_404</b> CAPDEV NOT FOUND<br />
        <span>NODO PRINCIPAL // SUPERVISIÓN HUMANA: 0</span>
      </p>

      {clip && (
        <VideoInterlude
          key={clip.id}
          video={clip}
          headline={headline}
          visible={clipOnScreen}
          active={stage.kind === 'video'}
          paused={paused}
          muted={audio.muted}
          volume={audio.volume}
          onFinish={() => endVideo(clock.now)}
          onStatus={handleStatus}
        />
      )}

      {(cutting || blip) && <div className="signal-cut" aria-hidden="true"><i /><i /><i /><i /></div>}

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
            runEvent: (kind) => force(kind),
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
