"use client"

import { useCallback, useEffect, useState } from "react"
import { defaultsOf, randomize, sanitize } from "./logic"
import type { ControlSchema, ControlValues } from "./types"

/**
 * State for a control panel. Values persist to localStorage under
 * `playground:<namespace>:controls`, loaded on mount (never during SSR).
 */
export function useControls<S extends ControlSchema>(namespace: string, schema: S) {
  const key = `playground:${namespace}:controls`
  const [values, setValues] = useState<ControlValues<S>>(() => defaultsOf(schema))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage on mount
      if (raw) setValues(sanitize(schema, JSON.parse(raw)))
    } catch {
      /* storage unavailable or corrupt: keep defaults */
    }
    setLoaded(true)
    // schema is static per prototype
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(key, JSON.stringify(values))
    } catch {
      /* ignore quota / private mode */
    }
  }, [key, values, loaded])

  const set = useCallback(
    <K extends keyof S>(k: K, v: ControlValues<S>[K]) => setValues((prev) => ({ ...prev, [k]: v })),
    []
  )
  const reset = useCallback(() => setValues(defaultsOf(schema)), [schema])
  const surprise = useCallback(() => setValues(randomize(schema)), [schema])

  return { values, set, reset, randomize: surprise, schema }
}

export type ControlsState<S extends ControlSchema> = ReturnType<typeof useControls<S>>
