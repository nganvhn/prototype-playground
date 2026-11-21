"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toCss } from "./bezier"
import { HOLD_MS } from "./data"
import type { Bezier, Run } from "./types"

/**
 * Drives playback passes. Each pass snapshots the curve and duration into a `Run`;
 * after duration + HOLD_MS it either starts the next pass (loop) or stops.
 */
export function usePlayback(bezier: Bezier, duration: number, loop: boolean) {
  const [run, setRun] = useState<Run | null>(null)
  const [playing, setPlaying] = useState(false)
  const latest = useRef({ bezier, duration, loop })

  useEffect(() => {
    latest.current = { bezier, duration, loop }
  }, [bezier, duration, loop])

  const play = useCallback(() => {
    const { bezier: b, duration: d } = latest.current
    const startedAt = performance.now()
    setRun((prev) => ({ id: (prev?.id ?? 0) + 1, bezier: b, easing: toCss(b), duration: d, startedAt }))
    setPlaying(true)
  }, [])

  const stop = useCallback(() => setPlaying(false), [])

  useEffect(() => {
    if (!playing || !run) return
    const t = window.setTimeout(() => {
      if (latest.current.loop) play()
      else setPlaying(false)
    }, run.duration + HOLD_MS)
    return () => window.clearTimeout(t)
  }, [playing, run, play])

  return { run, playing, play, stop }
}
