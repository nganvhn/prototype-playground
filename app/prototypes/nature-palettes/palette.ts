import { COMBINATIONS, RECENT_WINDOW } from "./data"
import type { Colour, Combination, Family, Pick } from "./types"

/** How many of the wanted families appear in a combination. */
export function familyMatches(combination: Combination, families: readonly Family[]) {
  const present = new Set(combination.colours.map((c) => c.family))
  return families.filter((f) => present.has(f)).length
}

/**
 * Candidates for the current settings. Combinations must have exactly `count`
 * colours. With filters, only those containing every family are returned; if
 * none do, the closest matches (most families, at least one) are returned instead.
 */
export function candidates(
  count: number,
  families: readonly Family[],
  all: readonly Combination[] = COMBINATIONS
): { pool: Combination[]; exact: boolean } {
  const sized = all.filter((c) => c.colours.length === count)
  if (families.length === 0) return { pool: sized, exact: true }
  const scored = sized.map((c) => ({ c, n: familyMatches(c, families) }))
  const best = Math.max(0, ...scored.map((s) => s.n))
  if (best === 0) return { pool: [], exact: false }
  return { pool: scored.filter((s) => s.n === best).map((s) => s.c), exact: best === families.length }
}

/** Picks a random candidate, avoiding recently shown ids when possible. Null if nothing fits. */
export function pickCombination(
  count: number,
  families: readonly Family[],
  recentIds: readonly string[],
  rand: () => number = Math.random
): Pick | null {
  const { pool, exact } = candidates(count, families)
  if (pool.length === 0) return null
  const recent = new Set(recentIds.slice(-RECENT_WINDOW))
  // Never repeat the one on screen; prefer ones not seen lately.
  const last = recentIds[recentIds.length - 1]
  const fresh = pool.filter((c) => !recent.has(c.id))
  const notLast = pool.filter((c) => c.id !== last)
  const from = fresh.length ? fresh : notLast.length ? notLast : pool
  return { combination: from[Math.floor(rand() * from.length)], exact }
}

export function byId(id: string) {
  return COMBINATIONS.find((c) => c.id === id)
}

function channel(v: number) {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance of a #RRGGBB colour. */
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

/** Black or white, whichever has the higher contrast ratio against the swatch. */
export function readableText(hex: string) {
  const l = luminance(hex)
  const onBlack = (l + 0.05) / 0.05
  const onWhite = 1.05 / (l + 0.05)
  return onBlack >= onWhite ? "#000000" : "#FFFFFF"
}

export function paletteText(colours: readonly Colour[]) {
  return colours.map((c) => c.hex).join(", ")
}

/** Soft gradient of the palette, used while the photo loads or when there's no photo. */
export function paletteGradient(colours: readonly Colour[]) {
  const stops = colours.map((c, i) => `${c.hex} ${Math.round((i / Math.max(1, colours.length - 1)) * 100)}%`)
  return `linear-gradient(135deg, ${stops.join(", ")})`
}
