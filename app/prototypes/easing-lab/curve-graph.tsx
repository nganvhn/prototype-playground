"use client"

import { useEffect, useRef, useState } from "react"
import { clampPoint, solveEasing } from "./bezier"
import { GRAPH } from "./data"
import { computeGeometry, fromPx, toPx } from "./graph-geometry"
import type { Bezier, Geometry, Run } from "./types"
import { useGraphSize } from "./use-graph-size"
import { useIsDesktop } from "./use-media-query"

type Grab = { index: 0 | 1; pointerId: number; dx: number; dy: number }

/**
 * The hero: full-width on phones with a flattened y axis (≤40svh), a square unit cell
 * on desktop (≤52svh). Height caps live in the probe's classes.
 */
export function CurveGraph(props: {
  bezier: Bezier
  onChange: (b: Bezier) => void
  run: Run | null
  playing: boolean
  reduced: boolean
}) {
  const { containerRef, probeRef, size } = useGraphSize()
  const desktop = useIsDesktop()
  const geometry = size ? computeGeometry(size.width, size.maxHeight, desktop) : null

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={geometry ? { height: geometry.height } : undefined}
    >
      <div
        ref={probeRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 h-[40svh] w-px lg:h-[52svh]"
      />
      {/* Before measuring, reserve roughly the final height so nothing jumps. */}
      {geometry ? <GraphSvg g={geometry} {...props} /> : <div className="h-[40svh] lg:h-[52svh]" />}
    </div>
  )
}

