import { defineControls } from "@/components/controls"
import type { Bezier, DemoKind, Preset } from "./types"

export const STORAGE_NAMESPACE = "easing-lab"

export const labControls = defineControls({
  duration: { type: "number", label: "Duration (ms)", min: 100, max: 2000, step: 50, default: 600 },
  loop: { type: "boolean", label: "Loop", default: false },
  demo: { type: "select", label: "Demo", options: ["card", "modal", "toast", "all"], default: "all" },
})

export const PRESETS: readonly Preset[] = [
  { name: "ease", value: [0.25, 0.1, 0.25, 1] },
  { name: "linear", value: [0, 0, 1, 1] },
  { name: "ease-in", value: [0.42, 0, 1, 1] },
  { name: "ease-out", value: [0, 0, 0.58, 1] },
  { name: "ease-in-out", value: [0.42, 0, 0.58, 1] },
  { name: "expo out", value: [0.16, 1, 0.3, 1] },
  { name: "overshoot", value: [0.34, 1.5, 0.64, 1] },
  { name: "anticipate", value: [0.36, 0, 0.66, -0.5] },
  { name: "swing", value: [0.68, -0.5, 0.32, 1.5] },
]

export const DEFAULT_BEZIER: Bezier = [0.34, 1.5, 0.64, 1]

export const DEMOS: readonly { kind: DemoKind; label: string }[] = [
  { kind: "card", label: "Card" },
  { kind: "modal", label: "Modal" },
  { kind: "toast", label: "Toast" },
]

/** Pause at the end of each pass before looping or stopping. */
export const HOLD_MS = 700

/** Graph geometry in SVG user units. The unit square is UNIT wide; y extends for overshoot. */
export const GRAPH = {
  unit: 200,
  pad: 24,
  yMin: -0.5,
  yMax: 1.5,
  /** Keyboard nudge per arrow press (Shift = ×10). */
  step: 0.01,
} as const
