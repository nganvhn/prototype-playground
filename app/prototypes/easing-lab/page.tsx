import type { Metadata } from "next"
import meta from "./metadata.json"
import { EasingLab } from "./easing-lab"

export const metadata: Metadata = { title: meta.title, description: meta.description }

export default function EasingLabPage() {
  return <EasingLab />
}
