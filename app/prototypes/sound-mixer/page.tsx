import type { Metadata } from "next"
import meta from "./metadata.json"
import { MixerPlayground } from "./mixer-playground"

export const metadata: Metadata = { title: meta.title, description: meta.description }

export default function SoundMixerPage() {
  return <MixerPlayground />
}
