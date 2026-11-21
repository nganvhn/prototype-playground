import type { ControlValues } from "@/components/controls"
import type { flowControls } from "./data"

export type FlowSettings = ControlValues<typeof flowControls>

export type RGB = [number, number, number]

export type Palette = {
  background: RGB
  /** CSS colour for the solid background fill. */
  backgroundCss: string
  /** One translucent stroke colour per hue band. */
  bands: string[]
}

/** A tap: an outward splash followed by a whirlpool. Times are on the engine clock (s). */
export type Whirlpool = { x: number; y: number; t0: number; dir: 1 | -1 }

/** One sampled step of a drag; the push fades out over STIR_LIFE seconds. */
export type Stir = { x: number; y: number; vx: number; vy: number; weight: number; t0: number }

/** Particles as parallel typed arrays (structure of arrays) for speed. */
export type Particles = {
  count: number
  x: Float32Array
  y: Float32Array
  /** Previous position; a segment is drawn from (px,py) to (x,y) each frame. */
  px: Float32Array
  py: Float32Array
  vx: Float32Array
  vy: Float32Array
  age: Float32Array
  life: Float32Array
  band: Uint8Array
  /** 1 when the particle just respawned and shouldn't draw this frame. */
  skip: Uint8Array
}
