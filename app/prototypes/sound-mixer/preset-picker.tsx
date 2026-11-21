"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PRESETS } from "./data"
import type { Preset, PresetId } from "./types"

export function PresetPicker({
  active,
  onPick,
}: {
  active: PresetId | null
  onPick: (preset: Preset) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={active ?? ""}
      onValueChange={(id) => {
        const preset = PRESETS.find((p) => p.id === id)
        if (preset) onPick(preset)
      }}
      className="w-full"
      aria-label="Presets"
    >
      {PRESETS.map((p) => (
        <ToggleGroupItem key={p.id} value={p.id} className="h-11 flex-1 px-2 text-sm">
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
