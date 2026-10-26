/**
 * Sound effects synthesized with Web Audio: no files, works offline.
 * Browsers only allow audio after a user gesture, so the context is created lazily
 * on the first keystroke/click and every effect is a no-op until then or while muted.
 */

const MUTE_STORAGE_KEY = 'error404.muted'
const MASTER_VOLUME = 0.5

let context: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let muted = readMuted()

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export const isMuted = () => muted

export function setMuted(value: boolean): void {
  muted = value
  if (master && context) master.gain.setTargetAtTime(value ? 0 : MASTER_VOLUME, context.currentTime, 0.02)
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Mute still applies for this session.
  }
}

/** Call from a user gesture; creates or resumes the audio context. */
export function unlockAudio(): void {
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    context = new Ctor()
    master = context.createGain()
    master.gain.value = muted ? 0 : MASTER_VOLUME
    master.connect(context.destination)

    noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  }
  if (context.state === 'suspended') void context.resume()
}

function ready(): { ctx: AudioContext; out: GainNode; noise: AudioBuffer } | null {
  if (!context || !master || !noiseBuffer || muted || context.state !== 'running') return null
  return { ctx: context, out: master, noise: noiseBuffer }
}

/** Gain node with a fast attack and exponential decay. */
function envelope(ctx: AudioContext, start: number, peak: number, decay: number, attack = 0.002): GainNode {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)
  return gain
}

function noiseSource(ctx: AudioContext, noise: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource()
  source.buffer = noise
  source.loop = true
  source.loopStart = Math.random() * 0.5
  return source
}

/** Dry, short tick per typed character. */
export function playKey(): void {
  const audio = ready()
  if (!audio) return
  const { ctx, out, noise } = audio
  const t = ctx.currentTime

  const source = noiseSource(ctx, noise)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2200 + Math.random() * 1400
  filter.Q.value = 3
  const gain = envelope(ctx, t, 0.35, 0.035)
  source.connect(filter).connect(gain).connect(out)
  source.start(t)
  source.stop(t + 0.06)
}

/** ~0.4 s of crushed, stuttering static under the visual glitch. */
export function playGlitch(duration = 0.42): void {
  const audio = ready()
  if (!audio) return
  const { ctx, out, noise } = audio
  const t = ctx.currentTime

  const source = noiseSource(ctx, noise)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  const crush = ctx.createWaveShaper()
  crush.curve = stepCurve(6)
  const gate = ctx.createGain()
  gate.gain.value = 0

  // Random stutter: the gate and filter jump every ~30 ms like a broken signal.
  for (let at = 0; at < duration; at += 0.03) {
    gate.gain.setValueAtTime(Math.random() < 0.7 ? 0.25 + Math.random() * 0.25 : 0, t + at)
    filter.frequency.setValueAtTime(300 + Math.random() * 3500, t + at)
  }
  gate.gain.setValueAtTime(0, t + duration)

  // Low square buzz underneath for body.
  const buzz = ctx.createOscillator()
  buzz.type = 'square'
  buzz.frequency.setValueAtTime(55, t)
  buzz.frequency.linearRampToValueAtTime(38, t + duration)
  const buzzGain = envelope(ctx, t, 0.06, duration, 0.01)

  source.connect(filter).connect(crush).connect(gate).connect(out)
  buzz.connect(buzzGain).connect(out)
  source.start(t)
  source.stop(t + duration + 0.05)
  buzz.start(t)
  buzz.stop(t + duration + 0.05)
}

/** Deep, muffled hit when the name appears. */
export function playReveal(): void {
  const audio = ready()
  if (!audio) return
  const { ctx, out, noise } = audio
  const t = ctx.currentTime

  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(110, t)
  sub.frequency.exponentialRampToValueAtTime(32, t + 0.9)
  const subGain = envelope(ctx, t, 0.9, 1.6, 0.005)
  sub.connect(subGain).connect(out)
  sub.start(t)
  sub.stop(t + 1.8)

  // Short low thump of filtered noise for the attack.
  const source = noiseSource(ctx, noise)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  const thump = envelope(ctx, t, 0.5, 0.25)
  source.connect(filter).connect(thump).connect(out)
  source.start(t)
  source.stop(t + 0.3)
}

