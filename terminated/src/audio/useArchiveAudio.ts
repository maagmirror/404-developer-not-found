import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Phase } from '../domain/simulation'

const MUTE_KEY = 'error404.terminated.muted'
const VOLUME_KEY = 'error404.terminated.volume'

type WebkitWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

export type Cue = Phase | 'tick'

interface ArchiveAudioEngine {
  context: AudioContext
  master: GainNode
  drone: GainNode
  oscillators: OscillatorNode[]
  pulseTimer: number | null
  stopped: boolean
  /** Recorded scream for the terminated cue; null until decoded or if it failed to load. */
  scream: AudioBuffer | null
}

// Recorded scream (credits in CREDITS.md); fetched once, decoded per audio context.
const SCREAM_URL = `${import.meta.env.BASE_URL}sounds/scream-terminated.ogg`
const SCREAM_LEVEL = 0.9
let screamData: Promise<ArrayBuffer> | null = null

function loadScream(engine: ArchiveAudioEngine) {
  screamData ??= fetch(SCREAM_URL).then((response) => {
    if (!response.ok) throw new Error(`scream: HTTP ${response.status}`)
    return response.arrayBuffer()
  })
  screamData
    // decodeAudioData detaches its input, so each context gets a copy.
    .then((data) => engine.context.decodeAudioData(data.slice(0)))
    .then((buffer) => { engine.scream = buffer })
    .catch(() => { /* The synthesized screech stays as the fallback. */ })
}

function playScream(engine: ArchiveAudioEngine): boolean {
  if (engine.stopped || !engine.scream) return false
  const { context, master } = engine
  const source = context.createBufferSource()
  const gain = context.createGain()
  source.buffer = engine.scream
  gain.gain.value = SCREAM_LEVEL
  source.connect(gain).connect(master)
  source.addEventListener('ended', () => {
    source.disconnect()
    gain.disconnect()
  }, { once: true })
  source.start()
  return true
}

function getStoredMute() {
  try { return localStorage.getItem(MUTE_KEY) === 'true' } catch { return false }
}

function getStoredVolume() {
  try {
    const stored = localStorage.getItem(VOLUME_KEY)
    // Number(null) is 0: without this guard a first visit would start silent.
    const value = stored === null ? Number.NaN : Number(stored)
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.58
  } catch { return 0.58 }
}

function createTone(engine: ArchiveAudioEngine, frequency: number, duration: number, level: number, type: OscillatorType = 'sine', delay = 0, endFrequency?: number) {
  if (engine.stopped) return
  const { context, master } = engine
  const start = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.035, duration / 3))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(master)
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect()
    gain.disconnect()
  }, { once: true })
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

