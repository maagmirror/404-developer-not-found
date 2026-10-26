import { useEffect, useRef } from 'react'
import type { ShowClock } from '../clock'
import { FieldEngine, type ActiveFace, type Motion } from '../field/FieldEngine'

interface Props {
  clock: ShowClock
  random: () => number
  faceRef: React.RefObject<ActiveFace | null>
  motionRef: React.RefObject<Motion>
  stable: boolean
}

export function CodeField({ clock, random, faceRef, motionRef, stable }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stableRef = useRef(stable)
  stableRef.current = stable

  useEffect(() => {
    const canvas = canvasRef.current!
    const engine = new FieldEngine(canvas, random)
    const fit = () => {
      engine.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1, clock.now)
      engine.render(clock.now, 0, faceRef.current, stableRef.current, motionRef.current)
    }
    fit()
    window.addEventListener('resize', fit)

    let pending = 0
    let lastDraw = 0
    const unsubscribe = clock.subscribe((now, dt) => {
      pending += dt
      if (dt === 0) return
      // 30 fps is plenty for slow logs and keeps CPU low over a whole night; stable mode uses 20.
      const frameMs = stableRef.current ? 50 : 33
      const real = performance.now()
      if (real - lastDraw < frameMs - 2) return
      lastDraw = real
      engine.render(now, pending, faceRef.current, stableRef.current, motionRef.current)
      pending = 0
    })
    return () => {
      unsubscribe()
      window.removeEventListener('resize', fit)
    }
  }, [clock, faceRef, motionRef, random])

  return <canvas ref={canvasRef} className="code-field" aria-hidden="true" />
}
