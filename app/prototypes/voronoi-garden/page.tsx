import type { Metadata } from "next"
import { GardenPlayground } from "./garden-playground"
import meta from "./metadata.json"

export const metadata: Metadata = { title: meta.title, description: meta.description }

export default function VoronoiGardenPage() {
  return <GardenPlayground />
}
