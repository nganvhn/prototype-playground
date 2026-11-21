"use client"

import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { STORAGE_NAMESPACE, flowControls } from "./data"
import { FlowCanvas } from "./flow-canvas"

export function FlowPlayground() {
  const controls = useControls(STORAGE_NAMESPACE, flowControls)

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <h1 className="site-chrome mb-4 text-lg font-medium">Flow Field</h1>
      <FlowCanvas settings={controls.values} />
    </PlaygroundLayout>
  )
}
