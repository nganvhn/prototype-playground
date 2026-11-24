import { defineControls } from "@/components/controls"

export const SLUG = "voronoi-garden"
export const GARDEN_STORAGE_KEY = `playground:${SLUG}:garden`

export const gardenControls = defineControls({
  breathing: { type: "number", label: "Breathing", min: 0, max: 1, step: 0.05, default: 0.35 },
  breathSpeed: { type: "number", label: "Breathing speed", min: 0.1, max: 2, step: 0.1, default: 0.6 },
  hue: { type: "hue", label: "Hue", default: 160 },
  hueSpread: { type: "number", label: "Hue spread", min: 0, max: 360, step: 5, default: 90 },
  recolourSpeed: { type: "number", label: "Recolour speed", min: 0, max: 1, step: 0.05, default: 0.3 },
  borderWidth: { type: "number", label: "Border width", min: 0, max: 8, step: 0.5, default: 2 },
  style: { type: "select", label: "Cell style", options: ["flat", "gradient", "outline"], default: "gradient" },
  maxSeeds: { type: "number", label: "Max seeds", min: 20, max: 300, step: 10, default: 120 },
})

/** Seconds for a cell to grow in or shrink away. */
export const GROW_SECONDS = 0.9
export const SHRINK_SECONDS = 0.7
/** Long-press duration (ms) that removes a cell. */
export const LONG_PRESS_MS = 500
/** Pointer travel (CSS px) that turns a press into a drag. */
export const DRAG_THRESHOLD_PX = 8
/** How close (CSS px) to a seed a press must land to grab it. */
export const GRAB_RADIUS_PX = 26
/** Minimum spacing (normalised) between a new seed and an existing one. */
export const MIN_SEED_GAP = 0.006
/** Breathing drift frequency in Hz at speed 1. */
export const BREATH_HZ = 0.25
/** Recolour drift in cycles/second at speed 1. */
export const RECOLOUR_CPS = 0.04
export const INITIAL_SEED_COUNT = 14
/** Garden geometry is computed every frame up to this many seeds with all-pairs clipping. */
export const BRUTE_FORCE_LIMIT = 40

/** oklch lightness / chroma per theme. */
export const CELL_TONE = {
  dark: { l: 0.64, c: 0.13 },
  light: { l: 0.78, c: 0.11 },
} as const
