export type LayerId = "rain" | "cafe" | "noise"

export type LayerState = { on: boolean; volume: number }

/** Volume is 0–100 per layer. */
export type Layers = Record<LayerId, LayerState>

export type NoiseColour = "white" | "pink" | "brown"

/** Everything the audio engine needs besides the layers. All numbers are 0–100. */
export type MixSettings = {
  master: number
  noiseColour: NoiseColour
  rain: number
  busyness: number
  warmth: number
}

export type TimerOption = "off" | "15" | "30" | "60" | "90"

export type PresetId = "deep-focus" | "rainy-cafe" | "sleep"

export type Preset = {
  id: PresetId
  label: string
  layers: Layers
  settings: Omit<MixSettings, "master">
  timer: TimerOption
}