// Filtered white noise whose band sweeps down: reads as a breathy shriek rather than a hiss.
function createNoiseSweep(engine: ArchiveAudioEngine, duration: number, level: number, fromFrequency: number, toFrequency: number, q: number, delay = 0) {
  if (engine.stopped) return
  const { context, master } = engine
  const start = context.currentTime + delay
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(fromFrequency, start)
  filter.frequency.exponentialRampToValueAtTime(toFrequency, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(gain).connect(master)
  source.addEventListener('ended', () => {
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }, { once: true })
  source.start(start)
  source.stop(start + duration + 0.02)
}

// Detuned saw voice with a fast, uneven vibrato that falls in pitch: an inhuman scream.
function createScreech(engine: ArchiveAudioEngine, fromFrequency: number, toFrequency: number, duration: number, level: number, delay = 0) {
  if (engine.stopped) return
  const { context, master } = engine
  const start = context.currentTime + delay
  const voice = context.createOscillator()
  const lfo = context.createOscillator()
  const lfoDepth = context.createGain()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  voice.type = 'sawtooth'
  voice.frequency.setValueAtTime(fromFrequency, start)
  voice.frequency.exponentialRampToValueAtTime(toFrequency, start + duration)
  lfo.frequency.setValueAtTime(11, start)
  lfo.frequency.linearRampToValueAtTime(5, start + duration)
  lfoDepth.gain.value = fromFrequency * 0.04
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(3200, start)
  filter.frequency.exponentialRampToValueAtTime(500, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + 0.06)
  gain.gain.setValueAtTime(level, start + duration * 0.35)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  lfo.connect(lfoDepth).connect(voice.frequency)
  voice.connect(filter).connect(gain).connect(master)
  voice.addEventListener('ended', () => {
    voice.disconnect()
    lfo.disconnect()
    lfoDepth.disconnect()
    filter.disconnect()
    gain.disconnect()
  }, { once: true })
  voice.start(start)
  lfo.start(start)
  voice.stop(start + duration + 0.02)
  lfo.stop(start + duration + 0.02)
}

function pulse(engine: ArchiveAudioEngine) {
  createTone(engine, 196, 0.7, 0.032, 'sine')
  createTone(engine, 98, 1.1, 0.018, 'sine', 0.08)
}

function schedulePulses(engine: ArchiveAudioEngine) {
  if (engine.pulseTimer !== null || engine.stopped) return
  engine.pulseTimer = window.setInterval(() => pulse(engine), 3400)
}

function stopPulses(engine: ArchiveAudioEngine) {
  if (engine.pulseTimer === null) return
  window.clearInterval(engine.pulseTimer)
  engine.pulseTimer = null
}

function createEngine(volume: number, muted: boolean): ArchiveAudioEngine | null {
  const AudioContextConstructor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
  if (!AudioContextConstructor) return null

  try {
    const context = new AudioContextConstructor()
    const master = context.createGain()
    const compressor = context.createDynamicsCompressor()
    const drone = context.createGain()
    const filter = context.createBiquadFilter()
    const oscillators: OscillatorNode[] = []
    master.gain.value = muted ? 0 : volume
    compressor.threshold.value = -18
    compressor.ratio.value = 8
    filter.type = 'lowpass'
    filter.frequency.value = 190
    filter.Q.value = 1.8
    drone.gain.value = 0.055
    drone.connect(filter).connect(master).connect(compressor).connect(context.destination)

    ;[
      { frequency: 41.2, type: 'sine' as const, detune: -7 },
      { frequency: 55, type: 'triangle' as const, detune: 5 },
      { frequency: 82.4, type: 'sine' as const, detune: -3 },
    ].forEach(({ frequency, type, detune }) => {
      const oscillator = context.createOscillator()
      oscillator.type = type
      oscillator.frequency.value = frequency
      oscillator.detune.value = detune
      oscillator.connect(drone)
      oscillator.start()
      oscillators.push(oscillator)
    })

    const engine: ArchiveAudioEngine = { context, master, drone, oscillators, pulseTimer: null, stopped: false, scream: null }
    loadScream(engine)
    schedulePulses(engine)
    void context.resume().catch(() => undefined)
    return engine
  } catch {
    return null
  }
}

function playCue(engine: ArchiveAudioEngine | null, cue: Cue) {
  if (!engine || engine.stopped) return
  const cueMap: Record<Cue, () => void> = {
    tick: () => createTone(engine, 1220, 0.025, 0.022, 'square'),
    profile: () => {
      createTone(engine, 720, 0.09, 0.035, 'sine')
      createTone(engine, 960, 0.15, 0.025, 'sine', 0.1)
      createTone(engine, 92, 0.9, 0.03, 'triangle', 0.05)
    },
    flicker: () => {
      // Irregular electrical stutter that tracks the visual flicker.
      ;[0, 0.11, 0.19, 0.34, 0.52, 0.61].forEach((delay, index) => createTone(engine, index % 2 ? 1840 : 233, 0.05, 0.03, 'square', delay))
      createTone(engine, 311, 0.8, 0.03, 'sawtooth', 0.05, 92)
    },
    terminated: () => {
      // Horror stinger: sub impact, a scream (recorded, or synthesized if it isn't loaded),
      // a dissonant minor-second cluster and a dying rumble.
      createTone(engine, 80, 0.9, 0.16, 'sine', 0, 28)
      createTone(engine, 58, 1.35, 0.1, 'sawtooth')
      if (!playScream(engine)) {
        createNoiseSweep(engine, 1.3, 0.11, 2800, 600, 7)
        createScreech(engine, 1180, 330, 1.5, 0.045)
        createScreech(engine, 1245, 311, 1.5, 0.035, 0.02)
      }
      ;[466, 494, 523].forEach((frequency, index) => createTone(engine, frequency, 2.4, 0.02, 'sawtooth', 0.12 + index * 0.03, frequency * 0.94))
      createTone(engine, 31, 2.6, 0.09, 'sine', 0.3)
    },
  }
  try { cueMap[cue]() } catch { /* Audio is atmospheric; unsupported nodes must not stop the simulation. */ }
}

function stopEngine(engine: ArchiveAudioEngine | null) {
  if (!engine || engine.stopped) return
  engine.stopped = true
  stopPulses(engine)
  engine.oscillators.forEach((oscillator) => {
    try { oscillator.stop() } catch { /* Already stopped. */ }
    oscillator.disconnect()
  })
  engine.drone.disconnect()
  engine.master.disconnect()
  void engine.context.close().catch(() => undefined)
}

export function useArchiveAudio() {
  const engineRef = useRef<ArchiveAudioEngine | null>(null)
  const [muted, setMutedState] = useState(getStoredMute)
  const [volume, setVolumeState] = useState(getStoredVolume)
  const [available, setAvailable] = useState(true)
  const preferenceRef = useRef({ muted, volume })
  preferenceRef.current = { muted, volume }

  const arm = useCallback(() => {
    stopEngine(engineRef.current)
    engineRef.current = createEngine(preferenceRef.current.volume, preferenceRef.current.muted)
    setAvailable(Boolean(engineRef.current))
  }, [])

  const stop = useCallback(() => {
    stopEngine(engineRef.current)
    engineRef.current = null
  }, [])

  const cue = useCallback((value: Cue) => playCue(engineRef.current, value), [])

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value)
    try { localStorage.setItem(MUTE_KEY, String(value)) } catch { /* Preference persistence is optional. */ }
    const engine = engineRef.current
    if (engine && !engine.stopped) engine.master.gain.setTargetAtTime(value ? 0 : preferenceRef.current.volume, engine.context.currentTime, 0.035)
  }, [])

  const setVolume = useCallback((value: number) => {
    const safeValue = Math.min(1, Math.max(0, value))
    setVolumeState(safeValue)
    try { localStorage.setItem(VOLUME_KEY, String(safeValue)) } catch { /* Preference persistence is optional. */ }
    const engine = engineRef.current
    if (engine && !engine.stopped && !preferenceRef.current.muted) engine.master.gain.setTargetAtTime(safeValue, engine.context.currentTime, 0.035)
  }, [])

  const setRunning = useCallback((running: boolean) => {
    const engine = engineRef.current
    if (!engine || engine.stopped) return
    if (running) schedulePulses(engine)
    else stopPulses(engine)
    engine.drone.gain.setTargetAtTime(running ? 0.055 : 0.012, engine.context.currentTime, 0.12)
  }, [])

  useEffect(() => stop, [stop])

  // Stable identity: Simulation effects depend on it and must not re-fire cues when volume changes.
  return useMemo(
    () => ({ arm, stop, cue, setRunning, muted, setMuted, volume, setVolume, available }),
    [arm, stop, cue, setRunning, muted, setMuted, volume, setVolume, available],
  )
}
