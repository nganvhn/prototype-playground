import { BREATH_HZ, GROW_SECONDS, INITIAL_SEED_COUNT, MIN_SEED_GAP, SHRINK_SECONDS } from "./data"
import { easeOutCubic, easeOutCubicInverse } from "./easing"
import type { Seed, Site, StoredSeed } from "./types"

/** Deterministic PRNG so the starter garden (and thumbnails) look the same every time. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (v: number) => Math.min(0.995, Math.max(0.005, v))

/**
 * The garden's mutable state. Plain TypeScript (no React): the canvas owns one
 * instance in a ref and calls `step` every frame.
 */
export class Garden {
  seeds: Seed[] = []
  private nextId = 1
  private rand: () => number

  constructor(rand: () => number = Math.random) {
    this.rand = rand
  }

  private make(x: number, y: number, hueSeed: number, life: number): Seed {
    const r = this.rand
    return {
      id: this.nextId++,
      x: clamp01(x),
      y: clamp01(y),
      hueSeed,
      rate: (0.5 + r()) * (r() < 0.5 ? -1 : 1),
      tone: (r() - 0.5) * 0.1,
      phaseX: r() * Math.PI * 2,
      phaseY: r() * Math.PI * 2,
      freqX: 0.7 + r() * 0.6,
      freqY: 0.7 + r() * 0.6,
      phase: life >= 1 ? "alive" : "growing",
      life,
    }
  }

  get live() {
    return this.seeds.filter((s) => s.phase !== "dying")
  }

  /** Plants a seed unless one already sits (almost) on that spot. */
  plant(x: number, y: number, instant = false): Seed | null {
    for (const s of this.live) {
      if (Math.hypot(s.x - x, s.y - y) < MIN_SEED_GAP) return null
    }
    const seed = this.make(x, y, this.rand(), instant ? 1 : 0)
    this.seeds.push(seed)
    return seed
  }

  remove(seed: Seed, instant = false) {
    if (seed.phase === "dying") return
    if (instant) {
      this.seeds = this.seeds.filter((s) => s !== seed)
      return
    }
    // Keep the eased size continuous when a growing seed is removed mid-growth.
    const shown = seed.phase === "growing" ? easeOutCubic(seed.life) : 1
    seed.life = 1 - easeOutCubicInverse(1 - shown)
    seed.phase = "dying"
  }

  clear(instant = false) {
    for (const s of [...this.seeds]) this.remove(s, instant)
  }

  /** Fades out the oldest live seeds beyond `max`. */
  enforceMax(max: number, instant = false): number {
    const live = this.live
    const extra = Math.max(0, live.length - max)
    for (let i = 0; i < extra; i++) this.remove(live[i], instant)
    return extra
  }

  move(seed: Seed, x: number, y: number) {
    seed.x = clamp01(x)
    seed.y = clamp01(y)
  }

  /** Advances growth/shrink animations. Returns true while any are still running. */
  step(dt: number): boolean {
    let busy = false
    for (const s of this.seeds) {
      if (s.phase === "growing") {
        s.life = Math.min(1, s.life + dt / GROW_SECONDS)
        if (s.life >= 1) s.phase = "alive"
        else busy = true
      } else if (s.phase === "dying") {
        s.life = Math.max(0, s.life - dt / SHRINK_SECONDS)
        busy = true
      }
    }
    const before = this.seeds.length
    this.seeds = this.seeds.filter((s) => !(s.phase === "dying" && s.life <= 0))
    return busy || this.seeds.length !== before
  }

  /** Displayed sites for time `t` (seconds) and a breathing amount 0..1. */
  sites(t: number, breathing: number, breathSpeed: number): Site[] {
    const count = Math.max(1, this.live.length)
    // Drift scales with typical cell spacing so borders pulse, seeds don't wander.
    const amp = breathing * 0.22 * Math.sqrt(1 / count)
    const w = Math.PI * 2 * BREATH_HZ * breathSpeed
    return this.seeds.map((seed) => ({
      seed,
      px: clamp01(seed.x + amp * Math.sin(t * w * seed.freqX + seed.phaseX)),
      py: clamp01(seed.y + amp * Math.cos(t * w * seed.freqY + seed.phaseY)),
      scale:
        seed.phase === "growing"
          ? easeOutCubic(seed.life)
          : seed.phase === "dying"
            ? 1 - easeOutCubic(1 - seed.life)
            : 1,
    }))
  }

  toStored(): StoredSeed[] {
    return this.live.map((s) => ({
      x: +s.x.toFixed(4),
      y: +s.y.toFixed(4),
      h: +s.hueSeed.toFixed(4),
    }))
  }

  load(stored: StoredSeed[]) {
    this.seeds = stored.map((s) => this.make(s.x, s.y, s.h, 1))
  }

  /** A loose, evenly spread starter garden. */
  seedStarter() {
    const r = mulberry32(11)
    const seeds: Seed[] = []
    let tries = 0
    while (seeds.length < INITIAL_SEED_COUNT && tries++ < 500) {
      const x = 0.06 + r() * 0.88
      const y = 0.06 + r() * 0.88
      if (seeds.some((s) => Math.hypot(s.x - x, s.y - y) < 0.17)) continue
      seeds.push(this.make(x, y, r(), 1))
    }
    this.seeds = seeds
  }
}
