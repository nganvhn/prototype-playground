"use client"

import { useEffect, useRef } from "react"
import type { Run } from "./types"

/**
 * Plays `keyframes` on the returned element once per run, using that run's easing and
 * duration. Between runs the element rests in its natural (end) state. Skipped entirely
 * with prefers-reduced-motion (the Web Animations API isn't covered by the global CSS rule).
 */
export function useEnterAnimation<T extends HTMLElement>(
  run: Run | null,
  keyframes: Keyframe[],
  reduced: boolean
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!run || !el || reduced) return
    const anim = el.animate(keyframes, {
      duration: run.duration,
      easing: run.easing,
      fill: "backwards",
    })
    return () => anim.cancel()
    // keyframes are module constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduced])

  return ref
}
