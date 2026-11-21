"use client"

import { DemoScreen, SkeletonRows } from "./demo-screen"
import type { Run } from "./types"
import { useEnterAnimation } from "./use-enter-animation"

const BACKDROP: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }]
const DIALOG: Keyframe[] = [
  { transform: "scale(0.5)", opacity: 0 },
  { transform: "scale(1)", opacity: 1 },
]

export function ModalDemo({ run, reduced }: { run: Run | null; reduced: boolean }) {
  const backdrop = useEnterAnimation<HTMLDivElement>(run, BACKDROP, reduced)
  const dialog = useEnterAnimation<HTMLDivElement>(run, DIALOG, reduced)
  return (
    <DemoScreen label="Modal">
      <SkeletonRows count={4} />
      <div ref={backdrop} className="absolute inset-0 bg-background/70" />
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div
          ref={dialog}
          className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-lg"
        >
          <div className="h-2 w-2/3 rounded-full bg-foreground/30" />
          <div className="h-1.5 w-full rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-4/5 rounded-full bg-muted-foreground/30" />
          <div className="mt-1 h-4 w-1/2 self-end rounded-md bg-primary" />
        </div>
      </div>
    </DemoScreen>
  )
}
