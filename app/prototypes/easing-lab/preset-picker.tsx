"use client"

import { Button } from "@/components/ui/button"
import { sameBezier } from "./bezier"
import { PRESETS } from "./data"
import type { Bezier } from "./types"

export function PresetPicker({ bezier, onPick }: { bezier: Bezier; onPick: (b: Bezier) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span id="easing-lab-presets" className="text-sm leading-none font-medium">
        Presets
      </span>
      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="easing-lab-presets">
        {PRESETS.map((p) => {
          const active = sameBezier(p.value, bezier)
          return (
            <Button
              key={p.name}
              variant={active ? "secondary" : "outline"}
              aria-pressed={active}
              className="h-11 px-2 font-mono text-xs"
              onClick={() => onPick(p.value)}
            >
              {p.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
