"use client"

import { useEffect, useState } from "react"

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * Counts from 0 to `to` with an ease-out curve (no overshoot) whenever `to` or `runKey` change.
 * With reduced motion it jumps straight to the final value.
 */
export function useCountUp(to: number, durationMs: number, runKey: unknown, delayMs = 0) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || durationMs <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- immediate final value for reduced motion
      setValue(to)
      return
    }
    setValue(0)
    let raf = 0
    const start = performance.now() + delayMs
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / durationMs))
      setValue(Math.round(easeOutCubic(t) * to))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, durationMs, runKey, delayMs])

  return value
}
