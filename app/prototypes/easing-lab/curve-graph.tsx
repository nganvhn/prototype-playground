"use client"

import { useEffect, useRef, useState } from "react"
import { clampPoint, fromSvg, solveEasing, toSvg } from "./bezier"
import { GRAPH } from "./data"
import type { Bezier, Run } from "./types"

const W = GRAPH.unit + GRAPH.pad * 2
const H = GRAPH.unit * (GRAPH.yMax - GRAPH.yMin) + GRAPH.pad * 2
const HIT_RADIUS = 24
const HANDLE_RADIUS = 8

type Grab = { index: 0 | 1; pointerId: number; dx: number; dy: number }

export function CurveGraph({
  bezier,
  onChange,
  run,
  playing,
  reduced,
}: {
  bezier: Bezier
  onChange: (b: Bezier) => void
  run: Run | null
  playing: boolean
  reduced: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const grab = useRef<Grab | null>(null)
  const [dragging, setDragging] = useState<0 | 1 | null>(null)

  const [x1, y1, x2, y2] = bezier
  const p0 = toSvg(0, 0)
  const p3 = toSvg(1, 1)
  const h1 = toSvg(x1, y1)
  const h2 = toSvg(x2, y2)
  const [left, top] = toSvg(0, 1)
  const [right, bottom] = toSvg(1, 0)
  const [, plotTop] = toSvg(0, GRAPH.yMax)
  const [, plotBottom] = toSvg(0, GRAPH.yMin)

  // Playhead: a dot tracing the curve for the current pass.
  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return
    dot.style.opacity = "0"
    if (!run || !playing || reduced) return
    let frame = 0
    const tick = (now: number) => {
      const x = Math.min(1, (now - run.startedAt) / run.duration)
      const [sx, sy] = toSvg(x, solveEasing(run.bezier, x))
      dot.setAttribute("cx", String(sx))
      dot.setAttribute("cy", String(sy))
      dot.style.opacity = "1"
      if (x < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [run, playing, reduced])

  function localPoint(e: React.PointerEvent): [number, number] | null {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return [p.x, p.y]
  }

  function setHandle(index: 0 | 1, x: number, y: number) {
    const [cx, cy] = clampPoint(x, y)
    onChange(index === 0 ? [cx, cy, x2, y2] : [x1, y1, cx, cy])
  }

  function onPointerDown(index: 0 | 1, e: React.PointerEvent<SVGCircleElement>) {
    const p = localPoint(e)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const [hx, hy] = index === 0 ? h1 : h2
    // Keep the grab offset so the handle doesn't jump under the finger.
    grab.current = { index, pointerId: e.pointerId, dx: p[0] - hx, dy: p[1] - hy }
    setDragging(index)
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = grab.current
    if (!g || g.pointerId !== e.pointerId) return
    const p = localPoint(e)
    if (!p) return
    const [x, y] = fromSvg(p[0] - g.dx, p[1] - g.dy)
    setHandle(g.index, x, y)
  }

  function endDrag(e: React.PointerEvent) {
    if (grab.current?.pointerId !== e.pointerId) return
    grab.current = null
    setDragging(null)
  }

  function onKeyDown(index: 0 | 1, e: React.KeyboardEvent) {
    const step = GRAPH.step * (e.shiftKey ? 10 : 1)
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    const d = delta[e.key]
    if (!d) return
    e.preventDefault()
    const [hx, hy] = index === 0 ? [x1, y1] : [x2, y2]
    setHandle(index, hx + d[0], hy + d[1])
  }

  const handles = [
    { index: 0 as const, pos: h1, anchor: p0, x: x1, y: y1 },
    { index: 1 as const, pos: h2, anchor: p3, x: x2, y: y2 },
  ]

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto block h-auto w-full max-w-[calc(62svh*0.5536)] select-none"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="group"
      aria-label="Bezier curve editor"
    >
      {/* Overshoot zones */}
      <rect
        x={left}
        y={plotTop}
        width={GRAPH.unit}
        height={plotBottom - plotTop}
        className="fill-muted/40 stroke-border"
        strokeDasharray="3 4"
        strokeWidth={1}
      />
      {/* Unit square */}
      <rect
        x={left}
        y={top}
        width={GRAPH.unit}
        height={GRAPH.unit}
        className="fill-card stroke-border"
        strokeWidth={1}
      />
      {[0.25, 0.5, 0.75].map((g) => {
        const [gx] = toSvg(g, 0)
        const [, gy] = toSvg(0, g)
        return (
          <g key={g} className="stroke-border" strokeWidth={0.75}>
            <line x1={gx} y1={top} x2={gx} y2={bottom} />
            <line x1={left} y1={gy} x2={right} y2={gy} />
          </g>
        )
      })}
      {/* Linear reference */}
      <line
        x1={p0[0]}
        y1={p0[1]}
        x2={p3[0]}
        y2={p3[1]}
        className="stroke-muted-foreground/40"
        strokeDasharray="4 4"
        strokeWidth={1}
      />

      {/* Handle arms */}
      <g className="stroke-muted-foreground" strokeWidth={1.5}>
        <line x1={p0[0]} y1={p0[1]} x2={h1[0]} y2={h1[1]} />
        <line x1={p3[0]} y1={p3[1]} x2={h2[0]} y2={h2[1]} />
      </g>

      {/* Curve */}
      <path
        d={`M ${p0[0]} ${p0[1]} C ${h1[0]} ${h1[1]}, ${h2[0]} ${h2[1]}, ${p3[0]} ${p3[1]}`}
        className="fill-none stroke-foreground"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={p0[0]} cy={p0[1]} r={3.5} className="fill-foreground" />
      <circle cx={p3[0]} cy={p3[1]} r={3.5} className="fill-foreground" />

      {/* Playhead */}
      <circle
        ref={dotRef}
        r={6}
        cx={p0[0]}
        cy={p0[1]}
        className="pointer-events-none fill-chart-2 stroke-background"
        strokeWidth={2}
        style={{ opacity: 0 }}
      />

      {handles.map((h) => (
        <g key={h.index}>
          <circle
            cx={h.pos[0]}
            cy={h.pos[1]}
            r={dragging === h.index ? HANDLE_RADIUS + 3 : HANDLE_RADIUS}
            className="pointer-events-none fill-primary stroke-background"
            strokeWidth={2.5}
          />
          {/* Large invisible hit area (≥44px on a phone); only here is touch scrolling disabled. */}
          <circle
            cx={h.pos[0]}
            cy={h.pos[1]}
            r={HIT_RADIUS}
            tabIndex={0}
            role="slider"
            aria-label={`Handle ${h.index + 1}`}
            aria-valuetext={`x ${h.x}, y ${h.y}`}
            aria-valuenow={h.y}
            className="cursor-grab fill-transparent stroke-transparent outline-none focus-visible:stroke-ring active:cursor-grabbing"
            strokeWidth={2}
            style={{ touchAction: "none" }}
            onPointerDown={(e) => onPointerDown(h.index, e)}
            onKeyDown={(e) => onKeyDown(h.index, e)}
          />
        </g>
      ))}
    </svg>
  )
}
