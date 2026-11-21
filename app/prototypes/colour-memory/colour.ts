import { DIFFICULTY_RANGES, SCORE_HALF_DELTA_E } from "./data"
import type { Difficulty, Hsl } from "./types"

/* ── Conversion: HSL → sRGB → linear → XYZ (D65) → CIELAB ─────────────── */

export function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const S = s / 100
  const L = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = S * Math.min(L, 1 - L)
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function hslToLab(hsl: Hsl): [number, number, number] {
  const [r, g, b] = hslToRgb(hsl).map(srgbToLinear)
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/* ── CIEDE2000 ─────────────────────────────────────────────────────────── */

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export function deltaE2000(lab1: [number, number, number], lab2: [number, number, number]) {
  const [L1, a1, b1] = lab1
  const [L2, a2, b2] = lab2

  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cbar7 = ((C1 + C2) / 2) ** 7
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)))
  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1)
  const C2p = Math.hypot(a2p, b2)
  const hue = (b: number, a: number) => {
    if (a === 0 && b === 0) return 0
    const h = deg(Math.atan2(b, a))
    return h < 0 ? h + 360 : h
  }
  const h1p = hue(b1, a1p)
  const h2p = hue(b2, a2p)

  const dLp = L2 - L1
  const dCp = C2p - C1p
  let dhp = 0
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2))

  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2
  let hbarp = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2
    else hbarp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63))
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2))
  const Cbarp7 = Cbarp ** 7
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 25 ** 7))
  const Sl = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2)
  const Sc = 1 + 0.045 * Cbarp
  const Sh = 1 + 0.015 * Cbarp * T
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc

  const l = dLp / Sl
  const c = dCp / Sc
  const h = dHp / Sh
  return Math.sqrt(l * l + c * c + h * h + Rt * c * h)
}

/** ΔE00 between two HSL colours. */
export function colourDistance(a: Hsl, b: Hsl) {
  return deltaE2000(hslToLab(a), hslToLab(b))
}

/**
 * ΔE00 → 0–100. Smooth falloff: identical = 100, ΔE 5 = 80, ΔE 10 = 50, ΔE 20 = 20.
 * ΔE ≈ 2 is about the smallest difference most people can see side by side.
 */
export function scoreFromDeltaE(dE: number) {
  return Math.round(100 / (1 + (dE / SCORE_HALF_DELTA_E) ** 2))
}

/* ── Target generation ─────────────────────────────────────────────────── */

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const between = (rand: () => number, [lo, hi]: readonly [number, number]) =>
  Math.round(lo + rand() * (hi - lo))

export function generateTargets(count: number, difficulty: Difficulty, rand: () => number = Math.random): Hsl[] {
  const range = DIFFICULTY_RANGES[difficulty]
  const baseHue = rand() * 360
  const out: Hsl[] = []
  for (let i = 0; i < count; i++) {
    const offset = range.hueSpread >= 360 ? rand() * 360 : (rand() - 0.5) * range.hueSpread
    const h = Math.round((((baseHue + offset) % 360) + 360) % 360)
    out.push({ h, s: between(rand, range.s), l: between(rand, range.l) })
  }
  return out
}

export const toCss = ({ h, s, l }: Hsl) => `hsl(${h} ${s}% ${l}%)`
