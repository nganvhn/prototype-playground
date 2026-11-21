"use client"

import { useId, useState } from "react"
import { clampX, clampY, formatNumber } from "./bezier"
import { GRAPH } from "./data"
import type { Bezier } from "./types"

const FIELDS = [
  { label: "x1", axis: "x" },
  { label: "y1", axis: "y" },
  { label: "x2", axis: "x" },
  { label: "y2", axis: "y" },
] as const

export function ValueFields({ bezier, onChange }: { bezier: Bezier; onChange: (b: Bezier) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {FIELDS.map((f, i) => (
        <ValueField
          key={f.label}
          label={f.label}
          axis={f.axis}
          value={bezier[i]}
          onCommit={(v) => onChange(bezier.map((b, j) => (j === i ? v : b)) as unknown as Bezier)}
        />
      ))}
    </div>
  )
}

/**
 * Number field that keeps the raw text while focused (so "-" or "0." can be typed),
 * commits every parseable value clamped to the allowed range, and tidies up on blur.
 */
function ValueField({
  label,
  axis,
  value,
  onCommit,
}: {
  label: string
  axis: "x" | "y"
  value: number
  onCommit: (v: number) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const clampFn = axis === "x" ? clampX : clampY

  return (
    <label
      htmlFor={id}
      className="flex h-11 min-w-0 items-center gap-1.5 rounded-md border border-input bg-transparent pl-2.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        id={id}
        type="number"
        step={0.01}
        min={axis === "x" ? 0 : GRAPH.yMin}
        max={axis === "x" ? 1 : GRAPH.yMax}
        value={draft ?? formatNumber(value)}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Number.parseFloat(e.target.value)
          if (Number.isFinite(n)) onCommit(clampFn(n))
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-full w-full min-w-0 [appearance:textfield] bg-transparent pr-1 font-mono text-base tabular-nums outline-none sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  )
}
