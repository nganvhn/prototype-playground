"use client"

import { DemoScreen, SkeletonRows } from "./demo-screen"
import type { Run } from "./types"
import { useEnterAnimation } from "./use-enter-animation"

const KEYFRAMES: Keyframe[] = [{ transform: "translateY(-180%)" }, { transform: "translateY(0)" }]

export function ToastDemo({ run, reduced }: { run: Run | null; reduced: boolean }) {
  const ref = useEnterAnimation<HTMLDivElement>(run, KEYFRAMES, reduced)
  return (
    <DemoScreen label="Toast">
      <div className="pt-10">
        <SkeletonRows count={4} />
      </div>
      <div
        ref={ref}
        className="absolute inset-x-2 top-2 flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 shadow-md"
      >
        <div className="size-2 shrink-0 rounded-full bg-chart-2" />
        <div className="h-1.5 flex-1 rounded-full bg-foreground/30" />
      </div>
    </DemoScreen>
  )
}
