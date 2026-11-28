import { FADE, LOOKAHEAD, SCHEDULER_INTERVAL_MS } from "./data"
import { MixGraph } from "./mix-graph"
import type { Layers, MixSettings } from "./types"

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

/**
 * Owns the AudioContext lifecycle: created on the first user tap (iOS/Safari
 * rule), faded in/out on play/pause, suspended when paused, closed on dispose.
 * Pure Web Audio, no React.
 */
export class MixEngine {
  private ctx: AudioContext | null = null
  private graph: MixGraph | null = null
  private ticker: ReturnType<typeof setInterval> | null = null
  private suspendTimer: ReturnType<typeof setTimeout> | null = null
  private playing = false
  /** Audio-clock time at which the auto-stop fade completes. */
  private deadline: number | null = null
  private timerMinutes: number | null = null

  constructor(
    private layers: Layers,
    private settings: MixSettings,
    /** Called whenever playback starts or stops, including system interruptions and auto-stop. */
    private readonly onPlayingChange: (playing: boolean) => void
  ) {}

  get isPlaying() {
    return this.playing
  }

  /** Seconds until auto-stop completes, or null when no timer is running. */
  get remaining(): number | null {
    if (!this.ctx || this.deadline === null || !this.playing) return null
    return Math.max(0, this.deadline - this.ctx.currentTime)
  }

  /** Must be called synchronously from a user gesture the first time. */
  play() {
    if (this.playing) return
    const ctx = this.ensureContext()
    if (!ctx || !this.graph) return
    if (this.suspendTimer) clearTimeout(this.suspendTimer)
    this.suspendTimer = null
    void ctx.resume().catch(() => {})
    const now = ctx.currentTime
    const fade = this.graph.fade.gain
    fade.cancelScheduledValues(now)
    fade.setValueAtTime(fade.value, now)
    fade.setTargetAtTime(1, now, FADE.playIn)
    this.setPlaying(true)
    this.armTimer()
    this.startTicker()
  }

  pause() {
    if (!this.playing || !this.ctx || !this.graph) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const fade = this.graph.fade.gain
    fade.cancelScheduledValues(now)
    fade.setValueAtTime(fade.value, now)
    fade.setTargetAtTime(0, now, FADE.pauseOut)
    this.setPlaying(false)
    this.disarmTimer()
    this.stopTicker()
    this.suspendTimer = setTimeout(() => {
      if (!this.playing && ctx.state === "running") void ctx.suspend().catch(() => {})
    }, FADE.suspendDelay * 1000)
  }

  setLayers(layers: Layers) {
    this.layers = layers
    this.graph?.setLayers(layers)
    if (this.playing) this.tick()
  }

  setSettings(settings: MixSettings) {
    this.settings = settings
    this.graph?.setSettings(settings)
  }

  /** Auto-stop after this many minutes of playback (null = off). Restarts the countdown. */
  setTimer(minutes: number | null) {
    if (minutes === this.timerMinutes) return
    this.timerMinutes = minutes
    if (this.playing) this.armTimer()
  }

  /** Stop immediately and release the audio device (tab closing, navigation away). */
  dispose() {
    this.stopTicker()
    if (this.suspendTimer) clearTimeout(this.suspendTimer)
    const ctx = this.ctx
    this.ctx = null
    this.graph = null
    this.deadline = null
    if (ctx) {
      ctx.onstatechange = null
      void ctx.close().catch(() => {})
    }
    this.setPlaying(false)
  }

  private ensureContext() {
    if (this.ctx) return this.ctx
    if (typeof window === "undefined" || !window.AudioContext) return null
    // Safari 17+: treat this as media playback (ignores the silent switch).
    const nav = navigator as AudioSessionNavigator
    try {
      if (nav.audioSession) nav.audioSession.type = "playback"
    } catch {
      /* unsupported */
    }
    const ctx = new AudioContext({ latencyHint: "playback" })
    this.ctx = ctx
    this.graph = new MixGraph(ctx, this.layers, this.settings)
    // The system can suspend or interrupt us (iOS calls, other apps): reflect it in the UI.
    ctx.onstatechange = () => {
      if (this.playing && ctx.state !== "running") {
        this.setPlaying(false)
        this.disarmTimer()
        this.stopTicker()
        if (this.graph) {
          this.graph.fade.gain.cancelScheduledValues(0)
          this.graph.fade.gain.value = 0
        }
      }
    }
    return ctx
  }

  private armTimer() {
    const ctx = this.ctx
    const graph = this.graph
    if (!ctx || !graph) return
    const g = graph.timer.gain
    const now = ctx.currentTime
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.setTargetAtTime(1, now, FADE.param)
    if (this.timerMinutes === null) {
      this.deadline = null
      return
    }
    // The 10 s fade lives on the audio clock, so it's exact even if JS timers are throttled.
    const deadline = now + this.timerMinutes * 60
    g.setValueAtTime(1, deadline - FADE.timerOut)
    g.linearRampToValueAtTime(0, deadline)
    this.deadline = deadline
  }

  private disarmTimer() {
    this.deadline = null
    const ctx = this.ctx
    const graph = this.graph
    if (!ctx || !graph) return
    const g = graph.timer.gain
    const now = ctx.currentTime
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    // Back to unity while the play/pause fade covers it.
    g.setTargetAtTime(1, now + FADE.suspendDelay, FADE.param)
  }

  private startTicker() {
    this.stopTicker()
    this.tick()
    this.ticker = setInterval(() => this.tick(), SCHEDULER_INTERVAL_MS)
  }

  private stopTicker() {
    if (this.ticker) clearInterval(this.ticker)
    this.ticker = null
  }

  private tick() {
    const ctx = this.ctx
    if (!ctx || !this.graph) return
    if (this.deadline !== null && ctx.currentTime >= this.deadline) {
      this.pause()
      return
    }
    this.graph.schedule(ctx.currentTime + LOOKAHEAD)
  }

  private setPlaying(playing: boolean) {
    if (this.playing === playing) return
    this.playing = playing
    this.onPlayingChange(playing)
  }
}
