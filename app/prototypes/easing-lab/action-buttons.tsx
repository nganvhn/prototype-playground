"use client"

import { CheckIcon, CopyIcon, PlayIcon, SquareIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toCss } from "./bezier"
import type { Bezier } from "./types"
import { useCopy } from "./use-copy"

/** Play + Copy CSS. Used in the phone bottom bar and at the top of the desktop panel. */
export function ActionButtons({
  bezier,
  looping,
  onPlay,
  onStop,
}: {
  bezier: Bezier
  looping: boolean
  onPlay: () => void
  onStop: () => void
}) {
  const { status, copy } = useCopy(toCss(bezier))
  return (
    <div className="flex gap-2">
      <Button className="h-12 flex-1 text-base" onClick={looping ? onStop : onPlay}>
        {looping ? <SquareIcon /> : <PlayIcon />}
        {looping ? "Stop" : "Play"}
      </Button>
      <Button variant="outline" className="h-12 flex-1 text-base" onClick={copy}>
        {status === "copied" ? <CheckIcon /> : <CopyIcon />}
        {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy CSS"}
      </Button>
    </div>
  )
}
