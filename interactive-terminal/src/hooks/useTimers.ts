import { useCallback, useEffect, useRef } from 'react'

/** setTimeout bookkeeping that is cleared on unmount, so a reset never leaves stale timers. */
export function useTimers() {
  const timersRef = useRef<number[]>([])

  const clear = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const schedule = useCallback((delay: number, run: () => void) => {
    timersRef.current.push(window.setTimeout(run, delay))
  }, [])

  useEffect(() => clear, [clear])

  return { schedule, clear }
}
