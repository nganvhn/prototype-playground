"use client"

import { useCallback, useMemo } from "react"
import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { LAYER_LABELS, LAYER_ORDER, STORAGE_NAMESPACE, mixerControls } from "./data"
import { LayerCard } from "./layer-card"
import { matchingPreset, timerMinutes } from "./mix-math"
import { PlayButton } from "./play-button"
import { PresetPicker } from "./preset-picker"
import type { MixSettings, Preset } from "./types"
import { useLayers } from "./use-layers"
import { useMixEngine } from "./use-mix-engine"

const NOISE_LABEL = { white: "White noise", pink: "Pink noise", brown: "Brown noise" } as const

export function MixerPlayground() {
  const controls = useControls(STORAGE_NAMESPACE, mixerControls)
  const { layers, setLayers, update } = useLayers()
  const v = controls.values
  const { set } = controls

  const settings: MixSettings = useMemo(
    () => ({
      master: v.master,
      noiseColour: v.noiseColour,
      rain: v.rain,
      busyness: v.busyness,
      warmth: v.warmth,
    }),
    [v.master, v.noiseColour, v.rain, v.busyness, v.warmth]
  )
  const { playing, remaining, toggle } = useMixEngine(layers, settings, timerMinutes(v.timer))

  const applyPreset = useCallback(
    (p: Preset) => {
      setLayers(structuredClone(p.layers))
      set("noiseColour", p.settings.noiseColour)
      set("rain", p.settings.rain)
      set("busyness", p.settings.busyness)
      set("warmth", p.settings.warmth)
      set("timer", p.timer)
    },
    [setLayers, set]
  )

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-20 lg:pb-0">
        <h1 className="site-chrome text-lg font-medium">Sound Mixer</h1>
        <div className="py-2">
          <PlayButton playing={playing} remaining={remaining} onToggle={toggle} />
        </div>
        <PresetPicker active={matchingPreset(layers, v)} onPick={applyPreset} />
        <div className="flex flex-col gap-3">
          {LAYER_ORDER.map((id) => (
            <LayerCard
              key={id}
              label={id === "noise" ? NOISE_LABEL[v.noiseColour] : LAYER_LABELS[id]}
              state={layers[id]}
              onChange={(patch) => update(id, patch)}
            />
          ))}
        </div>
      </div>
    </PlaygroundLayout>
  )
}
