"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { EraserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DPR_CAP, MAX_PARTICLES, STIR, TOUCH_MAX_PARTICLES } from "./data"
import { FlowEngine } from "./engine"
import type { FlowSettings } from "./types"

type Pointer = { id: number; x0: number; y0: number; x: number; y: number; t: number; vx: number; vy: number; drag: boolean }

export function FlowCanvas({ settings }: { settings: FlowSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<FlowEngine | null>(null)
  const settingsRef = useRef(settings)
  const reducedRef = useRef(false)
  const stillRaf = useRef(0)
  const pointer = useRef<Pointer | null>(null)
  const { resolvedTheme } = useTheme()

  /** Reduced motion: (re)draw the still frame on the next animation frame. */
  const scheduleStill = () => {
    cancelAnimationFrame(stillRaf.current)
    stillRaf.current = requestAnimationFrame(() => {
      engineRef.current?.renderStill(settingsRef.current)
    })
  }

  useEffect(() => {
    settingsRef.current = settings
    if (reducedRef.current) scheduleStill()
  }, [settings])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const touch = window.matchMedia("(pointer: coarse)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    reducedRef.current = reduced

    let engine: FlowEngine
    try {
      engine = new FlowEngine(canvas, touch ? TOUCH_MAX_PARTICLES : MAX_PARTICLES)
    } catch {
      return
    }
    engineRef.current = engine
    engine.setTheme(resolvedTheme !== "light")
    const dpr = () => Math.min(window.devicePixelRatio || 1, touch ? DPR_CAP.touch : DPR_CAP.desktop)

    let size = ""
    const restart = () => {
      const next = `${canvas.clientWidth}x${canvas.clientHeight}`
      if (next === size || !engine.resize(dpr())) return
      size = next
      if (reduced) engine.renderStill(settingsRef.current)
      else {
        engine.reset(settingsRef.current)
        engine.warmUp(settingsRef.current)
      }
    }
    restart()
    const ro = new ResizeObserver(restart)
    ro.observe(canvas)

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      if (dt > 0) engine.frame(dt, settingsRef.current)
      raf = requestAnimationFrame(loop)
    }
    if (!reduced) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(stillRaf.current)
      ro.disconnect()
      engineRef.current = null
    }
  }, [resolvedTheme])

  const local = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = local(e)
    pointer.current = { id: e.pointerId, x0: x, y0: y, x, y, t: e.timeStamp, vx: 0, vy: 0, drag: false }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointer.current
    const engine = engineRef.current
    if (!p || p.id !== e.pointerId || !engine) return
    const { x, y } = local(e)
    if (!p.drag && Math.hypot(x - p.x0, y - p.y0) > STIR.tapSlop) p.drag = true
    if (!p.drag || reducedRef.current) return
    const d = Math.hypot(x - p.x, y - p.y)
    const dt = (e.timeStamp - p.t) / 1000
    if (d < STIR.sampleStep || dt <= 0) return
    // Smooth the drag velocity a little; raw pointer deltas are jittery.
    p.vx = p.vx * 0.4 + ((x - p.x) / dt) * 0.6
    p.vy = p.vy * 0.4 + ((y - p.y) / dt) * 0.6
    engine.stir(x, y, p.vx, p.vy, d)
    Object.assign(p, { x, y, t: e.timeStamp })
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointer.current
    if (!p || p.id !== e.pointerId) return
    pointer.current = null
    if (p.drag) return
    engineRef.current?.tap(p.x0, p.y0)
    if (reducedRef.current) scheduleStill()
  }

  const onClear = () => {
    const engine = engineRef.current
    if (!engine) return
    engine.clear(settingsRef.current)
    if (reducedRef.current) scheduleStill()
  }

  return (
    <div className="relative -mx-4 lg:mx-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Particles drifting on water-like currents. Tap for a whirlpool, drag to stir."
        className="block h-[64vh] w-full touch-none bg-muted select-none lg:rounded-xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (pointer.current = null)}
      />
      <Button
        variant="secondary"
        onClick={onClear}
        aria-label="Clear"
        className="site-chrome absolute right-3 bottom-3 size-11 bg-background/70 backdrop-blur sm:w-auto sm:px-4"
      >
        <EraserIcon />
        <span className="hidden sm:inline">Clear</span>
      </Button>
    </div>
  )
}
