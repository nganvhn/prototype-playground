"use client"

import { PauseIcon, PlayIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FADE } from "./data"
import { formatRemaining } from "./mix-math"

export function PlayButton({
  playing,
  remaining,
  onToggle,
}: {
  playing: boolean
  remaining: number | null
  onToggle: () => void
}) {
  const status = !playing
    ? "Paused"
    : remaining === null
      ? "Playing"
      : remaining <= FADE.timerOut
        ? "Fading out"
        : `Stops in ${formatRemaining(remaining)}`

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="icon"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
        aria-pressed={playing}
        className="size-24 rounded-full shadow-sm transition-transform duration-150 ease-out active:scale-95 [&_svg:not([class*='size-'])]:size-9"
      >
        {playing ? <PauseIcon className="fill-current" /> : <PlayIcon className="translate-x-0.5 fill-current" />}
      </Button>
      <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
        {status}
      </p>
    </div>
  )
}
