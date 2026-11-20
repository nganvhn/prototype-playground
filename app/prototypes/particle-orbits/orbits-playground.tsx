"use client"

import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { STORAGE_NAMESPACE, orbitControls } from "./data"
import { OrbitCanvas } from "./orbit-canvas"

export function OrbitsPlayground() {
  const controls = useControls(STORAGE_NAMESPACE, orbitControls)

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="site-chrome mb-4 text-lg font-medium">Particle Orbits</h1>
        <OrbitCanvas settings={controls.values} />
      </div>
    </PlaygroundLayout>
  )
}
