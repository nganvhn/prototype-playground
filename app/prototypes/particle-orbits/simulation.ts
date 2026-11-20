import { BASE_ANGULAR_SPEED, RING_COUNT, SPIRAL_ARMS } from "./data"
import type { Layout, Particle } from "./types"

/** Deterministic PRNG so the same seed gives the same field (handy for thumbnails). */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createParticles(count: number, layout: Layout, rand: () => number): Particle[] {
  return Array.from({ length: count }, () => {
    const u = rand()
    let radius: number
    let angle = rand() * Math.PI * 2
    if (layout === "rings") {
      const ring = Math.floor(u * RING_COUNT) + 1
      radius = ring / (RING_COUNT + 0.5) + (rand() - 0.5) * 0.02
    } else if (layout === "spiral") {
      radius = 0.08 + Math.sqrt(u) * 0.85
      const arm = Math.floor(rand() * SPIRAL_ARMS)
      angle = (arm / SPIRAL_ARMS) * Math.PI * 2 + radius * 6 + (rand() - 0.5) * 0.35
    } else {
      radius = 0.05 + Math.sqrt(u) * 0.88
    }
    return { radius, angle, hueOffset: (rand() - 0.5) * 60 }
  })
}

/** Kepler-ish: inner particles orbit faster (ω ∝ r^-1.5), clamped near the centre. */
export function angularVelocity(radius: number, speed: number) {
  return (BASE_ANGULAR_SPEED * speed) / Math.pow(Math.max(radius, 0.15), 1.5)
}

/** Advances every particle by dt seconds, in place. */
export function step(particles: Particle[], dt: number, speed: number) {
  for (const p of particles) p.angle += angularVelocity(p.radius, speed) * dt
}

export function toCanvas(p: Particle, cx: number, cy: number, half: number) {
  return { x: cx + Math.cos(p.angle) * p.radius * half, y: cy + Math.sin(p.angle) * p.radius * half }
}
