import { Delaunay } from "d3-delaunay"
import { BRUTE_FORCE_LIMIT } from "./data"
import type { Cell, Site } from "./types"

/**
 * Clips a convex polygon to the half-plane a·x + b·y ≤ c (Sutherland–Hodgman).
 * Polygons are flat [x0, y0, x1, y1, ...] arrays.
 */
export function clipHalfPlane(poly: number[], a: number, b: number, c: number): number[] {
  const out: number[] = []
  const n = poly.length / 2
  if (n === 0) return out
  let px = poly[poly.length - 2]
  let py = poly[poly.length - 1]
  let pIn = a * px + b * py <= c
  for (let i = 0; i < n; i++) {
    const x = poly[i * 2]
    const y = poly[i * 2 + 1]
    const inside = a * x + b * y <= c
    if (inside !== pIn) {
      const dp = a * px + b * py - c
      const dc = a * x + b * y - c
      const t = dp / (dp - dc)
      out.push(px + (x - px) * t, py + (y - py) * t)
    }
    if (inside) out.push(x, y)
    px = x
    py = y
    pIn = inside
  }
  return out
}

/** Approximates a disc around (cx, cy) by clipping with `sides` half-planes. */
function clipDisc(poly: number[], cx: number, cy: number, r: number, sides = 20): number[] {
  for (let k = 0; k < sides && poly.length; k++) {
    const ang = (k / sides) * Math.PI * 2
    const a = Math.cos(ang)
    const b = Math.sin(ang)
    poly = clipHalfPlane(poly, a, b, a * cx + b * cy + r)
  }
  return poly
}

/**
 * Power diagram (weighted Voronoi) of the sites inside the unit square.
 *
 * Each site gets a weight from its eased scale: at scale 1 the weight is 0 (a plain
 * Voronoi cell); at scale 0 it is negative enough that every bisector passes behind
 * the seed and the cell vanishes. Interpolating the weight is what makes a new cell
 * grow from a point and push its neighbours' borders aside, and a removed one shrink
 * while neighbours fill in.
 *
 * d3-delaunay supplies the triangulation; each cell is clipped against its Delaunay
 * neighbours and their neighbours (the two-ring covers the power-diagram neighbours
 * while weights change). Small gardens just clip against every other site.
 */
export function computeCells(sites: Site[]): Cell[] {
  const n = sites.length
  if (n === 0) return []
  const coords = new Float64Array(n * 2)
  for (let i = 0; i < n; i++) {
    coords[i * 2] = sites[i].px
    coords[i * 2 + 1] = sites[i].py
  }
  const delaunay = new Delaunay(coords)
  const ring1: number[][] = Array.from({ length: n }, (_, i) => Array.from(delaunay.neighbors(i)))

  // Weight from nearest (nn) and furthest (far) neighbour distances. The cell's border
  // towards its nearest neighbour sits at roughly scale · nn / 2, so the cell's size tracks
  // the eased scale; the (1 − scale)⁴ term pushes every bisector behind the seed at scale 0.
  const weights = new Float64Array(n)
  const reach = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const k = 1 - sites[i].scale
    if (k === 0) continue
    let near = Infinity
    let far = 0
    for (const j of ring1[i]) {
      const d = Math.hypot(sites[j].px - sites[i].px, sites[j].py - sites[i].py)
      near = Math.min(near, d)
      far = Math.max(far, d)
    }
    if (far === 0) near = far = 1
    reach[i] = far
    weights[i] = -(k * near * near + k ** 4 * (far * far - near * near)) * 1.02
  }

  // Only seeds whose own weight (or a neighbour's) is changing need the wider two-ring
  // search; with all weights 0 the Delaunay neighbours are exactly the Voronoi neighbours.
  const brute = n <= BRUTE_FORCE_LIMIT
  const settled = (i: number) => sites[i].scale >= 1 && ring1[i].every((j) => sites[j].scale >= 1)
  const cells: Cell[] = []
  const seen = new Int32Array(n).fill(-1)

  for (let i = 0; i < n; i++) {
    const s = sites[i]
    if (s.scale <= 0.002) continue

    let candidates: number[]
    if (!brute && ring1[i].length > 0 && settled(i)) {
      candidates = ring1[i]
    } else if (brute || ring1[i].length === 0) {
      candidates = []
      for (let j = 0; j < n; j++) if (j !== i) candidates.push(j)
    } else {
      candidates = []
      seen[i] = i
      for (const j of ring1[i]) {
        if (seen[j] !== i) {
          seen[j] = i
          candidates.push(j)
        }
        for (const k of ring1[j]) {
          if (seen[k] !== i) {
            seen[k] = i
            candidates.push(k)
          }
        }
      }
    }

    let poly = [0, 0, 1, 0, 1, 1, 0, 1]
    const xi = s.px
    const yi = s.py
    const wi = weights[i]
    for (const j of candidates) {
      const xj = sites[j].px
      const yj = sites[j].py
      // |x − pi|² − wi ≤ |x − pj|² − wj  ⇔  2(pj − pi)·x ≤ |pj|² − |pi|² + wi − wj
      const a = 2 * (xj - xi)
      const b = 2 * (yj - yi)
      if (a === 0 && b === 0) continue
      const c = xj * xj + yj * yj - xi * xi - yi * yi + wi - weights[j]
      poly = clipHalfPlane(poly, a, b, c)
      if (poly.length === 0) break
    }

    // Near the edge a growing cell isn't surrounded by bisectors, so also bound it by a
    // disc that widens to infinity as it reaches full size.
    if (poly.length && s.scale < 1) {
      const r = ((reach[i] || 1) * 2 * s.scale) / (1 - s.scale + 1e-3)
      poly = clipDisc(poly, xi, yi, r)
    }
    if (poly.length >= 6) cells.push({ site: s, poly })
  }
  return cells
}

/** Index of the site nearest to (x, y), ignoring sites `skip` rejects; −1 if none. */
export function nearestSite(sites: Site[], x: number, y: number, skip: (s: Site) => boolean) {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i]
    if (skip(s)) continue
    const d = (s.px - x) ** 2 + (s.py - y) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/** Shrinks a convex polygon inwards by `d` (same units as the polygon). */
export function insetPolygon(poly: number[], d: number): number[] {
  const n = poly.length / 2
  // Orientation decides which side of each edge is "inside".
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += poly[i * 2] * poly[j * 2 + 1] - poly[j * 2] * poly[i * 2 + 1]
  }
  const sign = area >= 0 ? 1 : -1
  let out = poly
  for (let i = 0; i < n && out.length; i++) {
    const j = (i + 1) % n
    const ex = poly[j * 2] - poly[i * 2]
    const ey = poly[j * 2 + 1] - poly[i * 2 + 1]
    const len = Math.hypot(ex, ey)
    if (len === 0) continue
    // Outward normal for this orientation, then keep points at least d inside the edge.
    const nx = (sign * ey) / len
    const ny = (-sign * ex) / len
    out = clipHalfPlane(out, nx, ny, nx * poly[i * 2] + ny * poly[i * 2 + 1] - d)
  }
  return out
}
