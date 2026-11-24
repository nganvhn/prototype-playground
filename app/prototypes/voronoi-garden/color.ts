import { CELL_TONE, RECOLOUR_CPS } from "./data"
import type { Seed } from "./types"

export type Tone = { l: number; c: number }

/** Triangle wave in [−0.5, 0.5]: spreads hues evenly, unlike a sine. */
function tri(phase: number) {
  const f = phase - Math.floor(phase)
  return f < 0.5 ? f * 2 - 0.5 : 1.5 - f * 2
}

export function seedHue(seed: Seed, t: number, hue: number, spread: number, recolourSpeed: number) {
  const offset = tri(seed.hueSeed + t * recolourSpeed * RECOLOUR_CPS * seed.rate)
  return (((hue + spread * offset) % 360) + 360) % 360
}

export function toneFor(theme: string | undefined): Tone {
  return CELL_TONE[theme === "light" ? "light" : "dark"]
}

export const oklch = (l: number, c: number, h: number) =>
  `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
