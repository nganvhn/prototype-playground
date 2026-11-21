"use client"

import { useCallback, useEffect, useState } from "react"
import { copyText } from "./clipboard"

export type CopyStatus = "idle" | "copied" | "failed"

/** Copy with a short-lived status for button feedback. */
export function useCopy(text: string) {
  const [status, setStatus] = useState<CopyStatus>("idle")

  useEffect(() => {
    if (status === "idle") return
    const t = window.setTimeout(() => setStatus("idle"), 1500)
    return () => window.clearTimeout(t)
  }, [status])

  const copy = useCallback(async () => setStatus((await copyText(text)) ? "copied" : "failed"), [text])

  return { status, copy }
}
