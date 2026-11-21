import { SPLASH, STIR, WHIRL } from "./data"
import type { FlowField } from "./field"
import type { Stir, Whirlpool } from "./types"

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 0→1→0 strength of a whirlpool over its life. */
export const whirlEnvelope = (age: number) =>
  smoothstep(WHIRL.rampIn[0], WHIRL.rampIn[1], age) *
  (1 - smoothstep(WHIRL.fadeOut[0], WHIRL.fadeOut[1], age))

/** Calls fn(index, dx, dy) for every grid node within `radius` of (cx, cy). */
function forNodesNear(
  field: FlowField,
  cx: number,
  cy: number,
  radius: number,
  fn: (idx: number, dx: number, dy: number) => void
) {
  const { cell, cols, rows } = field
  const i0 = Math.max(0, Math.floor((cx - radius) / cell))
  const i1 = Math.min(cols - 1, Math.ceil((cx + radius) / cell))
  const j0 = Math.max(0, Math.floor((cy - radius) / cell))
  const j1 = Math.min(rows - 1, Math.ceil((cy + radius) / cell))
  const r2 = radius * radius
  for (let j = j0; j <= j1; j++) {
    const dy = j * cell - cy
    for (let i = i0; i <= i1; i++) {
      const dx = i * cell - cx
      if (dx * dx + dy * dy <= r2) fn(j * cols + i, dx, dy)
    }
  }
}

/** Short outward ring push, like a stone dropped in water. */
function applySplash(field: FlowField, w: Whirlpool, age: number) {
  if (age >= SPLASH.duration) return
  const S = field.short
  const p = age / SPLASH.duration
  const radius = SPLASH.radius * S
  const ring = radius * (0.15 + 0.85 * p)
  const width = 0.3 * radius
  const amp = SPLASH.strength * S * (1 - p) * (1 - p)
  forNodesNear(field, w.x, w.y, ring + 3 * width, (idx, dx, dy) => {
    const r = Math.hypot(dx, dy) || 1
    const g = Math.exp(-(((r - ring) / width) ** 2))
    field.vx[idx] += (dx / r) * amp * g
    field.vy[idx] += (dy / r) * amp * g
  })
}

/** Swirl with an open eye: tangential flow peaking mid-radius, outward push at the centre. */
function applyWhirl(field: FlowField, w: Whirlpool, age: number) {
  const env = whirlEnvelope(age)
  if (env <= 0.001) return
  const S = field.short
  const R = WHIRL.radius * S
  const peak = WHIRL.swirlPeak * R
  const eye = WHIRL.eye * R
  const vSwirl = WHIRL.swirl * S * w.dir
  const vEye = WHIRL.eyePush * S
  const vIn = WHIRL.inflow * S
  forNodesNear(field, w.x, w.y, R * 1.3, (idx, dx, dy) => {
    const r = Math.hypot(dx, dy) || 1
    const ux = dx / r
    const uy = dy / r
    const q = r / peak
    const e = r / eye
    const vt = vSwirl * q * Math.exp(0.5 * (1 - q * q))
    const vr = vEye * e * Math.exp(0.5 * (1 - e * e)) - vIn * Math.exp(-(((r - 0.75 * R) / (0.25 * R)) ** 2))
    // The swirl takes over from the background current near its centre.
    const damp = 1 - 0.65 * env * Math.exp(-((r / (0.8 * R)) ** 2))
    field.vx[idx] = field.vx[idx] * damp + env * (-uy * vt + ux * vr)
    field.vy[idx] = field.vy[idx] * damp + env * (ux * vt + uy * vr)
  })
}

/** Drag pushes water along the finger, fading out over STIR.life seconds. */
function applyStir(field: FlowField, s: Stir, age: number) {
  if (age >= STIR.life) return
  const fade = (1 - age / STIR.life) ** 2
  const radius = STIR.radius * field.short
  const k = s.weight * fade
  forNodesNear(field, s.x, s.y, radius * 2.5, (idx, dx, dy) => {
    const g = Math.exp(-(dx * dx + dy * dy) / (radius * radius)) * k
    field.vx[idx] += s.vx * g
    field.vy[idx] += s.vy * g
  })
}

/**
 * Adds every live disturbance to the field. `frozenAge` pins whirlpools at one
 * age (used for the reduced-motion still frame).
 */
export function applyDisturbances(
  field: FlowField,
  whirlpools: Whirlpool[],
  stirs: Stir[],
  clock: number,
  frozenAge?: number
) {
  for (const w of whirlpools) {
    const age = frozenAge ?? clock - w.t0
    if (frozenAge === undefined) applySplash(field, w, age)
    applyWhirl(field, w, age)
  }
  if (frozenAge === undefined) for (const s of stirs) applyStir(field, s, clock - s.t0)
}

/** Weight for a stir sample so a stroke's total push doesn't depend on sampling density. */
export const stirWeight = (distance: number, short: number) =>
  Math.min(1, distance / (STIR.radius * short * Math.sqrt(Math.PI))) * STIR.gain
