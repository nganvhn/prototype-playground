"use client"

import { cn } from "@/lib/utils"
import { CardDemo } from "./card-demo"
import { DEMOS } from "./data"
import { ModalDemo } from "./modal-demo"
import { ToastDemo } from "./toast-demo"
import type { DemoKind, DemoProps, Run } from "./types"

const COMPONENTS: Record<DemoKind, (p: DemoProps) => React.ReactNode> = {
  card: CardDemo,
  modal: ModalDemo,
  toast: ToastDemo,
}

/** "All": three screens in a row. A single demo gets one larger screen. */
export function DemoStage({
  demo,
  run,
  reduced,
}: {
  demo: DemoKind | "all"
  run: Run | null
  reduced: boolean
}) {
  const all = demo === "all"
  const shown = DEMOS.filter((d) => all || d.kind === demo)
  return (
    <div className={cn("grid gap-2 sm:gap-3", all ? "grid-cols-3" : "mx-auto w-full max-w-md grid-cols-1")}>
      {shown.map((d) => {
        const Demo = COMPONENTS[d.kind]
        return (
          <Demo
            key={d.kind}
            run={run}
            reduced={reduced}
            className={all ? "h-[22svh] min-h-28 lg:h-[26svh]" : "h-[22svh] min-h-32 lg:h-[34svh]"}
          />
        )
      })}
    </div>
  )
}
