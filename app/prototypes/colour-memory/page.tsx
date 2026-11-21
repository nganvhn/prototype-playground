import type { Metadata } from "next"
import meta from "./metadata.json"
import { ColourMemoryGame } from "./colour-memory-game"

export const metadata: Metadata = { title: meta.title, description: meta.description }

export default function ColourMemoryPage() {
  return <ColourMemoryGame />
}
