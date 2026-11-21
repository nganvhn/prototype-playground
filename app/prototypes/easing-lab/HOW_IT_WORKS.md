# Easing Lab — How It Works

## What It Does
Drag the two handles of a cubic-bezier curve (or start from a preset), tap Play, and watch the curve drive three real UI entrances: a card sliding in, a modal scaling up and a toast dropping down. The result copies as a CSS `cubic-bezier()` value.

## Architecture

```
 data.ts (controls, presets, graph geometry)
        │
        ▼
 useControls ──► localStorage (playground:easing-lab:controls)   duration / loop / demo
        │
 EasingLab ── bezier state (not persisted) ─────────────┐
   │                                                     │
   ├─ CurveGraph ── pointer / keys ─► clampPoint ─► setBezier
   │      └─ playhead rAF: solveEasing(run.bezier, t)    │
   ├─ CurveReadout (x1 y1 x2 y2, toCss, copy)            │
   ├─ PresetPicker ─────────────────────────────────► setBezier
   │                                                     ▼
   ├─ usePlayback(bezier, duration, loop) ──► Run { id, bezier, easing, duration, startedAt }
   │      └─ timer: duration + HOLD_MS → next Run (loop) or stop
   └─ DemoStage ─► CardDemo / ModalDemo / ToastDemo
                    └─ useEnterAnimation: el.animate(keyframes, { easing, duration })
```

## Frontend
- **Curve state**: `[x1, y1, x2, y2]` held in `EasingLab`, deliberately not persisted (saving curves is out of scope). x is clamped to 0–1 (CSS requires it); y is clamped to the visible range −0.5…1.5 so overshoot and anticipation are possible. Values round to 0.01.
- **Graph**: SVG; the solid square is the 0–1 unit area, the dashed band above and below is the overshoot zone. Each handle has a 24-unit invisible hit circle (≈44px+ on a phone) with `touch-action: none`, so dragging a handle never scrolls the page, while the rest of the graph still scrolls normally. The grab offset is kept so the handle doesn't jump under the finger. Height is capped at ~62svh so the graph doesn't swallow a phone screen.
- **Keyboard**: handles are focusable; arrows nudge by 0.01, Shift+arrows by 0.1.
- **Playback**: each pass snapshots the curve into a `Run`, so dragging during a loop changes the *next* pass. Loop waits `HOLD_MS` (700ms) at the end of each pass. With loop on, the button becomes Stop.
- **Demos**: Web Animations API with the run's `cubic-bezier()` easing and `fill: "backwards"`; between passes elements rest in their end state. A playhead dot traces the curve on the graph during each pass.
- **Responsive**: phone — stacked (graph, readout, demos, presets) with a sticky full-width Play button at the bottom for one-handed use, leaving room for the controls button. `sm:` — graph and demos side by side. `lg:` — control panel to the side, Play button inline.
- **Reduced motion**: demos skip animation (end state shown) and the playhead loop doesn't run; the WAAPI isn't covered by the global CSS rule so this is checked in JS.
- **Theme**: all colours are tokens (SVG uses `fill-*`/`stroke-*` utilities).

## API
None.

## AI Usage
None.

## Key Dependencies
- `@/components/controls` — duration / loop / demo panel with persistence, Reset, Randomize
- shadcn/ui `Button` (plus `Slider`, `Switch`, `ToggleGroup`, `Drawer` via the controls library)
- `lucide-react` icons

## Component Tree
```
page.tsx
└─ EasingLab
   └─ PlaygroundLayout
      ├─ CurveGraph
      ├─ CurveReadout
      ├─ DemoStage
      │  ├─ CardDemo  ─┐
      │  ├─ ModalDemo  ├─ DemoScreen + SkeletonRows
      │  └─ ToastDemo ─┘
      ├─ PresetPicker
      ├─ Play / Stop button
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- Control values are loaded from localStorage in try/catch and sanitised against the schema (shared library).
- Copy uses the async clipboard API, falls back to `execCommand("copy")`, and shows "Failed" if both fail.
- Handle x is always clamped to 0–1, so the easing string passed to `element.animate` is always valid.
- `solveEasing` uses Newton–Raphson with a bisection fallback, so flat x-slopes never stall the playhead.

## File Structure
```
easing-lab/
├─ page.tsx               thin route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts               Bezier, Preset, DemoKind, Run
├─ data.ts                control schema, presets, graph geometry, constants
├─ bezier.ts              pure logic: clamping, formatting, toCss, solveEasing, SVG mapping
├─ use-playback.ts        play / loop / stop timing
├─ use-enter-animation.ts per-run WAAPI animation
├─ use-reduced-motion.ts  prefers-reduced-motion subscription
├─ curve-graph.tsx        SVG editor + playhead
├─ curve-readout.tsx      handle numbers + CSS value + copy
├─ preset-picker.tsx      preset chips
├─ demo-stage.tsx         lays out the selected demos
├─ demo-screen.tsx        phone frame + skeleton rows
├─ card-demo.tsx
├─ modal-demo.tsx
├─ toast-demo.tsx
└─ easing-lab.tsx         composes everything
```
