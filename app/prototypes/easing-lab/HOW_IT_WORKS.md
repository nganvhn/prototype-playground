# Easing Lab — How It Works

## What It Does
Drag the two handles of a cubic-bezier curve (or start from a preset), tap Play, and watch the curve drive three real UI entrances: a card sliding in, a modal scaling up and a toast dropping down. The result copies as a CSS `cubic-bezier()` value.

## Architecture

```
 data.ts (controls, presets, GRAPH constants)
        │
 useControls ──► localStorage (playground:easing-lab:controls)   duration / loop / demo
        │
 EasingLab ── bezier state (not persisted) ───────────────────────────┐
   │                                                                   │
   ├─ CurveGraph ── useGraphSize (container width + svh probe)         │
   │     └─ computeGeometry ─► GraphSvg (px space)                     │
   │          ├─ HTML hit areas: pointer / keys ─► clampPoint ────► setBezier
   │          └─ playhead rAF: solveEasing(run.bezier, t)              │
   ├─ ValueFields (x1 y1 x2 y2, editable, clamped) ────────────────► setBezier
   ├─ DemoStage ─► Card / Modal / Toast demo                           │
   │      └─ useEnterAnimation: el.animate(keyframes, { easing, duration })
   ├─ LabPanel (side panel ≥lg, inline below on phones)                │
   │      ├─ ActionButtons (≥lg) + CssValue                            │
   │      ├─ PresetPicker ─────────────────────────────────────────► setBezier
   │      └─ ControlPanel                                              ▼
   ├─ usePlayback(bezier, duration, loop) ──► Run { id, bezier, easing, duration, startedAt }
   │      └─ timer: duration + HOLD_MS → next Run (loop) or stop
   └─ fixed bottom bar (<lg): ActionButtons (Play/Stop, Copy CSS)
```

## Frontend
- **Curve state**: `[x1, y1, x2, y2]` held in `EasingLab`, deliberately not persisted (saving curves is out of scope). x is clamped to 0–1 (CSS requires it); y is clamped to the visible range −0.5…1.5 for overshoot and anticipation. Values round to 0.01.
- **Graph sizing** (`graph-geometry.ts`): the SVG is drawn in real pixels, with independent x and y scales, so handles stay round. A hidden probe sized `h-[40svh] lg:h-[52svh]` gives the height cap. Below `lg` the graph takes the full width and the y axis flattens to fit 40svh. From `lg` up the 0–1 cell stays square and the whole graph shrinks to 52svh, centred.
- **Dragging**: each handle has an invisible 46px-radius HTML hit area over the SVG with `touch-action: none`. A touch inside it drags the nearer handle and keeps the grab offset; a touch anywhere else on the graph scrolls the page. Pointer capture keeps the drag going outside the hit area.
- **Keyboard**: handles are focusable sliders; arrows nudge by 0.01, Shift+arrows by 0.1. Focus ring drawn at handle size.
- **Value fields**: `type="number"` (iOS gets a keyboard with a minus sign). The raw text is kept while focused so "-" or "0." can be typed; every parseable value commits clamped; blur or Enter tidies the text.
- **Playback**: Play snapshots the curve and duration into a `Run`. Each demo element calls `el.animate()` with `easing: "cubic-bezier(...)"`, so overshoot is rendered by the browser exactly as CSS would. The playhead dot follows the same timing via `solveEasing` in a rAF loop. With Loop on, Play becomes Stop and passes repeat after a 700ms hold. Edits mid-pass apply to the next pass.
- **Demos**: "All" puts three screens side by side; a single demo gets one wider/taller screen. Heights are in `svh` so everything fits on one phone screen.
- **Layout**: phone order is graph → values → demos → CSS value → presets → controls, above a fixed bottom bar (Play + Copy CSS, safe-area aware). Desktop: graph, values and demos on the left; Play/Copy, CSS value, presets and controls in the side panel. This uses `PlaygroundLayout mobilePanel="inline"` (panel below the content on phones, no floating sheet button).
- **Reduced motion**: Web Animations and the playhead are skipped; demos rest in their final state.

## Key Dependencies
- `lucide-react` (icons), shadcn `Button`, shared `components/controls`
- Web Animations API, `ResizeObserver`, `matchMedia`, Clipboard API (with `execCommand` fallback)

## Component Tree
```
EasingLabPage (page.tsx)
└─ EasingLab
   ├─ PlaygroundLayout (mobilePanel="inline")
   │  ├─ CurveGraph → GraphSvg (svg + HTML hit areas)
   │  ├─ ValueFields → ValueField ×4
   │  ├─ DemoStage → CardDemo | ModalDemo | ToastDemo → DemoScreen
   │  ├─ CssValue (phone)
   │  └─ LabPanel → ActionButtons (desktop), CssValue, PresetPicker, ControlPanel
   └─ bottom bar → ActionButtons (phone)
```

## Error Handling
- Clipboard: async API first, then a hidden-textarea `execCommand` fallback; the button shows "Copy failed" if both fail.
- Value fields ignore unparseable input and clamp everything else; stale control values from localStorage are sanitised by `useControls`.
- The graph renders a same-height placeholder until it has been measured, so nothing jumps on load.

## File Structure
```
easing-lab/
├─ page.tsx               metadata + <EasingLab />
├─ metadata.json
├─ types.ts               Bezier, Run, Geometry, DemoProps
├─ data.ts                controls, presets, GRAPH constants
├─ bezier.ts              clamp/format, toCss, solveEasing (pure)
├─ graph-geometry.ts      computeGeometry, toPx, fromPx (pure)
├─ clipboard.ts           copyText
├─ use-copy.ts            copy + status
├─ use-graph-size.ts      container width + svh probe height
├─ use-media-query.ts     useMediaQuery, useReducedMotion, useIsDesktop
├─ use-playback.ts        Run scheduling
├─ use-enter-animation.ts el.animate per Run
├─ easing-lab.tsx         page composition + bottom bar
├─ curve-graph.tsx        the graph
├─ value-fields.tsx       x1 y1 x2 y2 inputs
├─ css-value.tsx          cubic-bezier() readout
├─ action-buttons.tsx     Play/Stop + Copy CSS
├─ preset-picker.tsx
├─ lab-panel.tsx
├─ demo-stage.tsx, demo-screen.tsx
└─ card-demo.tsx, modal-demo.tsx, toast-demo.tsx
```
