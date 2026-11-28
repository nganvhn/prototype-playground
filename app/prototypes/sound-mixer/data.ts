import { defineControls } from "@/components/controls"
import type { LayerId, Layers, Preset } from "./types"

export const STORAGE_NAMESPACE = "sound-mixer"
export const LAYERS_KEY = `playground:${STORAGE_NAMESPACE}:layers`

const band = (labels: string[]) => (v: number) =>
  labels[Math.min(labels.length - 1, Math.floor((v / 100) * labels.length))]

export const mixerControls = defineControls({
  master: {
    type: "number",
    label: "Master volume",
    min: 0,
    max: 100,
    step: 1,
    default: 80,
    format: (v) => `${v}%`,
  },
  noiseColour: {
    type: "select",
    label: "Noise colour",
    options: ["white", "pink", "brown"],
    default: "pink",
  },
  rain: {
    type: "number",
    label: "Rain intensity",
    min: 0,
    max: 100,
    step: 1,
    default: 45,
    format: band(["Drizzle", "Light", "Steady", "Heavy", "Downpour"]),
  },
  busyness: {
    type: "number",
    label: "Café busyness",
    min: 0,
    max: 100,
    step: 1,
    default: 40,
    format: band(["Quiet", "Calm", "Lively", "Busy"]),
  },
  warmth: {
    type: "number",
    label: "Warmth",
    min: 0,
    max: 100,
    step: 1,
    default: 30,
    format: band(["Bright", "Clear", "Warm", "Soft", "Muffled"]),
  },
  timer: {
    type: "select",
    label: "Auto-stop (min)",
    options: ["off", "15", "30", "60", "90"],
    default: "off",
  },
})

export const LAYER_ORDER: LayerId[] = ["rain", "cafe", "noise"]

export const LAYER_LABELS: Record<LayerId, string> = {
  rain: "Rain",
  cafe: "Café",
  noise: "Noise",
}

export const DEFAULT_LAYERS: Layers = {
  rain: { on: true, volume: 60 },
  cafe: { on: false, volume: 50 },
  noise: { on: false, volume: 40 },
}

export const PRESETS: Preset[] = [
  {
    id: "deep-focus",
    label: "Deep focus",
    layers: {
      rain: { on: true, volume: 30 },
      cafe: { on: false, volume: 40 },
      noise: { on: true, volume: 60 },
    },
    settings: { noiseColour: "brown", rain: 30, busyness: 30, warmth: 40 },
    timer: "off",
  },
  {
    id: "rainy-cafe",
    label: "Rainy café",
    layers: {
      rain: { on: true, volume: 55 },
      cafe: { on: true, volume: 65 },
      noise: { on: false, volume: 30 },
    },
    settings: { noiseColour: "pink", rain: 55, busyness: 50, warmth: 25 },
    timer: "off",
  },
  {
    id: "sleep",
    label: "Sleep",
    layers: {
      rain: { on: true, volume: 50 },
      cafe: { on: false, volume: 30 },
      noise: { on: true, volume: 40 },
    },
    settings: { noiseColour: "brown", rain: 35, busyness: 20, warmth: 75 },
    timer: "60",
  },
]

/** Audio timing, in seconds. */
export const FADE = {
  /** setTargetAtTime time constants (~3× is the audible length). */
  param: 0.08,
  layer: 0.2,
  playIn: 0.3,
  pauseOut: 0.12,
  /** Wait this long after a pause fade before suspending the context. */
  suspendDelay: 0.7,
  /** Auto-stop fade length. */
  timerOut: 10,
} as const

/** How far ahead (s) the scheduler queues droplets, syllables and clinks. */
export const LOOKAHEAD = 2
export const SCHEDULER_INTERVAL_MS = 250
export const NOISE_SECONDS = 8
export const CAFE_VOICES = 7
