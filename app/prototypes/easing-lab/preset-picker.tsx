"use client"

import { Button } from "@/components/ui/button"
import { sameBezier } from "./bezier"
import { PRESETS } from "./data"
import type { Bezier } from "./types"

export function PresetPicker({ bezier, onPick }: { bezier: Bezier; onPick: (b: Bezier) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Presets">
      {PRESETS.map((p) => {
        const active = sameBezier(p.value, bezier)
        return (
          <Button
            key={p.name}
            variant={active ? "secondary" : "outline"}
            aria-pressed={active}
            className="h-11 px-3 font-mono text-xs"
            onClick={() => onPick(p.value)}
          >
            {p.name}
          </Button>
        )
      })}
    </div>
  )
}
