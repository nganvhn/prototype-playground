import type { Metadata } from "next"
import meta from "./metadata.json"
import { FlowPlayground } from "./flow-playground"

export const metadata: Metadata = { title: meta.title, description: meta.description }

export default function FlowFieldPage() {
  return <FlowPlayground />
}
