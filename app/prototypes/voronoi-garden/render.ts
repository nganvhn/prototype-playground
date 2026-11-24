import { oklch, seedHue, type Tone } from "./color"
import { insetPolygon } from "./geometry"
import type { Cell, GardenSettings } from "./types"

export type Frame = {
  ctx: CanvasRenderingContext2D
  size: number
  background: string
  tone: Tone
  t: number
  settings: GardenSettings
  /** Seed being long-pressed and how far along (0..1) the press is. */
  press: { id: number; progress: number } | null
}

function addPoly(path: Path2D, poly: number[], scale: number) {
  path.moveTo(poly[0] * scale, poly[1] * scale)
  for (let i = 2; i < poly.length; i += 2) path.lineTo(poly[i] * scale, poly[i + 1] * scale)
  path.closePath()
}

/**
 * Canvas re-parses colour strings on every assignment, so build each string once per
 * (rounded) value. The cache is cleared when it grows large.
 */
const colourCache = new Map<string, string>()
function colour(l: number, c: number, h: number) {
  const key = `${Math.round(l * 200)}|${Math.round(c * 400)}|${Math.round(h * 2)}`
  let v = colourCache.get(key)
  if (!v) {
    if (colourCache.size > 4000) colourCache.clear()
    v = oklch(Math.round(l * 200) / 200, Math.round(c * 400) / 400, Math.round(h * 2) / 2)
    colourCache.set(key, v)
  }
  return v
}

export function drawGarden(cells: Cell[], f: Frame) {
  const { ctx, size, background, tone, t, settings: s } = f
  ctx.globalAlpha = 1
  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)

  const borders = new Path2D()
  const pins = new Path2D()
  const outline = s.style === "outline"
  const band = Math.max(3, s.borderWidth * 1.5) / size

  for (const { site, poly } of cells) {
    const h = seedHue(site.seed, t, s.hue, s.hueSpread, s.recolourSpeed)
    const l = tone.l + site.seed.tone
    const cell = new Path2D()
    addPoly(cell, poly, size)
    if (s.borderWidth > 0) addPoly(borders, poly, size)
    // Cells fade a little as they grow in / shrink away, on top of changing size.
    ctx.globalAlpha = 0.35 + 0.65 * site.scale

    if (s.style === "flat") {
      ctx.fillStyle = colour(l, tone.c, h)
      ctx.fill(cell)
    } else if (s.style === "gradient") {
      const cx = site.px * size
      const cy = site.py * size
      let r = 1
      for (let k = 0; k < poly.length; k += 2) {
        r = Math.max(r, Math.hypot(poly[k] * size - cx, poly[k + 1] * size - cy))
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, colour(l + 0.08, tone.c * 0.85, h))
      g.addColorStop(1, colour(l - 0.1, tone.c * 1.1, h))
      ctx.fillStyle = g
      ctx.fill(cell)
    } else {
      // Outline: a ring between the cell and an inset copy of it (even-odd fill).
      const ring = new Path2D()
      addPoly(ring, poly, size)
      const inner = insetPolygon(poly, band)
      if (inner.length >= 6) addPoly(ring, inner, size)
      const alpha = ctx.globalAlpha
      ctx.fillStyle = colour(l, tone.c * 1.15, h)
      ctx.fill(ring, "evenodd")
      // A faint tint inside, like light through clear glass.
      ctx.globalAlpha = alpha * 0.12
      ctx.fill(cell)
      ctx.globalAlpha = alpha
    }

    if (f.press && f.press.id === site.seed.id && f.press.progress > 0) {
      ctx.globalAlpha = 0.45 * f.press.progress
      ctx.fillStyle = background
      ctx.fill(cell)
    }

    // Seeds: small pins so they're easy to find and drag.
    const r = 2.5 * site.scale
    if (r >= 0.3) {
      const px = site.px * size
      const py = site.py * size
      if (outline) {
        ctx.globalAlpha = 0.9
        ctx.fillStyle = colour(l, tone.c * 1.15, h)
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      } else {
        pins.moveTo(px + r, py)
        pins.arc(px, py, r, 0, Math.PI * 2)
      }
    }
  }

  ctx.globalAlpha = 1
  if (s.borderWidth > 0) {
    ctx.lineJoin = "round"
    ctx.strokeStyle = background
    ctx.lineWidth = s.borderWidth
    ctx.stroke(borders)
  }
  if (!outline) {
    ctx.globalAlpha = 0.55
    ctx.fillStyle = background
    ctx.fill(pins)
  }
  ctx.globalAlpha = 1
}
