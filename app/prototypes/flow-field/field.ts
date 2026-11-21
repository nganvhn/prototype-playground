import { BAND_COUNT, BASE_SPEED, CELLS_PER_SIDE, FIELD_DRIFT, MIN_CELL, OCTAVE2 } from "./data"
import type { Noise3D } from "./noise"

/**
 * Velocity field on a coarse grid of nodes, in CSS px per second.
 * Base flow is the curl of a slowly drifting noise potential ψ, so it's
 * divergence-free: streams spread out evenly instead of bunching into ropes.
 */
export class FlowField {
  width = 0
  height = 0
  /** Short side of the canvas; sizes are expressed relative to it. */
  short = 1
  cell = MIN_CELL
  cols = 0
  rows = 0
  vx = new Float32Array(0)
  vy = new Float32Array(0)
  /** 0..1 colour band coordinate per node. */
  band = new Float32Array(0)
  private psi = new Float32Array(0)

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.short = Math.max(1, Math.min(width, height))
    this.cell = Math.max(MIN_CELL, this.short / CELLS_PER_SIDE)
    this.cols = Math.ceil(width / this.cell) + 1
    this.rows = Math.ceil(height / this.cell) + 1
    const n = this.cols * this.rows
    this.vx = new Float32Array(n)
    this.vy = new Float32Array(n)
    this.band = new Float32Array(n)
    this.psi = new Float32Array((this.cols + 2) * (this.rows + 2))
  }

  /** Recomputes the undisturbed current at flow time `t`. */
  computeBase(t: number, noiseScale: number, speed: number, noise: Noise3D) {
    const { cols, rows, cell, psi, short } = this
    const pw = cols + 2
    const inv = 1 / short
    const f = noiseScale
    const z = t * FIELD_DRIFT.z
    const shift = t * FIELD_DRIFT.x

    // Potential ψ on a padded grid (one extra node each side for central differences).
    for (let j = 0; j < rows + 2; j++) {
      const y = (j - 1) * cell * inv
      for (let i = 0; i < pw; i++) {
        const x = (i - 1) * cell * inv
        const u = x * f + shift
        const v = y * f
        const n1 = noise(u, v, z)
        const n2 = noise(u * OCTAVE2.freq + 17.3, v * OCTAVE2.freq - 9.1, z * 1.7 + 4)
        // Low-frequency amplitude: the current is faster in some places than others.
        const m = 0.7 + 0.5 * noise(x * 0.7 + 31.7, y * 0.7 - 5.2, t * 0.025 + 11)
        psi[j * pw + i] = m * (n1 + OCTAVE2.amp * n2)
      }
    }

    // v = curl ψ = (∂ψ/∂y, −∂ψ/∂x), scaled so typical speed ≈ BASE_SPEED·S·speed
    // whatever the noise scale.
    const k = ((short * short) / f) * BASE_SPEED * speed / (2 * cell)
    for (let j = 0; j < rows; j++) {
      const r = (j + 1) * pw
      const y = j * cell * inv
      for (let i = 0; i < cols; i++) {
        const c = r + i + 1
        const idx = j * cols + i
        this.vx[idx] = (psi[c + pw] - psi[c - pw]) * k
        this.vy[idx] = -(psi[c + 1] - psi[c - 1]) * k
        const b = noise(i * cell * inv * 0.8 + 70.1, y * 0.8 + t * 0.01, t * 0.015 + 3)
        this.band[idx] = Math.min(0.9999, Math.max(0, 0.5 + 0.85 * b))
      }
    }
  }

  /** Bilinear sample of velocity at (x, y) into `out`; returns the band index. */
  sample(x: number, y: number, out: { x: number; y: number }): number {
    const { cols, rows, cell } = this
    const gx = Math.min(Math.max(x / cell, 0), cols - 1.001)
    const gy = Math.min(Math.max(y / cell, 0), rows - 1.001)
    const i = gx | 0
    const j = gy | 0
    const fx = gx - i
    const fy = gy - j
    const a = j * cols + i
    const b = a + 1
    const c = a + cols
    const d = c + 1
    const w00 = (1 - fx) * (1 - fy)
    const w10 = fx * (1 - fy)
    const w01 = (1 - fx) * fy
    const w11 = fx * fy
    out.x = this.vx[a] * w00 + this.vx[b] * w10 + this.vx[c] * w01 + this.vx[d] * w11
    out.y = this.vy[a] * w00 + this.vy[b] * w10 + this.vy[c] * w01 + this.vy[d] * w11
    const band = this.band[a] * w00 + this.band[b] * w10 + this.band[c] * w01 + this.band[d] * w11
    return (band * BAND_COUNT) | 0
  }
}
