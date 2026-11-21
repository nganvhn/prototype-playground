"use client"

import { useState } from "react"
import { PlaygroundLayout, useControls } from "@/components/controls"
import { ActionButtons } from "./action-buttons"
import { CssValue } from "./css-value"
import { CurveGraph } from "./curve-graph"
import { DEFAULT_BEZIER, STORAGE_NAMESPACE, labControls } from "./data"
import { DemoStage } from "./demo-stage"
import { LabPanel } from "./lab-panel"
import type { Bezier } from "./types"
import { useReducedMotion } from "./use-media-query"
import { usePlayback } from "./use-playback"
import { ValueFields } from "./value-fields"

export function EasingLab() {
  const controls = useControls(STORAGE_NAMESPACE, labControls)
  const { duration, loop, demo } = controls.values
  const [bezier, setBezier] = useState<Bezier>(DEFAULT_BEZIER)
  const reduced = useReducedMotion()
  const { run, playing, play, stop } = usePlayback(bezier, duration, loop)
  const looping = playing && loop
  const actions = { bezier, looping, onPlay: play, onStop: stop }

  return (
    <>
      <PlaygroundLayout
        mobilePanel="inline"
        panel={<LabPanel controls={controls} onBezier={setBezier} {...actions} />}
      >
        <h1 className="sr-only">Easing Lab</h1>
        <div className="flex flex-col gap-3 lg:gap-4">
          <CurveGraph bezier={bezier} onChange={setBezier} run={run} playing={playing} reduced={reduced} />
          <div className="mx-auto w-full max-w-md">
            <ValueFields bezier={bezier} onChange={setBezier} />
          </div>
          <DemoStage demo={demo} run={run} reduced={reduced} />
          <div className="lg:hidden">
            <CssValue bezier={bezier} />
          </div>
        </div>
      </PlaygroundLayout>

      {/* Phone: Play + Copy stay put under the thumb. Spacer keeps content clear of it. */}
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto max-w-md">
          <ActionButtons {...actions} />
        </div>
      </div>
    </>
  )
}
