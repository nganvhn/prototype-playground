import type { ControlValues } from "@/components/controls/types"
import type { FAMILIES, CATEGORIES, paletteControls } from "./data"

export type Family = (typeof FAMILIES)[number]
export type Category = (typeof CATEGORIES)[number]
export type PaletteSettings = ControlValues<typeof paletteControls>
export type SwatchLayout = PaletteSettings["layout"]

export type Colour = { hex: string; name: string; family: Family }

export type Combination = {
  id: string
  /** Display name, e.g. "Ocean at night". */
  name: string
  /** What the colours come from, one short line. */
  source: string
  category: Category
  colours: Colour[]
  /** Unsplash search query for the reference photo. */
  query: string
}

/** Result of picking a combination; `exact` is false when no combination matched every filter. */
export type Pick = { combination: Combination; exact: boolean }

/** Shape returned by /api/nature-palettes/photo. */
export type Photo = {
  id: string
  src: string
  alt: string
  author: { name: string; url: string }
  unsplashUrl: string
}
