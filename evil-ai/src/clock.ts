// Show time: milliseconds the installation has actually been running. It stops while paused,
// so every timer (scheduler, face, video timeout) pauses with it.
import { useEffect, useState } from 'react'

type Listener = (now: number, dt: number) => void

export class ShowClock {
  now = 0
  paused = false
  private listeners = new Set<Listener>()
  private frame = 0
  private last = 0

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  start() {
    this.last = performance.now()
    const loop = (time: number) => {
      // Clamp so a background tab does not fast-forward through several events at once.
      const dt = this.paused ? 0 : Math.min(100, Math.max(0, time - this.last))
      this.last = time
      this.now += dt
      this.listeners.forEach((listener) => listener(this.now, dt))
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.frame)
  }
}

export function useShowClock(paused: boolean) {
  const [clock] = useState(() => new ShowClock())
  useEffect(() => {
    clock.start()
    return () => clock.stop()
  }, [clock])
  useEffect(() => { clock.paused = paused }, [clock, paused])
  return clock
}
