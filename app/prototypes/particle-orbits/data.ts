import { defineControls } from "@/components/controls"

export const STORAGE_NAMESPACE = "particle-orbits"

export const orbitControls = defineControls({
  count: { type: "number", label: "Particles", min: 50, max: 1500, step: 50, default: 600 },
  speed: { type: "number", label: "Speed", min: 0.1, max: 3, step: 0.1, default: 1 },
  size: { type: "number", label: "Size", min: 0.5, max: 4, step: 0.5, default: 1.5 },
  hue: { type: "hue", label: "Hue", default: 250 },
  layout: { type: "select", label: "Layout", options: ["disc", "rings", "spiral"], default: "disc" },
  trails: { type: "boolean", label: "Trails", default: true },
})

/** Base angular velocity in radians/second at radius 1. */
export const BASE_ANGULAR_SPEED = 0.6
export const RING_COUNT = 5
export const SPIRAL_ARMS = 3
/** Lightness for particle colour per theme (oklch L). */
export const PARTICLE_LIGHTNESS = { dark: 0.78, light: 0.55 } as const
