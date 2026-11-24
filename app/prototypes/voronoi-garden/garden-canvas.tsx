"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { toneFor } from "./color"
import { DRAG_THRESHOLD_PX, GRAB_RADIUS_PX, LONG_PRESS_MS } from "./data"
import { Garden } from "./garden"
import { computeCells, nearestSite } from "./geometry"
import { drawGarden } from "./render"
import { loadGarden, saveGarden } from "./storage"
import type { GardenSettings, Seed, Site } from "./types"

type Press = {
  pointerId: number
  startX: number
  startY: number
  start: number
  /** Seed under the finger's pin, if close enough to drag. */
  grabbed: Seed | null
  /** Cell under the finger, removed on long-press. */
  target: Seed | null
  moved: boolean
  removed: boolean
}

/** Overlay starts this long into a press, so ordinary taps don't flash. */
const PRESS_FEEDBACK_DELAY = 150

export function GardenCanvas({ settings, clearToken }: { settings: GardenSettings; clearToken: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef(settings)
  const [garden] = useState(() => new Garden())
  const wakeRef = useRef<() => void>(() => {})
  const [empty, setEmpty] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    settingsRef.current = settings
    wakeRef.current()
  }, [settings])

  // Load the saved garden on mount (never during server render).
  useEffect(() => {
    const stored = loadGarden()
    if (stored) garden.load(stored)
    else garden.seedStarter()
    wakeRef.current()
  }, [garden])

  useEffect(() => {
    if (clearToken === 0) return
    garden.clear(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    saveGarden(garden.toStored())
    wakeRef.current()
  }, [clearToken, garden])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const background = getComputedStyle(canvas).getPropertyValue("--background").trim()
    const tone = toneFor(resolvedTheme)
    let size = 0
    let raf = 0
    let last = 0
    let time = 0
    let sites: Site[] = []
    let press: Press | null = null
    let pressTimer = 0
    let lastPointerType = "mouse"
    let wasEmpty: boolean | null = null

    const save = () => saveGarden(garden.toStored())

    const tick = (now: number) => {
      raf = 0
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      const s = settingsRef.current
      if (!reduced) time += dt

      if (garden.enforceMax(s.maxSeeds, reduced) > 0) save()
      const busy = garden.step(reduced ? 1e3 : dt)
      sites = garden.sites(time, reduced ? 0 : s.breathing, s.breathSpeed)
      const cells = computeCells(sites)

      let pressFx: { id: number; progress: number } | null = null
      if (press && press.target && !press.moved && !press.removed && !reduced) {
        const p = (now - press.start - PRESS_FEEDBACK_DELAY) / (LONG_PRESS_MS - PRESS_FEEDBACK_DELAY)
        pressFx = { id: press.target.id, progress: Math.min(1, Math.max(0, p)) }
      }

      drawGarden(cells, { ctx, size, background, tone, t: time, settings: s, press: pressFx })

      const isEmpty = garden.seeds.length === 0
      if (isEmpty !== wasEmpty) {
        wasEmpty = isEmpty
        setEmpty(isEmpty)
      }

      const animating =
        !reduced && (busy || s.breathing > 0 || s.recolourSpeed > 0 || pressFx !== null)
      if (animating) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    wakeRef.current = wake

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = canvas.clientWidth
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      wake()
    }

    const toNorm = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, w: r.width }
    }

    const liveOnly = (s: Site) => s.seed.phase === "dying"

    const cellAt = (x: number, y: number) => {
      const i = nearestSite(sites, x, y, liveOnly)
      return i >= 0 ? sites[i] : null
    }

    const removeAt = (x: number, y: number) => {
      const site = cellAt(x, y)
      if (!site) return false
      garden.remove(site.seed, reduced)
      save()
      wake()
      return true
    }

    const onDown = (e: PointerEvent) => {
      lastPointerType = e.pointerType
      if (e.pointerType === "mouse" && e.button !== 0) return
      if (press) return
      const { x, y, w } = toNorm(e)
      const near = cellAt(x, y)
      const grabbed =
        near && Math.hypot(near.px - x, near.py - y) * w <= GRAB_RADIUS_PX ? near.seed : null
      canvas.setPointerCapture(e.pointerId)
      press = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        start: performance.now(),
        grabbed,
        target: near?.seed ?? null,
        moved: false,
        removed: false,
      }
      const current = press
      pressTimer = window.setTimeout(() => {
        if (press !== current || current.moved || !current.target) return
        current.removed = true
        garden.remove(current.target, reduced)
        save()
        navigator.vibrate?.(12)
        wake()
      }, LONG_PRESS_MS)
      wake()
    }

    const onMove = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.pointerId || press.removed) return
      if (!press.moved && Math.hypot(e.clientX - press.startX, e.clientY - press.startY) > DRAG_THRESHOLD_PX) {
        press.moved = true
        clearTimeout(pressTimer)
      }
      if (press.moved && press.grabbed && press.grabbed.phase !== "dying") {
        const seed = press.grabbed
        const site = sites.find((s) => s.seed === seed)
        const driftX = site ? site.px - seed.x : 0
        const driftY = site ? site.py - seed.y : 0
        const { x, y } = toNorm(e)
        garden.move(seed, x - driftX, y - driftY)
        wake()
      }
    }

    const onUp = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.pointerId) return
      clearTimeout(pressTimer)
      const p = press
      press = null
      if (!p.removed) {
        if (!p.moved) {
          const { x, y } = toNorm(e)
          if (garden.plant(x, y, reduced)) save()
        } else if (p.grabbed) {
          save()
        }
      }
      wake()
    }

    const onCancel = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.pointerId) return
      clearTimeout(pressTimer)
      if (press.moved && press.grabbed) save()
      press = null
      wake()
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      // Touch long-press is handled by the timer; some browsers also fire contextmenu.
      if (lastPointerType === "touch" || lastPointerType === "pen") return
      const { x, y } = toNorm(e)
      removeAt(x, y)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onCancel)
    canvas.addEventListener("contextmenu", onContextMenu)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(pressTimer)
      wakeRef.current = () => {}
      ro.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onCancel)
      canvas.removeEventListener("contextmenu", onContextMenu)
    }
  }, [resolvedTheme, garden])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Voronoi garden. Tap to plant a seed, long-press a cell to remove it, drag a seed to move it."
        className="block aspect-square w-full cursor-crosshair touch-none rounded-xl border border-border bg-background select-none [-webkit-touch-callout:none]"
      />
      <p
        aria-hidden={!empty}
        className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground transition-opacity duration-500 ease-out data-[show=false]:opacity-0"
        data-show={empty}
      >
        Tap to plant
      </p>
    </div>
  )
}
