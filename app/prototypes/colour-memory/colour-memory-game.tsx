"use client"

import { useEffect, useMemo, useState } from "react"
import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { loadBestScores, saveBestScores } from "./best-scores"
import { colourDistance, generateTargets, mulberry32, scoreFromDeltaE } from "./colour"
import { ColourCard } from "./colour-card"
import { PREPARE_MS, PREVIEW_SEED, START_GUESS, STORAGE_NAMESPACE, gameControls } from "./data"
import { HslSliders } from "./hsl-sliders"
import { RoundSummary } from "./round-summary"
import type { BestScores, Hsl, Phase, Round, TurnResult } from "./types"

export function ColourMemoryGame() {
  const controls = useControls(STORAGE_NAMESPACE, gameControls)
  const { displayTime, colours, difficulty } = controls.values

  const [phase, setPhase] = useState<Phase>("idle")
  const [round, setRound] = useState<Round | null>(null)
  const [turn, setTurn] = useState(0)
  const [guess, setGuess] = useState<Hsl>(START_GUESS)
  const [results, setResults] = useState<TurnResult[]>([])
  const [best, setBest] = useState<BestScores>({})
  const [newBest, setNewBest] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage on mount
    setBest(loadBestScores())
  }, [])

  // Timed phases: blank pause → colour on screen → recall.
  useEffect(() => {
    if (phase === "preparing") {
      const t = setTimeout(() => setPhase("showing"), PREPARE_MS)
      return () => clearTimeout(t)
    }
    if (phase === "showing" && round) {
      const t = setTimeout(() => setPhase("recall"), round.displayMs)
      return () => clearTimeout(t)
    }
  }, [phase, round])

  const preview = useMemo(
    () => generateTargets(colours, difficulty, mulberry32(PREVIEW_SEED)),
    [colours, difficulty]
  )

  const start = () => {
    setRound({
      difficulty,
      displayMs: Math.round(displayTime * 1000),
      targets: generateTargets(colours, difficulty),
    })
    setTurn(0)
    setResults([])
    setNewBest(false)
    setGuess(START_GUESS)
    setPhase("preparing")
  }

  const submit = () => {
    if (!round) return
    const target = round.targets[turn]
    const deltaE = colourDistance(target, guess)
    setResults((r) => [...r, { target, guess, deltaE, score: scoreFromDeltaE(deltaE) }])
    setPhase("reveal")
  }

  const next = () => {
    if (!round) return
    if (turn + 1 < round.targets.length) {
      setTurn(turn + 1)
      setGuess(START_GUESS)
      setPhase("preparing")
      return
    }
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    const prev = best[round.difficulty]
    if (prev === undefined || avg > prev) {
      const updated = { ...best, [round.difficulty]: avg }
      setBest(updated)
      saveBestScores(updated)
      setNewBest(true)
    }
    setPhase("summary")
  }

  const inRound = phase !== "idle" && phase !== "summary"
  const total = round?.targets.length ?? colours
  const isLast = round !== null && turn + 1 >= round.targets.length

  const action =
    phase === "recall"
      ? { label: "Submit", onClick: submit, disabled: false }
      : phase === "reveal"
        ? { label: isLast ? "See results" : "Next colour", onClick: next, disabled: false }
        : { label: phase === "showing" ? "Memorise…" : "Get ready…", onClick: undefined, disabled: true }

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <div className="mb-4 flex min-h-7 items-center justify-between gap-3">
          <h1 className="site-chrome text-lg font-medium">Colour Memory</h1>
          {inRound && round && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {round.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground tabular-nums">
                {turn + 1} / {total}
              </span>
            </div>
          )}
        </div>

        <ColourCard
          phase={phase}
          target={round?.targets[turn]}
          guess={guess}
          result={phase === "reveal" ? results[turn] : undefined}
          results={results}
          preview={preview}
          displayMs={round?.displayMs ?? 0}
          turnKey={turn}
        />

        {/* Idle */}
        <div className="collapse-grid" data-open={phase === "idle"}>
          <div>
            <div className="flex flex-col gap-3 pt-5">
              <Button className="h-12 text-base" onClick={start}>
                Start round
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {colours} colours · {displayTime} s each
                {best[difficulty] !== undefined && <> · Best {best[difficulty]}</>}
              </p>
            </div>
          </div>
        </div>

        {/* Playing */}
        <div className="collapse-grid" data-open={inRound}>
          <div>
            <div className="flex flex-col gap-5 pt-5 pb-1">
              <HslSliders value={guess} onChange={setGuess} disabled={phase !== "recall"} />
              {/* Right padding on mobile keeps the button clear of the floating controls button. */}
              <div className="pr-16 lg:pr-0">
                <Button
                  className="h-12 w-full text-base"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="collapse-grid" data-open={phase === "summary"}>
          <div>
            {round && (
              <RoundSummary
                results={results}
                difficulty={round.difficulty}
                best={best[round.difficulty]}
                newBest={newBest}
                active={phase === "summary"}
                onPlayAgain={start}
              />
            )}
          </div>
        </div>
      </div>
    </PlaygroundLayout>
  )
}
