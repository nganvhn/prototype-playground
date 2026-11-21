import { GRAPH } from "./data"
import type { Geometry } from "./types"

const Y_SPAN = GRAPH.yMax - GRAPH.yMin

/**
 * Lays out the graph in px. The 0–1 cell is ideally square; if that would exceed
 * `maxHeight`, phones flatten the y scale (full width kept) while desktop shrinks
 * the whole graph to stay square and centres it.
 */
export function computeGeometry(containerWidth: number, maxHeight: number, square: boolean): Geometry {
  const cellW = Math.max(0, containerWidth - GRAPH.padX * 2)
  const maxUnitY = Math.max(0, (maxHeight - GRAPH.padY * 2) / Y_SPAN)
  if (square) {
    const unit = Math.min(cellW, maxUnitY)
    const width = unit + GRAPH.padX * 2
    return {
      width,
      height: unit * Y_SPAN + GRAPH.padY * 2,
      left: GRAPH.padX,
      unitX: unit,
      unitY: unit,
    }
  }
  const unitY = Math.min(cellW, maxUnitY)
  return {
    width: containerWidth,
    height: unitY * Y_SPAN + GRAPH.padY * 2,
    left: GRAPH.padX,
    unitX: cellW,
    unitY,
  }
}

/** Curve space → px. */
export function toPx(g: Geometry, x: number, y: number): [number, number] {
  return [g.left + x * g.unitX, GRAPH.padY + (GRAPH.yMax - y) * g.unitY]
}

/** px → curve space (unclamped). */
export function fromPx(g: Geometry, px: number, py: number): [number, number] {
  return [(px - g.left) / g.unitX, GRAPH.yMax - (py - GRAPH.padY) / g.unitY]
}