function GraphSvg({
  g,
  bezier,
  onChange,
  run,
  playing,
  reduced,
}: {
  g: Geometry
  bezier: Bezier
  onChange: (b: Bezier) => void
  run: Run | null
  playing: boolean
  reduced: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const grab = useRef<Grab | null>(null)
  const [dragging, setDragging] = useState<0 | 1 | null>(null)
  const [focused, setFocused] = useState<0 | 1 | null>(null)

  const [x1, y1, x2, y2] = bezier
  const p0 = toPx(g, 0, 0)
  const p3 = toPx(g, 1, 1)
  const h1 = toPx(g, x1, y1)
  const h2 = toPx(g, x2, y2)
  const [left, top] = toPx(g, 0, 1)
  const [right, bottom] = toPx(g, 1, 0)
  const [, plotTop] = toPx(g, 0, GRAPH.yMax)
  const [, plotBottom] = toPx(g, 0, GRAPH.yMin)

  // Playhead: a dot tracing the curve for the current pass, in step with the demos.
  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return
    dot.style.opacity = "0"
    if (!run || !playing || reduced) return
    let frame = 0
    const tick = (now: number) => {
      const x = Math.min(1, Math.max(0, (now - run.startedAt) / run.duration))
      const [sx, sy] = toPx(g, x, solveEasing(run.bezier, x))
      dot.setAttribute("cx", String(sx))
      dot.setAttribute("cy", String(sy))
      dot.style.opacity = "1"
      if (x < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [run, playing, reduced, g])

  function localPoint(e: React.PointerEvent): [number, number] | null {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return null
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  function setHandle(index: 0 | 1, x: number, y: number) {
    const [cx, cy] = clampPoint(x, y)
    onChange(index === 0 ? [cx, cy, x2, y2] : [x1, y1, cx, cy])
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const p = localPoint(e)
    if (!p) return
    // Hit areas can overlap when handles are close: grab whichever is nearer.
    const d1 = Math.hypot(p[0] - h1[0], p[1] - h1[1])
    const d2 = Math.hypot(p[0] - h2[0], p[1] - h2[1])
    const index = d1 <= d2 ? 0 : 1
    const [hx, hy] = index === 0 ? h1 : h2
    e.currentTarget.setPointerCapture(e.pointerId)
    // Keep the grab offset so the handle doesn't jump under the finger.
    grab.current = {
      index,
      pointerId: e.pointerId,
      dx: p[0] - hx,
      dy: p[1] - hy,
    }
    setDragging(index)
  }

  function onPointerMove(e: React.PointerEvent) {
    const gr = grab.current
    if (!gr || gr.pointerId !== e.pointerId) return
    const p = localPoint(e)
    if (!p) return
    const [x, y] = fromPx(g, p[0] - gr.dx, p[1] - gr.dy)
    setHandle(gr.index, x, y)
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
    { index: 0 as const, pos: h1, x: x1, y: y1 },
    { index: 1 as const, pos: h2, x: x2, y: y2 },
  ]

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label="Bezier curve editor"
      className="relative mx-auto overflow-hidden select-none"
      style={{ width: g.width, height: g.height }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg
        width={g.width}
        height={g.height}
        viewBox={`0 0 ${g.width} ${g.height}`}
        className="block"
        aria-hidden
      >
        {/* Overshoot zone */}
        <rect
          x={left}
          y={plotTop}
          width={right - left}
          height={plotBottom - plotTop}
          rx={6}
          className="fill-muted/50 stroke-border"
          strokeDasharray="3 4"
          strokeWidth={1}
        />
        {/* Unit cell */}
        <rect
          x={left}
          y={top}
          width={right - left}
          height={bottom - top}
          className="fill-card stroke-border"
          strokeWidth={1}
        />
        <g className="stroke-border" strokeWidth={0.75}>
          {[0.25, 0.5, 0.75].map((t) => {
            const [gx, gy] = toPx(g, t, t)
            return (
              <g key={t}>
                <line x1={gx} y1={top} x2={gx} y2={bottom} />
                <line x1={left} y1={gy} x2={right} y2={gy} />
              </g>
            )
          })}
        </g>
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
        <circle cx={p0[0]} cy={p0[1]} r={4} className="fill-foreground" />
        <circle cx={p3[0]} cy={p3[1]} r={4} className="fill-foreground" />

        {/* Playhead */}
        <circle
          ref={dotRef}
          r={7}
          cx={p0[0]}
          cy={p0[1]}
          className="pointer-events-none fill-chart-2 stroke-background"
          strokeWidth={2.5}
          style={{ opacity: 0 }}
        />

        {handles.map((h) => (
          <circle
            key={h.index}
            cx={h.pos[0]}
            cy={h.pos[1]}
            r={dragging === h.index ? GRAPH.handleRadius + 3 : GRAPH.handleRadius}
            className="pointer-events-none fill-primary stroke-background transition-[r] duration-150 ease-out"
            strokeWidth={3}
          />
        ))}
        {/* Focus ring drawn at handle size, not hit-area size. */}
        {focused !== null && (
          <circle
            cx={handles[focused].pos[0]}
            cy={handles[focused].pos[1]}
            r={GRAPH.handleRadius + 6}
            className="pointer-events-none fill-none stroke-ring"
            strokeWidth={2}
          />
        )}
      </svg>
      {/*
        Invisible touch areas around each handle, as HTML: Chromium ignores touch-action
        on SVG shapes. Only these block scrolling; anywhere else on the graph scrolls.
      */}
      {handles.map((h) => (
        <div
          key={h.index}
          tabIndex={0}
          role="slider"
          aria-label={`Handle ${h.index + 1}`}
          aria-valuetext={`x ${h.x}, y ${h.y}`}
          aria-valuenow={h.y}
          aria-valuemin={GRAPH.yMin}
          aria-valuemax={GRAPH.yMax}
          className="absolute cursor-grab rounded-full outline-none active:cursor-grabbing"
          style={{
            left: h.pos[0] - GRAPH.hitRadius,
            top: h.pos[1] - GRAPH.hitRadius,
            width: GRAPH.hitRadius * 2,
            height: GRAPH.hitRadius * 2,
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onKeyDown={(e) => onKeyDown(h.index, e)}
          onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible") ? h.index : null)}
          onBlur={() => setFocused(null)}
        />
      ))}
    </div>
  )
}
