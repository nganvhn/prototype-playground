"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SCORE_COUNT_MS } from "./data"
import type { Difficulty, TurnResult } from "./types"
import { useCountUp } from "./use-count-up"

export function RoundSummary({
  results,
  difficulty,
  best,
  newBest,
  active,
  onPlayAgain,
}: {
  results: TurnResult[]
  difficulty: Difficulty
  best: number | undefined
  newBest: boolean
  active: boolean
  onPlayAgain: () => void
}) {
  const total = results.reduce((s, r) => s + r.score, 0)
  const avg = results.length ? Math.round(total / results.length) : 0
  const shown = useCountUp(active ? total : 0, SCORE_COUNT_MS * 1.3, active)

  return (
    <div className="flex flex-col gap-5 pt-2 pb-1">
      {/* Per-colour scores, aligned with the stripes on the card above */}
      <div className="flex px-px">
        {results.map((r, i) => (
          <span key={i} className="flex-1 text-center text-xs text-muted-foreground tabular-nums">
            {r.score}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-6xl font-semibold tabular-nums">{shown}</span>
          <span className="text-lg text-muted-foreground tabular-nums">/ {results.length * 100}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Average {avg}</span>
          <span aria-hidden>·</span>
          <span>
            {difficulty === "easy" ? "Easy" : "Hard"} best {best ?? avg}
          </span>
          {newBest && <Badge variant="outline">New best</Badge>}
        </div>
      </div>

      <div className="pr-16 lg:pr-0">
        <Button className="h-12 w-full text-base" onClick={onPlayAgain}>
          Play again
        </Button>
      </div>
    </div>
  )
}
