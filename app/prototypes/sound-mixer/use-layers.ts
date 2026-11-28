"use client"

import { useCallback, useEffect, useState } from "react"
import { DEFAULT_LAYERS, LAYERS_KEY } from "./data"
import { sanitizeLayers } from "./mix-math"
import type { LayerId, LayerState, Layers } from "./types"

/** Layer on/off + volume, persisted to localStorage (loaded on mount, never during SSR). */
export function useLayers() {
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYERS_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage on mount
      if (raw) setLayers(sanitizeLayers(JSON.parse(raw), DEFAULT_LAYERS))
    } catch {
      /* unavailable or corrupt: keep defaults */
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(LAYERS_KEY, JSON.stringify(layers))
    } catch {
      /* quota / private mode */
    }
  }, [layers, loaded])

  const update = useCallback((id: LayerId, patch: Partial<LayerState>) => {
    setLayers((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  return { layers, setLayers, update }
}
