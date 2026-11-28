"use client"

import { useRef } from "react"
import { SWIPE_THRESHOLD } from "./data"

/**
 * Horizontal swipe on any element (touch, pen or mouse drag). A click that ends a
 * swipe is swallowed, so swiping across a swatch doesn't also copy it.
 */
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY }
      swiped.current = false
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return
      swiped.current = true
      if (dx < 0) onLeft()
      else onRight()
    },
    onPointerCancel: () => {
      start.current = null
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (!swiped.current) return
      swiped.current = false
      e.preventDefault()
      e.stopPropagation()
    },
  }
}
