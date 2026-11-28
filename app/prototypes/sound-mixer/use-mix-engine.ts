"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MixEngine } from "./mix-engine"
import type { Layers, MixSettings } from "./types"

/**
 * React binding for MixEngine: keeps it in sync with layers/settings/timer,
 * exposes play state and the auto-stop countdown, wires Media Session
 * (lock-screen controls) and closes audio when the page goes away.
 */
export function useMixEngine(layers: Layers, settings: MixSettings, timerMinutes: number | null) {
  const engineRef = useRef<MixEngine | null>(null)
  const [playing, setPlaying] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const latest = useRef({ layers, settings, timerMinutes })

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const { layers, settings, timerMinutes } = latest.current
      engineRef.current = new MixEngine(layers, settings, setPlaying)
      engineRef.current.setTimer(timerMinutes)
    }
    return engineRef.current
  }, [])

  useEffect(() => {
    latest.current = { layers, settings, timerMinutes }
    engineRef.current?.setLayers(layers)
  }, [layers, settings, timerMinutes])

  useEffect(() => {
    engineRef.current?.setSettings(settings)
  }, [settings])

  useEffect(() => {
    engineRef.current?.setTimer(timerMinutes)
  }, [timerMinutes])

  const toggle = useCallback(() => {
    const engine = getEngine()
    if (engine.isPlaying) engine.pause()
    else engine.play()
  }, [getEngine])

  // Countdown readout.
  useEffect(() => {
    if (!playing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear readout when stopped
      setRemaining(null)
      return
    }
    const update = () => setRemaining(engineRef.current?.remaining ?? null)
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [playing, timerMinutes])

  // Keep playing when hidden; release audio cleanly when the tab closes or we navigate away.
  useEffect(() => {
    const onHide = () => engineRef.current?.dispose()
    window.addEventListener("pagehide", onHide)
    return () => {
      window.removeEventListener("pagehide", onHide)
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  // Lock-screen / headphone controls where supported.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    const ms = navigator.mediaSession
    try {
      ms.metadata = new MediaMetadata({ title: "Focus mix", artist: "Sound Mixer" })
      ms.setActionHandler("play", () => getEngine().play())
      ms.setActionHandler("pause", () => getEngine().pause())
    } catch {
      /* partial support */
    }
    return () => {
      try {
        ms.setActionHandler("play", null)
        ms.setActionHandler("pause", null)
        ms.metadata = null
      } catch {
        /* ignore */
      }
    }
  }, [getEngine])

  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused"
  }, [playing])

  return { playing, remaining, toggle }
}
