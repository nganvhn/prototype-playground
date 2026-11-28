import type { Metadata } from "next"
import meta from "./metadata.json"
import { PalettesPlayground } from "./palettes-playground"

export const metadata: Metadata = { title: meta.title, description: meta.description }

export default function NaturePalettesPage() {
  return <PalettesPlayground />
}
