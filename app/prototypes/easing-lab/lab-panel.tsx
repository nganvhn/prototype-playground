"use client"

import { ControlPanel } from "@/components/controls"
import type { ControlsState } from "@/components/controls/use-controls"
import { ActionButtons } from "./action-buttons"
import { CssValue } from "./css-value"
import type { labControls } from "./data"
import { PresetPicker } from "./preset-picker"
import type { Bezier } from "./types"

/**
 * Desktop: the side panel, with Play/Copy and the CSS value first. Phone: flows below
 * the demos; Play/Copy live in the fixed bottom bar and the CSS value in the main column.
 */
export function LabPanel({
  controls,
  bezier,
  onBezier,
  looping,
  onPlay,
  onStop,
}: {
  controls: ControlsState<typeof labControls>
  bezier: Bezier
  onBezier: (b: Bezier) => void
  looping: boolean
  onPlay: () => void
  onStop: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="hidden flex-col gap-3 lg:flex">
        <ActionButtons bezier={bezier} looping={looping} onPlay={onPlay} onStop={onStop} />
        <CssValue bezier={bezier} />
      </div>
      <PresetPicker bezier={bezier} onPick={onBezier} />
      <ControlPanel controls={controls} />
    </div>
  )
}
