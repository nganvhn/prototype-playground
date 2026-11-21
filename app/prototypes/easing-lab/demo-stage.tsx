"use client"

import { cn } from "@/lib/utils"
import { CardDemo } from "./card-demo"
import { DEMOS } from "./data"
import { ModalDemo } from "./modal-demo"
import { ToastDemo } from "./toast-demo"
import type { DemoKind, Run } from "./types"

const COMPONENTS: Record<DemoKind, typeof CardDemo> = {
  card: CardDemo,
  modal: ModalDemo,
  toast: ToastDemo,
}

export function DemoStage({
  demo,
  run,
  reduced,
}: {
  demo: DemoKind | "all"
  run: Run | null
  reduced: boolean
}) {
  const shown = DEMOS.filter((d) => demo === "all" || d.kind === demo)
  return (
    <div className={cn("grid gap-3", demo === "all" ? "grid-cols-3" : "mx-auto w-full max-w-52 grid-cols-1")}>
      {shown.map((d) => {
        const Demo = COMPONENTS[d.kind]
        return <Demo key={d.kind} run={run} reduced={reduced} />
      })}
    </div>
  )
}
