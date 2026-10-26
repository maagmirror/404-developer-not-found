// Synthesized room tone. Always starts silent: browsers only allow sound after a gesture,
// and the installation must never depend on it. Only the volume is remembered.
import { useCallback, useEffect, useRef, useState } from 'react'

const VOLUME_KEY = 'error404.evil-ai.volume'

export type Cue = 'face' | 'glitch' | 'rush'

type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }

interface Engine {
  context: AudioContext
  master: GainNode
  noise: AudioBuffer
}

function storedVolume() {
  try {
    const stored = localStorage.getItem(VOLUME_KEY)
    const value = stored === null ? Number.NaN : Number(stored)
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5
  } catch { return 0.5 }
}

function createEngine(): Engine | null {
  const Context = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
  if (!Context) return null
  const context = new Context()
  const master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)

  const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const data = noise.getChannelData(0)
  let last = 0
  for (let index = 0; index < data.length; index += 1) {
    // Brown noise: a low rumble instead of a hiss.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[index] = last * 3.5
  }

  const drone = context.createGain()
  drone.gain.value = 0.16
  drone.connect(master)
  for (const [frequency, level] of [[41.2, 0.5], [61.7, 0.28], [82.9, 0.08]]) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency
    gain.gain.value = level
    oscillator.connect(gain).connect(drone)
    oscillator.start()
  }
  const rumble = context.createBufferSource()
  rumble.buffer = noise
  rumble.loop = true
  const lowpass = context.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 180
  const rumbleGain = context.createGain()
  rumbleGain.gain.value = 0.5
  rumble.connect(lowpass).connect(rumbleGain).connect(drone)
  rumble.start()
  return { context, master, noise }
}

function playCue(engine: Engine, cue: Cue, seconds: number) {
  const { context, master, noise } = engine
  const now = context.currentTime
  if (cue === 'glitch') {
    const source = context.createBufferSource()
    source.buffer = noise
    const band = context.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1400
    band.Q.value = 0.7
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    source.connect(band).connect(gain).connect(master)
    source.start(now, Math.random())
    source.stop(now + 0.5)
    return
  }
  if (cue === 'rush') {
    // The field tearing past: a noise band sweeping up, then dropping.
    const source = context.createBufferSource()
    source.buffer = noise
    source.loop = true
    const band = context.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 1.2
    band.frequency.setValueAtTime(300, now)
    band.frequency.exponentialRampToValueAtTime(2600, now + seconds * 0.55)
    band.frequency.exponentialRampToValueAtTime(400, now + seconds)
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.4)
    gain.gain.setValueAtTime(0.55, now + seconds * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
    source.connect(band).connect(gain).connect(master)
    source.start(now)
    source.stop(now + seconds + 0.1)
    return
  }
  // Face: a sub swell with a breath on top, stretched over the time the face is on screen.
  const rise = Math.min(1.5, seconds * 0.3)
  const oscillator = context.createOscillator()
  const swell = context.createGain()
  oscillator.frequency.setValueAtTime(58, now)
  oscillator.frequency.exponentialRampToValueAtTime(46, now + seconds)
  swell.gain.setValueAtTime(0.0001, now)
  swell.gain.exponentialRampToValueAtTime(0.5, now + rise)
  swell.gain.setValueAtTime(0.5, now + seconds * 0.85)
  swell.gain.exponentialRampToValueAtTime(0.0001, now + seconds + 0.5)
  oscillator.connect(swell).connect(master)
  oscillator.start(now)
  oscillator.stop(now + seconds + 0.6)

  const breath = context.createBufferSource()
  breath.buffer = noise
  breath.loop = true
  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(320, now)
  band.frequency.linearRampToValueAtTime(700, now + rise)
  band.Q.value = 2.5
  const breathGain = context.createGain()
  breathGain.gain.setValueAtTime(0.0001, now)
  breathGain.gain.exponentialRampToValueAtTime(0.35, now + rise)
  breathGain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  breath.connect(band).connect(breathGain).connect(master)
  breath.start(now)
  breath.stop(now + seconds + 0.1)
}

export function useAmbientAudio() {
  const [muted, setMuted] = useState(true)
  const [volume, setVolumeState] = useState(storedVolume)
  const engineRef = useRef<Engine | null>(null)

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const target = muted ? 0 : volume * 0.9
    engine.master.gain.setTargetAtTime(target, engine.context.currentTime, 0.25)
  }, [muted, volume])

  useEffect(() => () => {
    void engineRef.current?.context.close()
    engineRef.current = null
  }, [])

  // Must run inside a click or key handler: that is what unlocks Web Audio.
  const toggleMute = useCallback(() => {
    if (!engineRef.current) engineRef.current = createEngine()
    void engineRef.current?.context.resume()
    setMuted((value) => !value)
  }, [])

  const setVolume = useCallback((value: number) => {
    setVolumeState(value)
    try { localStorage.setItem(VOLUME_KEY, String(value)) } catch { /* storage blocked: keep it for this session */ }
  }, [])

  const cue = useCallback((kind: Cue, seconds = 3) => {
    const engine = engineRef.current
    if (engine && !muted && engine.context.state === 'running') playCue(engine, kind, seconds)
  }, [muted])

  return { muted, volume, toggleMute, setVolume, cue }
}
