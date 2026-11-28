"use client"

import { useId } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { LayerState } from "./types"

/** One mixer channel: name, on/off and a big thumb-friendly volume slider. */
export function LayerCard({
  label,
  state,
  onChange,
}: {
  label: string
  state: LayerState
  onChange: (patch: Partial<LayerState>) => void
}) {
  const id = useId()

  return (
    <section className="rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`${id}-volume`} className="text-base font-medium">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "w-8 text-right font-mono text-sm tabular-nums transition-colors duration-200 ease-out",
              state.on ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {state.volume}
          </span>
          {/* Label wrapper gives the small switch a 44px tap target. */}
          <label htmlFor={`${id}-on`} className="flex size-11 cursor-pointer items-center justify-center">
            <Switch
              id={`${id}-on`}
              checked={state.on}
              onCheckedChange={(on) => onChange({ on })}
              aria-label={`${label} on`}
            />
          </label>
        </div>
      </div>
      <Slider
        id={`${id}-volume`}
        min={0}
        max={100}
        step={1}
        value={[state.volume]}
        // Dragging a muted layer's slider turns it on.
        onValueChange={([volume]) => onChange(state.on ? { volume } : { volume, on: volume > 0 })}
        aria-label={`${label} volume`}
        className={cn(
          "py-4 transition-opacity duration-200 ease-out",
          "[&_[data-slot=slider-track]]:h-3! [&_[data-slot=slider-thumb]]:size-7!",
          !state.on && "opacity-50"
        )}
      />
    </section>
  )
}
