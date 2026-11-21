import { buildPalette } from "./color"
import {
  BAND_COUNT,
  MIN_FADE,
  STILL_STEPS,
  STILL_WHIRL_AGE,
  STIR,
  WARMUP_STEPS,
  WHIRL,
  trailHalfLife,
} from "./data"
import { applyDisturbances, stirWeight } from "./disturbances"
import { FlowField } from "./field"
import { createNoise3D, mulberry32, type Noise3D } from "./noise"
import { createParticles, respawnAll, setCount, stepParticles } from "./particles"
import type { FlowSettings, Palette, Particles, Stir, Whirlpool } from "./types"

const FIXED_DT = 1 / 60
const SEED = 20261121

/**
 * Owns the simulation and draws it to a 2D canvas. No React: the canvas
 * component drives it with frame(), tap(), stir(), clear() and renderStill().
 */
export class FlowEngine {
  private ctx: CanvasRenderingContext2D
  private field = new FlowField()
  private particles: Particles
  private noise: Noise3D
  private rand: () => number
  private whirlpools: Whirlpool[] = []
  private stirs: Stir[] = []
  /** Real seconds simulated (disturbance timing). */
  private clock = 0
  /** Speed-scaled seconds (how far the noise has drifted). */
  private flowTime = 0
  /** Product of pending per-frame "keep" factors not yet applied as a fade. */
  private keep = 1
  private palette: Palette
  private paletteKey = ""
  private dark = true
  private dpr = 1
  private bandCounts = new Int32Array(BAND_COUNT + 1)
  private order: Int32Array

  constructor(
    private canvas: HTMLCanvasElement,
    private maxParticles: number
  ) {
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) throw new Error("2D canvas unavailable")
    this.ctx = ctx
    this.particles = createParticles(maxParticles)
    this.order = new Int32Array(maxParticles)
    this.rand = mulberry32(SEED)
    this.noise = createNoise3D(mulberry32(SEED + 1))
    this.palette = buildPalette(200, 0, true)
  }

  get short() {
    return this.field.short
  }

  resize(dpr: number) {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return false
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.field.resize(w, h)
    return true
  }

  setTheme(dark: boolean) {
    this.dark = dark
    this.paletteKey = ""
  }

  /** Restarts from a blank canvas with a fresh particle layout. */
  reset(s: FlowSettings) {
    this.whirlpools = []
    this.stirs = []
    this.ensurePalette(s)
    this.field.computeBase(this.flowTime, s.noiseScale, s.speed, this.noise)
    setCount(this.particles, this.countFor(s), this.field, this.rand)
    respawnAll(this.particles, this.field, this.rand)
    this.fill(1)
    this.keep = 1
  }

  /** Runs a few frames instantly so the canvas starts out with trails. */
  warmUp(s: FlowSettings, steps = WARMUP_STEPS) {
    for (let i = 0; i < steps; i++) this.frame(FIXED_DT, s)
  }

  frame(dt: number, s: FlowSettings, frozenAge?: number) {
    this.clock += dt
    this.flowTime += dt * s.speed
    this.ensurePalette(s)
    setCount(this.particles, this.countFor(s), this.field, this.rand)

    // Trails: fade toward the water colour, batched so 8-bit rounding can't leave ghosts.
    this.keep *= Math.pow(0.5, dt / trailHalfLife(s.trail))
    if (1 - this.keep >= MIN_FADE) {
      this.fill(1 - this.keep)
      this.keep = 1
    }

    this.field.computeBase(this.flowTime, s.noiseScale, s.speed, this.noise)
    if (frozenAge === undefined) this.expire()
    applyDisturbances(this.field, this.whirlpools, this.stirs, this.clock, frozenAge)
    stepParticles(this.particles, this.field, dt, this.rand)
    this.draw(s.lineWidth)
  }

  /** Reduced motion: one still frame showing the current settings and whirlpools. */
  renderStill(s: FlowSettings) {
    this.clock = 0
    this.flowTime = 0
    this.rand = mulberry32(SEED)
    const whirlpools = this.whirlpools
    this.reset(s)
    this.whirlpools = whirlpools
    for (let i = 0; i < STILL_STEPS; i++) this.frame(FIXED_DT, s, STILL_WHIRL_AGE)
  }

  /** Splash + whirlpool at (x, y), spinning in a random direction. */
  tap(x: number, y: number) {
    this.whirlpools.push({ x, y, t0: this.clock, dir: this.rand() < 0.5 ? 1 : -1 })
    if (this.whirlpools.length > WHIRL.max) this.whirlpools.shift()
  }

  /** One drag sample: push along (vx, vy) px/s around (x, y). */
  stir(x: number, y: number, vx: number, vy: number, distance: number) {
    const max = STIR.maxSpeed * this.short
    const speed = Math.hypot(vx, vy)
    const k = speed > max ? max / speed : 1
    this.stirs.push({ x, y, vx: vx * k, vy: vy * k, weight: stirWeight(distance, this.short), t0: this.clock })
    if (this.stirs.length > STIR.max) this.stirs.shift()
  }

  /** Wipes the trails and disturbances. */
  clear(s: FlowSettings) {
    this.reset(s)
  }

  private countFor(s: FlowSettings) {
    return Math.min(s.count, this.maxParticles)
  }

  private expire() {
    const c = this.clock
    if (this.whirlpools.length) this.whirlpools = this.whirlpools.filter((w) => c - w.t0 < WHIRL.life)
    if (this.stirs.length) this.stirs = this.stirs.filter((s) => c - s.t0 < STIR.life)
  }

  private ensurePalette(s: FlowSettings) {
    const key = `${s.hue}|${s.hueSpread}|${this.dark}`
    if (key === this.paletteKey) return
    this.paletteKey = key
    this.palette = buildPalette(s.hue, s.hueSpread, this.dark)
  }

  private fill(alpha: number) {
    const { ctx } = this
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.palette.backgroundCss
    ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr)
    ctx.globalAlpha = 1
  }

  /** One path per colour band: thousands of segments in BAND_COUNT stroke calls. */
  private draw(lineWidth: number) {
    const { ctx, particles: p, bandCounts, order } = this
    bandCounts.fill(0)
    for (let i = 0; i < p.count; i++) if (!p.skip[i]) bandCounts[p.band[i] + 1]++
    for (let b = 1; b <= BAND_COUNT; b++) bandCounts[b] += bandCounts[b - 1]
    const cursor = bandCounts.slice()
    for (let i = 0; i < p.count; i++) if (!p.skip[i]) order[cursor[p.band[i]]++] = i

    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    for (let b = 0; b < BAND_COUNT; b++) {
      const start = bandCounts[b]
      const end = bandCounts[b + 1]
      if (start === end) continue
      ctx.strokeStyle = this.palette.bands[b]
      ctx.beginPath()
      for (let k = start; k < end; k++) {
        const i = order[k]
        ctx.moveTo(p.px[i], p.py[i])
        ctx.lineTo(p.x[i], p.y[i])
      }
      ctx.stroke()
    }
  }
}
