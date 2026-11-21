"use client"

import { DemoScreen, SkeletonRows } from "./demo-screen"
import type { Run } from "./types"
import { useEnterAnimation } from "./use-enter-animation"

const KEYFRAMES: Keyframe[] = [{ transform: "translateX(-130%)" }, { transform: "translateX(0)" }]

export function CardDemo({ run, reduced }: { run: Run | null; reduced: boolean }) {
  const ref = useEnterAnimation<HTMLDivElement>(run, KEYFRAMES, reduced)
  return (
    <DemoScreen label="Card">
      <SkeletonRows count={0} />
      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2">
        <div ref={ref} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="size-5 shrink-0 rounded-full bg-primary" />
            <div className="h-2 flex-1 rounded-full bg-foreground/30" />
          </div>
          <div className="h-1.5 w-4/5 rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-3/5 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </DemoScreen>
  )
}
