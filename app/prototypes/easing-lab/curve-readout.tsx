"use client"

import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toCss } from "./bezier"
import type { Bezier } from "./types"

const LABELS = ["x1", "y1", "x2", "y2"] as const

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for contexts without the async clipboard API.
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function CurveReadout({ bezier }: { bezier: Bezier }) {
  const css = toCss(bezier)
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if (status === "idle") return
    const t = window.setTimeout(() => setStatus("idle"), 1500)
    return () => window.clearTimeout(t)
  }, [status])

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-4 gap-2 text-center">
        {LABELS.map((label, i) => (
          <div key={label} className="rounded-md border border-border py-1.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-mono text-sm tabular-nums">{bezier[i].toFixed(2)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-2 rounded-md border border-border pl-3">
        <code className="min-w-0 flex-1 font-mono text-xs">{css}</code>
        <Button
          variant="ghost"
          className="h-11 min-w-11"
          aria-label="Copy CSS value"
          onClick={async () => setStatus((await copyText(css)) ? "copied" : "failed")}
        >
          {status === "copied" ? <CheckIcon /> : <CopyIcon />}
          <span className="hidden sm:inline">
            {status === "copied" ? "Copied" : status === "failed" ? "Failed" : "Copy"}
          </span>
        </Button>
      </div>
    </div>
  )
}

