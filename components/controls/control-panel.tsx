"use client"

import { useId } from "react"
import { RotateCcwIcon, ShuffleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ControlsState } from "./use-controls"
import type { ControlSchema } from "./types"

export function ControlPanel<S extends ControlSchema>({ controls }: { controls: ControlsState<S> }) {
  const { schema, values, set, reset, randomize } = controls
  // The panel can be mounted twice (side panel + mobile sheet), so ids must be unique.
  const uid = useId()

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(schema).map(([key, c]) => {
        const id = `${uid}-${key}`
        const k = key as keyof S
        const v = values[k] as unknown

        if (c.type === "boolean") {
          return (
            <div key={key} className="flex min-h-11 items-center justify-between gap-4">
              <Label htmlFor={id}>{c.label}</Label>
              <Switch id={id} checked={v as boolean} onCheckedChange={(x) => set(k, x as never)} />
            </div>
          )
        }

        if (c.type === "select") {
          return (
            <div key={key} className="flex flex-col gap-2">
              <Label>{c.label}</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                value={v as string}
                onValueChange={(x) => x && set(k, x as never)}
                className="w-full"
              >
                {c.options.map((o) => (
                  <ToggleGroupItem key={o} value={o} className="h-11 flex-1 capitalize">
                    {o}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )
        }

        const isHue = c.type === "hue"
        const min = isHue ? 0 : c.min
        const max = isHue ? 360 : c.max
        const step = isHue ? 1 : (c.step ?? 1)
        return (
          <div key={key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={id}>{c.label}</Label>
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
                {isHue && (
                  <span
                    aria-hidden
                    className="size-3 rounded-full border border-border"
                    style={{ background: `oklch(0.7 0.15 ${v as number})` }}
                  />
                )}
                {!isHue && c.swatch && (
                  <span
                    aria-hidden
                    className="h-3 w-8 rounded-full border border-border"
                    style={{ background: c.swatch(values as Record<string, unknown>) }}
                  />
                )}
                {!isHue && c.format ? c.format(v as number) : (v as number)}
              </span>
            </div>
            <Slider
              id={id}
              min={min}
              max={max}
              step={step}
              value={[v as number]}
              onValueChange={([x]) => set(k, x as never)}
              className="py-3"
            />
          </div>
        )
      })}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="h-11 flex-1" onClick={reset}>
          <RotateCcwIcon />
          Reset
        </Button>
        <Button variant="secondary" className="h-11 flex-1" onClick={randomize}>
          <ShuffleIcon />
          Randomize
        </Button>
      </div>
    </div>
  )
}
