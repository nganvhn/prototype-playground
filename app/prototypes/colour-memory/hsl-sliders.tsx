"use client"

import { useId } from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toCss } from "./colour"
import type { Hsl } from "./types"

/**
 * Restyles the shared Slider for thumbs: a tall track that shows the colour gradient
 * (drawn on a wrapper behind it) and a large ring thumb.
 */
const bigSlider =
  "py-1 [&_[data-slot=slider-track]]:h-10 [&_[data-slot=slider-track]]:bg-transparent " +
  "[&_[data-slot=slider-range]]:bg-transparent " +
  "[&_[data-slot=slider-thumb]]:size-9 [&_[data-slot=slider-thumb]]:border-[3px] " +
  "[&_[data-slot=slider-thumb]]:border-background [&_[data-slot=slider-thumb]]:bg-transparent " +
  "[&_[data-slot=slider-thumb]]:shadow-md [&_[data-slot=slider-thumb]]:ring-1 " +
  "[&_[data-slot=slider-thumb]]:ring-foreground/25"

function gradient(stops: Hsl[]) {
  return `linear-gradient(to right, ${stops.map(toCss).join(", ")})`
}

type Channel = { key: keyof Hsl; label: string; max: number; unit: string; stops: (c: Hsl) => Hsl[] }

const CHANNELS: Channel[] = [
  {
    key: "h",
    label: "Hue",
    max: 360,
    unit: "°",
    stops: (c) => [0, 60, 120, 180, 240, 300, 360].map((h) => ({ ...c, h })),
  },
  { key: "s", label: "Saturation", max: 100, unit: "%", stops: (c) => [0, 100].map((s) => ({ ...c, s })) },
  {
    key: "l",
    label: "Lightness",
    max: 100,
    unit: "%",
    stops: (c) => [0, 50, 100].map((l) => ({ ...c, l })),
  },
]

export function HslSliders({
  value,
  onChange,
  disabled,
}: {
  value: Hsl
  onChange: (next: Hsl) => void
  disabled: boolean
}) {
  const uid = useId()
  return (
    <div className="flex flex-col gap-4">
      {CHANNELS.map((ch) => {
        const id = `${uid}-${ch.key}`
        return (
          <div key={ch.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={id}>{ch.label}</Label>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {value[ch.key]}
                {ch.unit}
              </span>
            </div>
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-x-0 top-1 h-10 rounded-full border border-border transition-opacity data-[disabled=true]:opacity-50"
                data-disabled={disabled}
                style={{ background: gradient(ch.stops(value)) }}
              />
              <Slider
                id={id}
                aria-label={ch.label}
                min={0}
                max={ch.max}
                step={1}
                value={[value[ch.key]]}
                onValueChange={([x]) => onChange({ ...value, [ch.key]: x })}
                disabled={disabled}
                className={bigSlider}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
