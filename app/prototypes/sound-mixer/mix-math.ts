import { mixerControls, PRESETS } from "./data"
import type { LayerId, Layers, PresetId, TimerOption } from "./types"
import type { ControlValues } from "@/components/controls"

export type MixerValues = ControlValues<typeof mixerControls>

/** Slider 0–100 → linear gain with a perceptual (squared) curve. */
export function volumeToGain(v: number) {
  const x = Math.min(1, Math.max(0, v / 100))
  return x * x
}

/** Warmth 0–100 → low-pass cutoff in Hz, exponential from bright to muffled. */
export function warmthToCutoff(w: number) {
  const x = Math.min(1, Math.max(0, w / 100))
  return 18000 * Math.pow(450 / 18000, x)
}

/** Rain intensity 0–100 → synthesis parameters. */
export function rainParams(intensity: number) {
  const i = Math.min(1, Math.max(0, intensity / 100))
  return {
    dropsPerSecond: 4 + 70 * Math.pow(i, 1.6),
    dropGain: 0.9 * (1 - 0.4 * i),
    plinkChance: 0.12 * (1 - 0.6 * i),
    bedGain: 0.3 + 0.4 * i,
    bedCutoff: 2200 + 6500 * i,
    rumbleGain: 0.08 + 0.45 * i * i,
  }
}

/** Café busyness 0–100 → synthesis parameters. */
export function cafeParams(busyness: number, voices: number) {
  const b = Math.min(1, Math.max(0, busyness / 100))
  return {
    activeVoices: Math.max(2, Math.round(2 + b * (voices - 2))),
    /** Pause between utterances, seconds. */
    pauseMin: 0.4 + 1.6 * (1 - b),
    pauseMax: 2 + 5 * (1 - b),
    clinksPerSecond: 0.08 + 0.55 * b,
    bedGain: 0.25 + 0.35 * b,
  }
}

export function timerMinutes(t: TimerOption): number | null {
  return t === "off" ? null : Number(t)
}

export function formatRemaining(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

/** The preset the current mix matches exactly, if any. Master volume is ignored. */
export function matchingPreset(layers: Layers, v: MixerValues): PresetId | null {
  const ids = Object.keys(layers) as LayerId[]
  const hit = PRESETS.find(
    (p) =>
      ids.every((id) => p.layers[id].on === layers[id].on && p.layers[id].volume === layers[id].volume) &&
      p.settings.noiseColour === v.noiseColour &&
      p.settings.rain === v.rain &&
      p.settings.busyness === v.busyness &&
      p.settings.warmth === v.warmth &&
      p.timer === v.timer
  )
  return hit?.id ?? null
}

/** Validates stored layer state; anything unexpected falls back to the default for that layer. */
export function sanitizeLayers(raw: unknown, fallback: Layers): Layers {
  const out: Layers = structuredClone(fallback)
  if (!raw || typeof raw !== "object") return out
  for (const id of Object.keys(fallback) as LayerId[]) {
    const l = (raw as Record<string, unknown>)[id]
    if (!l || typeof l !== "object") continue
    const { on, volume } = l as Record<string, unknown>
    if (typeof on === "boolean") out[id].on = on
    if (typeof volume === "number" && volume >= 0 && volume <= 100) out[id].volume = Math.round(volume)
  }
  return out
}