/** Plain square-wave beep (countdown ticks, scanner pings, log lines). */
export function playBeep(frequency = 880, duration = 0.1, volume = 0.06): void {
  const audio = ready()
  if (!audio) return
  const { ctx, out } = audio
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'square'
  osc.frequency.value = frequency
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.005)
  gain.gain.setValueAtTime(volume, t + duration - 0.02)
  gain.gain.linearRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Camera shutter, then a short "record saved" beep. */
export function playCapture(): void {
  const audio = ready()
  if (!audio) return
  const { ctx, out, noise } = audio
  const t = ctx.currentTime

  // Shutter: two quick high clicks.
  for (const offset of [0, 0.07]) {
    const source = noiseSource(ctx, noise)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1800
    const gain = envelope(ctx, t + offset, 0.45, 0.045)
    source.connect(filter).connect(gain).connect(out)
    source.start(t + offset)
    source.stop(t + offset + 0.08)
  }

  // Beep.
  const beep = ctx.createOscillator()
  beep.type = 'square'
  beep.frequency.value = 1320
  const beepStart = t + 0.32
  const beepGain = ctx.createGain()
  beepGain.gain.setValueAtTime(0.0001, beepStart)
  beepGain.gain.linearRampToValueAtTime(0.07, beepStart + 0.01)
  beepGain.gain.setValueAtTime(0.07, beepStart + 0.16)
  beepGain.gain.linearRampToValueAtTime(0.0001, beepStart + 0.18)
  beep.connect(beepGain).connect(out)
  beep.start(beepStart)
  beep.stop(beepStart + 0.2)
}

/** Shape of one synthesized scream. */
export interface ScreamProfile {
  name: string
  duration: number
  /** Pitch in Hz: attack start, peak, held value, release end. */
  pitch: [start: number, peak: number, hold: number, end: number]
  /** Seconds to reach the peak. */
  peakAt: number
  /** Vowel formants in Hz (AH, EE, OO...). */
  formants: [number, number, number]
  /** Detune in cents of each voice; several voices sound like a crowd or a demon. */
  voices: number[]
  vibratoRate: number
  vibratoDepth: number
  /** Random pitch wobble in Hz. */
  jitter: number
  /** Distortion amount. */
  drive: number
  /** Breath noise level. */
  breath: number
  /** Voice level. */
  level: number
  /** Voice "cracks": at this fraction of the duration pitch jumps by `ratio`. */
  crack?: { at: number; ratio: number }
  /** Choppy gating in Hz (sobbing / convulsing). */
  stutter?: number
  /** Add the sub hit underneath. */
  sub: boolean
}

const AH: [number, number, number] = [800, 1150, 2900]
const EE: [number, number, number] = [400, 2300, 3000]
const OO: [number, number, number] = [450, 800, 2800]
const EH: [number, number, number] = [600, 1800, 2600]

