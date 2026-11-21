import { INERTIA_TAU, LIFE } from "./data"
import type { FlowField } from "./field"
import type { Particles } from "./types"

export function createParticles(capacity: number): Particles {
  return {
    count: 0,
    x: new Float32Array(capacity),
    y: new Float32Array(capacity),
    px: new Float32Array(capacity),
    py: new Float32Array(capacity),
    vx: new Float32Array(capacity),
    vy: new Float32Array(capacity),
    age: new Float32Array(capacity),
    life: new Float32Array(capacity),
    band: new Uint8Array(capacity),
    skip: new Uint8Array(capacity),
  }
}

const tmp = { x: 0, y: 0 }

/** Places particle i at a uniformly random spot, already moving with the local current. */
export function spawn(p: Particles, i: number, field: FlowField, rand: () => number, randomAge = false) {
  const x = rand() * field.width
  const y = rand() * field.height
  p.x[i] = p.px[i] = x
  p.y[i] = p.py[i] = y
  p.band[i] = field.sample(x, y, tmp)
  p.vx[i] = tmp.x
  p.vy[i] = tmp.y
  p.life[i] = LIFE.min + rand() * (LIFE.max - LIFE.min)
  p.age[i] = randomAge ? rand() * p.life[i] : 0
  p.skip[i] = 1
}

/** Grows or shrinks the live particle count without disturbing existing ones. */
export function setCount(p: Particles, n: number, field: FlowField, rand: () => number) {
  const target = Math.min(n, p.x.length)
  for (let i = p.count; i < target; i++) spawn(p, i, field, rand, true)
  p.count = target
}

export function respawnAll(p: Particles, field: FlowField, rand: () => number) {
  for (let i = 0; i < p.count; i++) spawn(p, i, field, rand, true)
}

/** Advances every particle by dt: eases velocity toward the field (inertia), then moves. */
export function stepParticles(p: Particles, field: FlowField, dt: number, rand: () => number) {
  const ease = 1 - Math.exp(-dt / INERTIA_TAU)
  const w = field.width
  const h = field.height
  for (let i = 0; i < p.count; i++) {
    p.skip[i] = 0
    const x = p.x[i]
    const y = p.y[i]
    p.px[i] = x
    p.py[i] = y
    p.band[i] = field.sample(x, y, tmp)
    const vx = (p.vx[i] += (tmp.x - p.vx[i]) * ease)
    const vy = (p.vy[i] += (tmp.y - p.vy[i]) * ease)
    const nx = x + vx * dt
    const ny = y + vy * dt
    p.age[i] += dt
    if (p.age[i] > p.life[i] || nx < -2 || ny < -2 || nx > w + 2 || ny > h + 2) {
      spawn(p, i, field, rand)
    } else {
      p.x[i] = nx
      p.y[i] = ny
    }
  }
}
