import { defineControls } from "@/components/controls"
import type { Hsl } from "./types"

export const STORAGE_NAMESPACE = "colour-memory"
export const BEST_SCORES_KEY = `playground:${STORAGE_NAMESPACE}:best`

export const gameControls = defineControls({
  displayTime: { type: "number", label: "Display time (s)", min: 0.5, max: 5, step: 0.5, default: 2 },
  colours: { type: "number", label: "Colours per round", min: 3, max: 10, step: 1, default: 5 },
  difficulty: { type: "select", label: "Difficulty", options: ["easy", "hard"], default: "easy" },
})

/** Where the sliders start every turn: a neutral mid-tone, so no hue gets a head start. */
export const START_GUESS: Hsl = { h: 180, s: 50, l: 50 }

/** Blank pause before each colour appears, so the eye is ready. */
export const PREPARE_MS = 450

/** ΔE00 at which a guess scores 50. Lower = stricter. */
export const SCORE_HALF_DELTA_E = 10

export const SCORE_COUNT_MS = 900
export const REVEAL_SPLIT_MS = 550

/** Target ranges per difficulty. */
export const DIFFICULTY_RANGES = {
  easy: { s: [65, 100], l: [40, 65], hueSpread: 360 },
  /** Muted, and every hue in a round sits within ±hueSpread/2 of one base hue. */
  hard: { s: [10, 40], l: [30, 72], hueSpread: 60 },
} as const

/** Fixed seed for the idle preview stripes, so server and client render the same colours. */
export const PREVIEW_SEED = 7