/** At least 10 distinct screams; one is picked at random each time. */
export const screamProfiles: ScreamProfile[] = [
  { name: 'clásico', duration: 1.6, pitch: [420, 980, 1080, 380], peakAt: 0.18, formants: AH, voices: [0, 13, -11, 1201], vibratoRate: 9, vibratoDepth: 28, jitter: 140, drive: 18, breath: 0.18, level: 0.55, sub: true },
  { name: 'alarido agudo', duration: 1.8, pitch: [600, 1500, 1400, 700], peakAt: 0.12, formants: EE, voices: [0, 9, -9], vibratoRate: 11, vibratoDepth: 35, jitter: 160, drive: 14, breath: 0.15, level: 0.5, sub: true },
  { name: 'grave', duration: 1.5, pitch: [180, 420, 380, 150], peakAt: 0.15, formants: AH, voices: [0, 15, -15, 1200], vibratoRate: 7, vibratoDepth: 18, jitter: 70, drive: 30, breath: 0.2, level: 0.6, sub: true },
  { name: 'quebrado', duration: 1.7, pitch: [500, 1200, 1250, 420], peakAt: 0.15, formants: AH, voices: [0, 12, -10], vibratoRate: 10, vibratoDepth: 30, jitter: 150, drive: 22, breath: 0.2, level: 0.55, crack: { at: 0.4, ratio: 0.55 }, sub: true },
  { name: 'coro', duration: 2.0, pitch: [400, 950, 1000, 350], peakAt: 0.25, formants: AH, voices: [-500, -480, 0, 20, 400, 700], vibratoRate: 8, vibratoDepth: 40, jitter: 200, drive: 16, breath: 0.22, level: 0.45, sub: true },
  { name: 'entrecortado', duration: 1.6, pitch: [450, 1100, 1050, 400], peakAt: 0.15, formants: EH, voices: [0, 10, -12], vibratoRate: 9, vibratoDepth: 25, jitter: 130, drive: 20, breath: 0.2, level: 0.55, stutter: 14, sub: true },
  { name: 'chillido', duration: 0.75, pitch: [900, 2000, 1900, 1200], peakAt: 0.06, formants: EE, voices: [0, 8, -8], vibratoRate: 14, vibratoDepth: 50, jitter: 220, drive: 12, breath: 0.12, level: 0.5, sub: true },
  { name: 'lamento', duration: 2.4, pitch: [300, 900, 850, 220], peakAt: 1.2, formants: OO, voices: [0, 7, -7, 1200], vibratoRate: 5, vibratoDepth: 60, jitter: 80, drive: 10, breath: 0.25, level: 0.5, sub: false },
  { name: 'desgarrado', duration: 1.6, pitch: [380, 900, 950, 300], peakAt: 0.12, formants: AH, voices: [0, 18, -16], vibratoRate: 12, vibratoDepth: 30, jitter: 400, drive: 60, breath: 0.35, level: 0.5, sub: true },
  { name: 'demoníaco', duration: 1.9, pitch: [250, 600, 560, 180], peakAt: 0.2, formants: AH, voices: [-1200, -1190, 0, 7], vibratoRate: 6, vibratoDepth: 22, jitter: 120, drive: 40, breath: 0.25, level: 0.6, sub: true },
  { name: 'ronco', duration: 1.4, pitch: [500, 1100, 1000, 450], peakAt: 0.1, formants: EH, voices: [0, 14], vibratoRate: 10, vibratoDepth: 20, jitter: 250, drive: 35, breath: 0.5, level: 0.3, sub: true },
  { name: 'descendente', duration: 1.6, pitch: [1400, 1500, 900, 200], peakAt: 0.05, formants: EE, voices: [0, 11, -11, 1200], vibratoRate: 9, vibratoDepth: 30, jitter: 150, drive: 18, breath: 0.18, level: 0.55, sub: true },
]

/**
 * Shrill, distorted scream for the jump to the final cryptic message.
 * Detuned saws through vowel formants with jittery vibrato, over breath noise and an
 * optional sub hit. A random profile is used unless one is given. Deliberately the loudest effect.
 */
