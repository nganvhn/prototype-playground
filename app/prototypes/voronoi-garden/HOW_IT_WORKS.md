# Voronoi Garden — How It Works

## What It Does
A canvas of stained-glass cells, one per seed. Tap to plant a seed and its cell grows in from a point, pushing neighbours aside; long-press (or right-click) to remove a cell; drag a seed to move it. Cells gently breathe and slowly recolour, and the garden is saved on the device.

## Architecture

```
 data.ts (control schema, timings)        storage.ts ◄──► localStorage
        │                                      ▲   playground:voronoi-garden:garden
        ▼                                      │
 useControls ──► localStorage (…:controls)     │ load on mount / save on every edit
        │ values                               │
        ▼                                      │
 GardenPlayground ── Clear (clearToken) ──► GardenCanvas
                                             │  pointer events → Garden (garden.ts)
                                             │     plant / remove / move / clear / enforceMax
                                             ▼
                          rAF tick: garden.step(dt) ─► garden.sites(t, breathing)
                                             │            (resting pos + drift, eased scale)
                                             ▼
                          computeCells(sites)  geometry.ts
                             d3-delaunay neighbours ─► power-diagram half-plane clipping
                                             ▼
                          drawGarden(cells)    render.ts  (+ color.ts hues)
```

## Frontend
- **Geometry**: `computeCells` builds a *power diagram* (weighted Voronoi). d3-delaunay triangulates the displayed seed positions; each cell starts as the unit square and is clipped (Sutherland–Hodgman) by the power bisector against its Delaunay neighbours and their neighbours (every other seed when there are ≤ 40; settled cells far from any change use just their Delaunay neighbours, which is exact for plain Voronoi). A seed's weight is `−((1 − s)·nn² + (1 − s)⁴·(far² − nn²))` (nn/far = nearest/furthest neighbour distance, s = eased scale): at s = 1 the cell is an ordinary Voronoi cell, at s = 0 every bisector sits behind the seed so it vanishes, and in between its border towards the nearest neighbour sits at about s·nn/2, so size tracks the easing. Easing the scale is what makes cells grow from a point, push neighbours, and shrink away while neighbours fill in. Near the edges a growing cell is also bounded by a disc that widens to infinity at full size.
- **State**: the `Garden` class (plain TS) holds seeds with a resting position, colour seed, breathing phases and a `growing | alive | dying` phase with linear `life` progress, eased with `easeOutCubic` (no overshoot). Removing a seed mid-growth keeps the eased size continuous. Settings are read from a ref each frame, so tweaking them never resets the garden.
- **Interaction** (pointer events, `touch-action: none` on the canvas):
  - Tap (no movement) → plant at that point (ignored if right on top of another seed).
  - Press within 26px of a seed's pin and move > 8px → drag that seed; borders reflow live.
  - Hold 500ms without moving → remove the cell under the finger (short haptic tick if supported). The cell darkens progressively from 150ms so you can see the hold working.
  - Right-click → remove the cell under the cursor. `contextmenu` from touch long-press is ignored to avoid double removal.
  - **Clear** shrinks every cell away.
- **Max seeds**: past the limit, the oldest live seeds shrink away (also when the limit is lowered).
- **Breathing**: each seed drifts on its own slow Lissajous path; amplitude scales with typical cell spacing (`√(1/n)`) so borders pulse rather than seeds wandering.
- **Colour**: hue = base hue + spread × triangle-wave(colour seed + t × recolour speed × per-seed rate). Triangle wave spreads hues evenly across the range; at spread 360 it's a rainbow. Lightness/chroma come from `CELL_TONE` per theme with a small per-seed jitter.
- **Styles**: flat fill; soft radial gradient from the seed (lighter) to the edges (deeper); outline = a coloured band between each cell and an inset copy of it (even-odd fill, no clipping) over a faint tint. Borders are strokes in the `--background` token, read at runtime.
- **Rendering**: 2D canvas, square, DPR capped at 2. Borders and pins are batched into single paths; oklch colour strings are cached (canvas re-parses colour strings on every assignment). Geometry for 300 seeds takes under 1ms per frame. The loop only runs while something moves (breathing, recolouring, growth, a long-press); otherwise frames are drawn on demand.
- **Theme**: background token and tone re-read when `resolvedTheme` changes.
- **Reduced motion**: no loop; breathing and recolouring are frozen, plants/removals apply instantly, a static frame is redrawn after each change.
- **Responsive**: canvas fills the centred `max-w-2xl` column; controls beside it from `lg:`, bottom sheet below that. Clear is a 44px button.
- **Persistence**: `[{ x, y, h }]` (normalised position + colour seed), saved after every plant, removal, drag end, clear and max-seeds trim. First visit (nothing stored) gets a deterministic 14-seed starter garden. An emptied garden stays empty and shows "Tap to plant".
- **Shortcuts**: none.

## API
None.

## AI Usage
None.

## Key Dependencies
- `d3-delaunay` — Delaunay triangulation / neighbour lookup
- `@/components/controls` — control panel, persistence, Reset, Randomize
- `next-themes` — `resolvedTheme` for canvas colours
- shadcn/ui `Button`

## Component Tree
```
page.tsx
└─ GardenPlayground
   └─ PlaygroundLayout
      ├─ GardenCanvas (canvas + "Tap to plant" overlay)
      ├─ Button "Clear"
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- `localStorage` access is wrapped in try/catch; stored seeds are validated (finite numbers in 0..1, max 300), so corrupt data falls back to the starter garden.
- Degenerate triangulations (coincident or collinear seeds, a seed with no Delaunay neighbours) fall back to clipping against every seed; zero-length bisectors are skipped.
- Frame `dt` is clamped to 1/20 s so a backgrounded tab doesn't jump animations.
- If the 2D context is unavailable, the canvas effect exits early.

## File Structure
```
voronoi-garden/
├─ page.tsx                 thin route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts                 Seed, Site, Cell, settings types
├─ data.ts                  control schema, timings, tones, storage key
├─ easing.ts                easeOutCubic + inverse
├─ garden.ts                Garden state: plant/remove/move/step/sites, starter garden
├─ geometry.ts              power diagram via d3-delaunay + half-plane clipping
├─ color.ts                 per-seed hue over time, oklch helper
├─ render.ts                draws cells, borders, pins, press feedback
├─ storage.ts               load/save the garden
├─ garden-canvas.tsx        canvas, pointer interactions, animation loop
└─ garden-playground.tsx    composes controls + canvas + Clear
```
