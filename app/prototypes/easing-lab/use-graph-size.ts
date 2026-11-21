"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Measures the graph container's width and a CSS probe's height. The probe is sized
 * in `svh` by class, so the height cap follows the viewport without JS breakpoints.
 */
export function useGraphSize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; maxHeight: number } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const probe = probeRef.current
    if (!container || !probe) return
    const measure = () => {
      const width = container.clientWidth
      const maxHeight = probe.clientHeight
      setSize((prev) =>
        prev && prev.width === width && prev.maxHeight === maxHeight ? prev : { width, maxHeight },
      )
    }
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    ro.observe(probe)
    return () => ro.disconnect()
  }, [])

  return { containerRef, probeRef, size }
}
