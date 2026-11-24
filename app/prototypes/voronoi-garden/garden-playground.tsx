"use client"

import { useState } from "react"
import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { Button } from "@/components/ui/button"
import { SLUG, gardenControls } from "./data"
import { GardenCanvas } from "./garden-canvas"

export function GardenPlayground() {
  const controls = useControls(SLUG, gardenControls)
  const [clearToken, setClearToken] = useState(0)

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="site-chrome mb-4 text-lg font-medium">Voronoi Garden</h1>
        <GardenCanvas settings={controls.values} clearToken={clearToken} />
        <div className="site-chrome mt-4">
          <Button variant="outline" className="h-11 px-5" onClick={() => setClearToken((n) => n + 1)}>
            Clear
          </Button>
        </div>
      </div>
    </PlaygroundLayout>
  )
}
