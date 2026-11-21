/** Cubic-bezier control points [x1, y1, x2, y2]. x is clamped to 0–1, y may overshoot. */
export type Bezier = readonly [number, number, number, number]

export type Preset = { name: string; value: Bezier }

export type DemoKind = "card" | "modal" | "toast"

/** One playback pass, snapshotted when it starts so mid-run edits apply to the next pass. */
export type Run = {
  id: number
  bezier: Bezier
  easing: string
  duration: number
  startedAt: number
}

/** Pixel layout of the graph. x and y scales are independent (flattened on phones). */
export type Geometry = {
  width: number
  height: number
  /** Left edge of the 0–1 x range, in px. */
  left: number
  /** Pixels per curve unit on each axis. */
  unitX: number
  unitY: number
}

export type DemoProps = {
  run: Run | null
  reduced: boolean
  className?: string
}
