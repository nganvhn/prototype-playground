import type { ControlValues } from "@/components/controls"
import type { orbitControls } from "./data"

export type OrbitSettings = ControlValues<typeof orbitControls>
export type Layout = OrbitSettings["layout"]

export type Particle = {
  /** Orbit radius, 0..1 of the canvas half-size. */
  radius: number
  /** Current angle in radians. */
  angle: number
  /** Per-particle hue offset in degrees, for subtle variation. */
  hueOffset: number
}
