# Particle Orbits — How It Works

## What It Does
Draws hundreds of particles orbiting a centre point on a canvas, with inner particles moving faster (roughly Keplerian). A control panel tunes count, speed, size, hue, layout and trails.

## Architecture

```
 data.ts (control schema)
        │
        ▼
 useControls ──► localStorage  (playground:particle-orbits:controls)
        │
        ▼ values
 OrbitsPlayground ──► ControlPanel (side panel ≥lg, bottom sheet <lg)
        │
        ▼ settings
 OrbitCanvas
   ├─ createParticles(count, layout, seededRand)   simulation.ts
   └─ rAF loop: step(particles, dt, speed) ─► draw to <canvas>
```

## Frontend
- **State**: control values live in `useControls` (shared library), persisted per prototype and loaded on mount. Particles are recreated only when `count` or `layout` change; speed/size/hue/trails are read from a ref each frame, so tweaking them never resets the field.
- **Rendering**: 2D canvas, sized by `ResizeObserver`, device-pixel-ratio capped at 2. Trails = translucent background fill each frame instead of a full clear.
- **Theme**: canvas can't use Tailwind classes, so the background reads the `--background` CSS token at runtime and particle lightness switches on `resolvedTheme`. The effect re-runs on theme change.
- **Motion**: with `prefers-reduced-motion`, a single static frame is drawn and no animation loop runs.
- **Responsive**: square canvas fills the centred `max-w-2xl` column. Controls sit to the side from `lg:`; below that, a floating 48px button opens a bottom sheet.
- **Shortcuts**: none.

## API
None.

## AI Usage
None.

## Key Dependencies
- `@/components/controls` — schema-driven control panel, persistence, Reset, Randomize
- `next-themes` — `resolvedTheme` for canvas colours
- shadcn/ui `Slider`, `Switch`, `ToggleGroup`, `Drawer` (via the controls library)

## Component Tree
```
page.tsx
└─ OrbitsPlayground
   └─ PlaygroundLayout
      ├─ OrbitCanvas
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- `localStorage` reads/writes are wrapped in try/catch; stored values are sanitised against the schema, so stale or corrupt data falls back to defaults.
- If the 2D context is unavailable, the canvas effect exits early.
- Frame `dt` is clamped to 1/20 s so a backgrounded tab doesn't jump the simulation.

## File Structure
```
particle-orbits/
├─ page.tsx               thin route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts               Particle, OrbitSettings
├─ data.ts                control schema + constants
├─ simulation.ts          pure logic: PRNG, createParticles, step, toCanvas
├─ orbit-canvas.tsx       canvas + animation loop
└─ orbits-playground.tsx  composes controls + layout + canvas
```
