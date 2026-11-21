import { defineControls } from "@/components/controls"

export const STORAGE_NAMESPACE = "flow-field"

const swatchStops = (hue: number, spread: number) =>
  [0, 0.25, 0.5, 0.75, 1]
    .map((t) => `oklch(0.72 0.13 ${(hue + spread * (t - 0.5) + 360) % 360})`)
    .join(", ")

export const flowControls = defineControls({
  count: { type: "number", label: "Particles", min: 500, max: 8000, step: 100, default: 3000 },
  noiseScale: { type: "number", label: "Noise scale", min: 0.5, max: 4, step: 0.1, default: 1.4 },
  speed: { type: "number", label: "Speed", min: 0.2, max: 3, step: 0.1, default: 1 },
  trail: { type: "number", label: "Trail length", min: 1, max: 10, step: 1, default: 6 },
  hue: { type: "hue", label: "Hue", default: 200 },
  hueSpread: {
    type: "number",
    label: "Hue spread",
    min: 0,
    max: 180,
    step: 5,
    default: 70,
    swatch: (v) =>
      `linear-gradient(90deg, ${swatchStops(Number(v.hue ?? 200), Number(v.hueSpread ?? 0))})`,
  },
  lineWidth: { type: "number", label: "Line width", min: 0.5, max: 3, step: 0.25, default: 1 },
})

/** Particle cap and device-pixel-ratio cap on touch (phone/tablet) devices. */
export const TOUCH_MAX_PARTICLES = 3000
export const MAX_PARTICLES = 8000
export const DPR_CAP = { touch: 1.5, desktop: 2 } as const

/* ── Field ───────────────────────────────────────────── */
/** Grid cell size in CSS px (the field is sampled bilinearly between nodes). */
export const MIN_CELL = 12
export const CELLS_PER_SIDE = 50
/** Typical current speed as a fraction of the canvas' short side per second. */
export const BASE_SPEED = 0.035
/** Second, finer noise octave. */
export const OCTAVE2 = { freq: 2.3, amp: 0.35 } as const
/** How fast the noise field evolves (per second of flow time). */
export const FIELD_DRIFT = { z: 0.06, x: 0.012 } as const
/** Seconds for a particle to ease into the local current (inertia). */
export const INERTIA_TAU = 0.22
export const LIFE = { min: 4, max: 10 } as const

/* ── Colour ──────────────────────────────────────────── */
export const BAND_COUNT = 9
export const COLORS = {
  dark: { bg: { l: 0.2, c: 0.045 }, stroke: { l: 0.8, c: 0.12, a: 0.55 } },
  light: { bg: { l: 0.965, c: 0.022 }, stroke: { l: 0.52, c: 0.14, a: 0.5 } },
} as const

/* ── Trails ──────────────────────────────────────────── */
/** Trail half-life in seconds: slider 1 → 0.12 s, 10 → ~6 s. */
export const trailHalfLife = (trail: number) => 0.12 * Math.pow(1.55, trail - 1)
/**
 * Fades smaller than this are batched until they add up. On an 8-bit canvas a
 * fade of alpha `a` stalls 0.5/a levels away from the target, so tiny per-frame
 * fades leave grey ghost trails; batching keeps the residual to a few levels.
 */
export const MIN_FADE = 0.1

/* ── Disturbances (sizes are fractions of the short side S) ─ */
export const WHIRL = {
  /** Whirlpool radius. */
  radius: 0.34,
  /** Peak swirl speed (S per second) and where it peaks (fraction of radius). */
  swirl: 0.24,
  swirlPeak: 0.38,
  /** Open eye: outward push near the centre. */
  eye: 0.16,
  eyePush: 0.07,
  /** Gentle inward drift in the outer ring. */
  inflow: 0.025,
  /** Envelope (s): ramp in, hold, fade out, gone. */
  rampIn: [0.25, 1.0],
  fadeOut: [3.5, 5.5],
  life: 5.5,
  max: 5,
} as const

export const SPLASH = { duration: 0.7, radius: 0.2, strength: 0.9 } as const

export const STIR = {
  life: 2.5,
  radius: 0.09,
  gain: 0.9,
  /** Max drag speed counted, in S per second. */
  maxSpeed: 2.5,
  max: 90,
  /** Pointer travel (px) before a press counts as a drag rather than a tap. */
  tapSlop: 8,
  /** Min pointer travel (px) between stir samples. */
  sampleStep: 4,
} as const

/** Steps drawn instantly on start so the first frame (and thumbnail) is already silky. */
export const WARMUP_STEPS = 50
/** Steps simulated for the reduced-motion still frame. */
export const STILL_STEPS = 200
/** Whirlpool age shown in the still frame (full strength). */
export const STILL_WHIRL_AGE = 2
