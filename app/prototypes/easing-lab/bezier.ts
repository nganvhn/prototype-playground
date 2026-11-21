import { GRAPH } from "./data"
import type { Bezier } from "./types"

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const round2 = (v: number) => Math.round(v * 100) / 100

/** Shortest decimal form, max two places: 0.10 → "0.1", 1.00 → "1", -0.50 → "-0.5". */
export function formatNumber(v: number): string {
  const r = round2(v)
  return Object.is(r, -0) ? "0" : String(r)
}

export function toCss(b: Bezier): string {
  return `cubic-bezier(${b.map(formatNumber).join(", ")})`
}

export const clampX = (x: number) => round2(clamp(x, 0, 1))
export const clampY = (y: number) => round2(clamp(y, GRAPH.yMin, GRAPH.yMax))

/** Keep a handle inside the allowed area: x 0–1 (CSS requirement), y within the graph. */
export function clampPoint(x: number, y: number): [number, number] {
  return [clampX(x), clampY(y)]
}

export function sameBezier(a: Bezier, b: Bezier): boolean {
  return a.every((v, i) => Math.abs(v - b[i]) < 0.005)
}

/** One coordinate of a cubic bezier from (0,0) to (1,1) with control values p1, p2. */
function axis(p1: number, p2: number, t: number): number {
  const u = 1 - t
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t
}

function axisSlope(p1: number, p2: number, t: number): number {
  const u = 1 - t
  return 3 * u * u * p1 + 6 * u * t * (p2 - p1) + 3 * t * t * (1 - p2)
}

/** Eased progress y for linear time x (0–1), as the browser would compute it. */
export function solveEasing(b: Bezier, x: number): number {
  const [x1, y1, x2, y2] = b
  if (x <= 0) return 0
  if (x >= 1) return 1
  // Newton–Raphson, falling back to bisection (x(t) is monotonic since x1, x2 ∈ [0, 1]).
  let t = x
  for (let i = 0; i < 8; i++) {
    const err = axis(x1, x2, t) - x
    if (Math.abs(err) < 1e-6) return axis(y1, y2, t)
    const d = axisSlope(x1, x2, t)
    if (Math.abs(d) < 1e-6) break
    t -= err / d
  }
  let lo = 0
  let hi = 1
  t = x
  for (let i = 0; i < 40; i++) {
    const v = axis(x1, x2, t)
    if (Math.abs(v - x) < 1e-6) break
    if (v < x) lo = t
    else hi = t
    t = (lo + hi) / 2
  }
  return axis(y1, y2, t)
}
