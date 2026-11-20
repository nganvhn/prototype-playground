"use client"

import { useEffect, useMemo, useRef } from "react"
import { useTheme } from "next-themes"
import { PARTICLE_LIGHTNESS } from "./data"
import { createParticles, mulberry32, step, toCanvas } from "./simulation"
import type { OrbitSettings } from "./types"

export function OrbitCanvas({ settings }: { settings: OrbitSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef(settings)
  const { resolvedTheme } = useTheme()

  const particles = useMemo(
    () => createParticles(settings.count, settings.layout, mulberry32(7)),
    [settings.count, settings.layout]
  )

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // Canvas can't read Tailwind classes, so pull the background token at runtime.
    const background = getComputedStyle(canvas).getPropertyValue("--background").trim()
    const lightness = PARTICLE_LIGHTNESS[resolvedTheme === "light" ? "light" : "dark"]
    let width = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      canvas.width = width * dpr
      canvas.height = width * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, width)
    }

    const draw = (dt: number) => {
      const s = settingsRef.current
      step(particles, dt, s.speed)
      ctx.globalAlpha = s.trails ? 0.12 : 1
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, width)
      ctx.globalAlpha = 1
      const half = width / 2
      for (const p of particles) {
        const { x, y } = toCanvas(p, half, half, half)
        ctx.fillStyle = `oklch(${lightness} 0.16 ${(s.hue + p.hueOffset + 360) % 360})`
        ctx.beginPath()
        ctx.arc(x, y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = (now: number) => {
      draw(Math.min((now - last) / 1000, 1 / 20))
      last = now
      raf = requestAnimationFrame(loop)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    if (reduced) draw(0)
    else raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [particles, resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Particles orbiting a centre point"
      role="img"
      className="aspect-square w-full rounded-xl border border-border bg-background"
    />
  )
}