export function playScream(profile: ScreamProfile = screamProfiles[Math.floor(Math.random() * screamProfiles.length)]): void {
  const audio = ready()
  if (!audio) return
  const { ctx, out, noise } = audio
  const { duration } = profile
  const t = ctx.currentTime
  const end = t + duration
  const [startHz, peakHz, holdHz, endHz] = profile.pitch

  const voice = ctx.createGain()
  voice.gain.setValueAtTime(0.0001, t)
  voice.gain.exponentialRampToValueAtTime(profile.level, t + 0.04)
  voice.gain.setValueAtTime(profile.level, t + duration * 0.55)
  voice.gain.exponentialRampToValueAtTime(0.0001, end)

  // Optional choppy gate between the formants and the output.
  let voiceOut: AudioNode = out
  let stutterOsc: OscillatorNode | null = null
  if (profile.stutter) {
    const gate = ctx.createGain()
    gate.gain.value = 0.5
    stutterOsc = ctx.createOscillator()
    stutterOsc.type = 'square'
    stutterOsc.frequency.value = profile.stutter
    const stutterDepth = ctx.createGain()
    stutterDepth.gain.value = 0.5
    stutterOsc.connect(stutterDepth).connect(gate.gain)
    gate.connect(out)
    voiceOut = gate
  }

  const drive = ctx.createWaveShaper()
  drive.curve = driveCurve(profile.drive)

  profile.formants.forEach((frequency, index) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = 6 + index * 2
    drive.connect(filter).connect(voice)
  })
  voice.connect(voiceOut)

  // Fast, irregular vibrato shared by every voice.
  const vibrato = ctx.createOscillator()
  vibrato.frequency.value = profile.vibratoRate
  const vibratoDepth = ctx.createGain()
  vibratoDepth.gain.value = profile.vibratoDepth
  vibrato.connect(vibratoDepth)
  const jitter = noiseSource(ctx, noise)
  const jitterFilter = ctx.createBiquadFilter()
  jitterFilter.type = 'lowpass'
  jitterFilter.frequency.value = 30
  const jitterDepth = ctx.createGain()
  jitterDepth.gain.value = profile.jitter
  jitter.connect(jitterFilter).connect(jitterDepth)

  const voiceLevel = 0.9 / Math.max(profile.voices.length, 1)
  const partials = profile.voices.map((detune) => {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.detune.value = detune
    osc.frequency.setValueAtTime(startHz, t)
    osc.frequency.exponentialRampToValueAtTime(peakHz, t + profile.peakAt)
    if (profile.crack) {
      const crackTime = t + duration * profile.crack.at
      osc.frequency.linearRampToValueAtTime(holdHz, crackTime)
      osc.frequency.setValueAtTime(holdHz * profile.crack.ratio, crackTime + 0.01)
      osc.frequency.linearRampToValueAtTime(holdHz * profile.crack.ratio * 1.1, t + duration * 0.6)
    } else {
      osc.frequency.linearRampToValueAtTime(holdHz, t + Math.max(duration * 0.55, profile.peakAt + 0.01))
    }
    osc.frequency.exponentialRampToValueAtTime(endHz, end)
    vibratoDepth.connect(osc.frequency)
    jitterDepth.connect(osc.frequency)
    const level = ctx.createGain()
    // Octave-up voices sit lower so they add bite without taking over.
    level.gain.value = Math.abs(detune) >= 1200 && detune > 0 ? voiceLevel * 0.5 : voiceLevel
    osc.connect(level).connect(drive)
    return osc
  })

  // Breath: high-passed noise that follows the voice envelope.
  const breath = noiseSource(ctx, noise)
  const breathFilter = ctx.createBiquadFilter()
  breathFilter.type = 'highpass'
  breathFilter.frequency.value = 2500
  const breathGain = envelope(ctx, t, profile.breath, duration, 0.03)
  breath.connect(breathFilter).connect(breathGain).connect(out)

  const sources: AudioScheduledSourceNode[] = [vibrato, jitter, breath, ...partials]
  if (stutterOsc) sources.push(stutterOsc)
  for (const source of sources) {
    source.start(t)
    source.stop(end + 0.05)
  }

  if (profile.sub) playReveal()
}

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(1024 * Float32Array.BYTES_PER_ELEMENT))
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount)
  }
  return curve
}

function stepCurve(steps: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(256 * Float32Array.BYTES_PER_ELEMENT))
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1
    curve[i] = Math.round(x * steps) / steps
  }
  return curve
}
