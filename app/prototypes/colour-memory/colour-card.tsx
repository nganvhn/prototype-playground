"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { toCss } from "./colour"
import { REVEAL_SPLIT_MS, SCORE_COUNT_MS } from "./data"
import type { Hsl, Phase, TurnResult } from "./types"
import { useCountUp } from "./use-count-up"

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Small label pill that stays readable on any colour (token background, not a computed text colour). */
function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Thin bar that drains over the display time. */
function DrainBar({ durationMs }: { durationMs: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    const anim = el.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], {
      duration: durationMs,
      easing: "linear",
      fill: "forwards",
    })
    return () => anim.cancel()
  }, [durationMs])
  return (
    <div className="absolute inset-x-6 bottom-6 h-1.5 overflow-hidden rounded-full bg-background/40">
      <div ref={ref} className="h-full origin-left rounded-full bg-background/90" />
    </div>
  )
}

function Reveal({ result }: { result: TurnResult }) {
  const targetRef = useRef<HTMLDivElement>(null)
  const score = useCountUp(result.score, SCORE_COUNT_MS, result, REVEAL_SPLIT_MS * 0.4)

  useEffect(() => {
    const el = targetRef.current
    if (!el || reducedMotion()) return
    const anim = el.animate(
      [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 50% 0 0)" }],
      { duration: REVEAL_SPLIT_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    )
    return () => anim.cancel()
  }, [result])

  return (
    <>
      <div className="absolute inset-0" style={{ background: toCss(result.guess) }} />
      <div
        ref={targetRef}
        className="absolute inset-0"
        style={{ background: toCss(result.target), clipPath: "inset(0 50% 0 0)" }}
      />
      <Pill className="absolute top-4 left-4">Target</Pill>
      <Pill className="absolute top-4 right-4">You</Pill>
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        <span className="flex min-w-24 flex-col items-center rounded-2xl bg-background/85 px-5 py-2 text-foreground backdrop-blur-sm">
          <span className="text-4xl font-semibold tabular-nums">{score}</span>
          <span className="text-[11px] text-muted-foreground">/ 100</span>
        </span>
      </div>
    </>
  )
}

/** Vertical stripes; each optionally split into target (top) and guess (bottom). */
function Stripes({ top, bottom }: { top: Hsl[]; bottom?: Hsl[] }) {
  return (
    <div className="absolute inset-0 flex">
      {top.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col">
          <div className="flex-1" style={{ background: toCss(c) }} />
          {bottom?.[i] && <div className="flex-1" style={{ background: toCss(bottom[i]) }} />}
        </div>
      ))}
    </div>
  )
}

export function ColourCard({
  phase,
  target,
  guess,
  result,
  results,
  preview,
  displayMs,
  turnKey,
}: {
  phase: Phase
  target?: Hsl
  guess: Hsl
  result?: TurnResult
  results: TurnResult[]
  preview: Hsl[]
  displayMs: number
  turnKey: number
}) {
  return (
    <div
      className="relative aspect-[7/4] w-full sm:aspect-[2/1] overflow-hidden rounded-3xl border border-border bg-muted"
      aria-live="polite"
    >
      {phase === "idle" && <Stripes top={preview} />}

      {phase === "showing" && target && (
        <>
          <div className="absolute inset-0" style={{ background: toCss(target) }} />
          <DrainBar key={turnKey} durationMs={displayMs} />
          <span className="sr-only">Memorise this colour</span>
        </>
      )}

      {phase === "recall" && <div className="absolute inset-0" style={{ background: toCss(guess) }} />}

      {phase === "reveal" && result && <Reveal key={turnKey} result={result} />}

      {phase === "summary" && (
        <>
          <Stripes top={results.map((r) => r.target)} bottom={results.map((r) => r.guess)} />
          <Pill className="absolute top-4 left-4">Target</Pill>
          <Pill className="absolute bottom-4 left-4">You</Pill>
        </>
      )}
    </div>
  )
}
