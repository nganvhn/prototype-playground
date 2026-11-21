"use client"

import { useState } from "react"
import { PlayIcon, SquareIcon } from "lucide-react"
import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { Button } from "@/components/ui/button"
import { CurveGraph } from "./curve-graph"
import { CurveReadout } from "./curve-readout"
import { DEFAULT_BEZIER, STORAGE_NAMESPACE, labControls } from "./data"
import { DemoStage } from "./demo-stage"
import { PresetPicker } from "./preset-picker"
import type { Bezier } from "./types"
import { usePlayback } from "./use-playback"
import { useReducedMotion } from "./use-reduced-motion"

export function EasingLab() {
  const controls = useControls(STORAGE_NAMESPACE, labControls)
  const { duration, loop, demo } = controls.values
  const [bezier, setBezier] = useState<Bezier>(DEFAULT_BEZIER)
  const reduced = useReducedMotion()
  const { run, playing, play, stop } = usePlayback(bezier, duration, loop)
  const looping = playing && loop

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="site-chrome text-lg font-medium">Easing Lab</h1>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <CurveGraph bezier={bezier} onChange={setBezier} run={run} playing={playing} reduced={reduced} />
            <CurveReadout bezier={bezier} />
          </div>
          <div className="flex flex-col gap-6">
            <DemoStage demo={demo} run={run} reduced={reduced} />
            <PresetPicker bezier={bezier} onPick={setBezier} />
          </div>
        </div>

        {/* Sticky at the bottom on small screens so Play stays under the thumb. */}
        <div className="sticky bottom-0 -mx-4 bg-background/90 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] pr-20 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <Button className="h-12 w-full text-base" onClick={looping ? stop : play}>
            {looping ? <SquareIcon /> : <PlayIcon />}
            {looping ? "Stop" : "Play"}
          </Button>
        </div>
      </div>
    </PlaygroundLayout>
  )
}
