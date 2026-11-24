import type { ControlValues } from "@/components/controls"
import type { gardenControls } from "./data"

export type GardenSettings = ControlValues<typeof gardenControls>
export type CellStyle = GardenSettings["style"]

export type SeedPhase = "growing" | "alive" | "dying"

export type Seed = {
  id: number
  /** Resting position, normalised 0..1. */
  x: number
  y: number
  /** 0..1 position in the hue range; drifts with recolour speed. */
  hueSeed: number
  /** Signed recolour rate multiplier. */
  rate: number
  /** Lightness jitter in oklch L units. */
  tone: number
  /** Breathing phases and frequency multipliers. */
  phaseX: number
  phaseY: number
  freqX: number
  freqY: number
  phase: SeedPhase
  /** Linear 0..1 animation progress, eased before use. */
  life: number
}

/** A seed as drawn this frame. */
export type Site = {
  seed: Seed
  /** Displayed position (resting + breathing), normalised. */
  px: number
  py: number
  /** Eased size 0..1. */
  scale: number
}

/** A cell polygon in normalised coords: [x0, y0, x1, y1, ...]. */
export type Cell = { site: Site; poly: number[] }

/** What we persist per seed. */
export type StoredSeed = { x: number; y: number; h: number }
