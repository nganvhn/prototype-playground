# Flow Field — How It Works

## What It Does
Thousands of particles drift along invisible, water-like currents on a full-width canvas, leaving silky trails that fade into a hue-tinted water colour. Tap to drop a splash that turns into a whirlpool; press and drag to stir the water.

## Architecture

```
 data.ts (control schema + tuning constants)
        │
        ▼
 useControls ──► localStorage (playground:flow-field:controls)
        │ values
        ▼
 FlowPlayground ──► ControlPanel (side panel ≥lg, bottom sheet <lg)
        │
        ▼ settings (ref, read every frame)
 FlowCanvas  ── pointer events ──► engine.tap / engine.stir / engine.clear
        │
        ▼ rAF loop: engine.frame(dt, settings)
 FlowEngine (engine.ts)
   ├─ batched fade toward water colour            (MIN_FADE)
   ├─ FlowField.computeBase: ψ = noise (2 octaves × slow amplitude)
   │     on a coarse grid → v = curl ψ            field.ts + noise.ts
   ├─ applyDisturbances: splash, whirlpools, stirs → grid      disturbances.ts
   ├─ stepParticles: bilinear sample + inertia + respawn       particles.ts
   └─ draw: bucket particles by colour band, one stroke per band
```

## Frontend
- **Flow**: velocity is the curl of a scalar noise potential ψ (simplex 3D), so it's divergence-free and particles spread evenly instead of bunching. ψ = slow amplitude field × (base octave + 0.35 × finer octave at 2.3× frequency). The amplitude field makes the current faster in some places. ψ drifts through the noise's z axis and slides sideways slowly, so the currents meander. Speed is normalised by noise scale so "swirly" doesn't mean "faster".
- **Grid**: the field lives on a grid of ~12–14 px cells (≈50 across the short side), recomputed every frame; particles sample it bilinearly. Disturbances are added to the grid, not per particle, so their cost doesn't scale with particle count.
- **Particles**: structure-of-arrays (`Float32Array`s). Velocity eases toward the field with a 0.22 s time constant (inertia). Each lives 4–10 s, then respawns at a uniform random spot; leaving the canvas also respawns. A respawned particle skips one frame of drawing so no line jumps across the canvas.
- **Colour**: a separate low-frequency noise gives each grid node a 0..1 band coordinate, quantised into 9 bands across the hue spread. Particles take the band of where they are now, so colours form drifting bands, not speckles. All 9 band colours and the water background are computed from OKLCH in `color.ts` (dark: deep water L 0.2; light: pale water L 0.965). These are data colours driven by the Hue control.
- **Trails**: each frame wants a fade with half-life 0.12 s (Trail 1) to ~6 s (Trail 10). Fades are multiplied together and only painted once they add up to ≥10% opacity: an 8-bit canvas fading by alpha `a` stalls `0.5/a` levels short of the target, so tiny per-frame fades leave grey ghosts.
- **Tap**: a splash (outward ring push, 0.7 s) then a whirlpool of radius 0.34 × short side: tangential speed peaks at 38% of the radius, an outward push keeps the eye open, a gentle inflow pulls the outer ring in, and the background current is damped inside. Envelope: ramps in 0.25–1 s, holds, fades out 3.5–5.5 s (smoothstep). Random spin direction. Max 5; the oldest is dropped.
- **Drag**: after 8 px of travel a press becomes a stir. Every ≥4 px the pointer velocity (smoothed, capped) is pushed into the grid as a Gaussian impulse, weighted by distance travelled so a stroke's total push doesn't depend on event rate. Each impulse fades out over 2.5 s. `touch-action: none` stops the page from scrolling while stirring.
- **Clear**: wipes trails and disturbances and respawns the particles (button bottom-right of the canvas; icon-only below `sm`).
- **Performance**: device-pixel ratio capped at 1.5 on touch devices (2 on desktop); particles capped at 3000 on touch devices (`pointer: coarse`) whatever the slider says. All segments of a band go in one path → 9 `stroke()` calls per frame. Frame `dt` is clamped to 1/30 s.
- **Startup**: 50 frames are simulated instantly on start, resize and theme change so the canvas opens already full of trails (also makes a good thumbnail).
- **Reduced motion**: no animation loop. A deterministic still frame (200 simulated steps) is drawn on load and redrawn when a control changes, on tap (whirlpools shown at full strength) and on Clear. Dragging does nothing.
- **Theme**: `resolvedTheme` picks deep vs pale water; the engine restarts on theme change.
- **Responsive**: canvas is 64vh tall, edge to edge below `lg` (negative margin over the layout padding), filling the main column with rounded corners beside the side panel from `lg`.
- **Shortcuts**: none.

## API
None.

## AI Usage
None.

## Key Dependencies
- `@/components/controls`: schema-driven control panel, persistence, Reset, Randomize. This prototype added the generic `swatch` option on number controls (used for the hue-spread gradient).
- `next-themes`: `resolvedTheme` for canvas colours
- shadcn/ui `Button`; `Slider`, `Drawer` via the controls library
- `lucide-react`: eraser icon

## Component Tree
```
page.tsx
└─ FlowPlayground
   └─ PlaygroundLayout
      ├─ FlowCanvas (canvas + Clear button, drives FlowEngine)
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- If a 2D context can't be created, the engine constructor throws and the canvas effect exits (the canvas stays its muted placeholder colour).
- `localStorage` access is in the shared `useControls` hook: try/catch, loaded on mount, sanitised against the schema.
- Zero-size canvas (hidden/collapsed) skips the resize; a later ResizeObserver callback restarts it.
- Disturbance counts are capped (5 whirlpools, 90 stir samples) and drag speed is clamped so a wild fling can't blow up the field.

## File Structure
```
flow-field/
├─ page.tsx               thin route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts               settings, palette, particle + disturbance types
├─ data.ts                control schema + all tuning constants
├─ noise.ts               seeded PRNG + 3D simplex noise
├─ color.ts               OKLCH → sRGB, palette (water + band colours)
├─ field.ts               FlowField: curl-noise grid, bilinear sampling
├─ disturbances.ts        splash, whirlpool, stir contributions to the grid
├─ particles.ts           particle arrays, spawn, step with inertia
├─ engine.ts              FlowEngine: frame loop, fades, drawing, tap/stir/clear
├─ flow-canvas.tsx        canvas element, rAF loop, pointer handling, Clear button
└─ flow-playground.tsx    composes controls + layout + canvas
```
