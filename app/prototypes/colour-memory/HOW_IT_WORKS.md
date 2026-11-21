# Colour Memory — How It Works

## What It Does
A colour fills a big card for a couple of seconds, then disappears. You recreate it with hue, saturation and lightness sliders and get a 0–100 score based on perceptual colour difference (CIEDE2000), then a round total at the end. Best average per difficulty is saved on the device.

## Architecture

```
 data.ts (control schema, ranges, timings)
        │
        ▼
 useControls ──► localStorage (playground:colour-memory:controls)
        │ values (snapshotted into a Round on Start)
        ▼
 ColourMemoryGame ── phase state machine ─────────────────────────────┐
   idle ─Start─► preparing ─450ms─► showing ─displayMs─► recall        │
                    ▲                                     │ Submit     │
                    └──────── Next colour ◄── reveal ◄────┘            │
                                               │ last turn             │
                                               ▼                       │
                                            summary ─Play again─► preparing
        │
        ├─ colour.ts   generateTargets()  HSL → sRGB → Lab → ΔE00 → score
        ├─ best-scores.ts ──► localStorage (playground:colour-memory:best)
        ├─ ColourCard      (target / live guess / split reveal / summary stripes)
        ├─ HslSliders      (big gradient sliders)
        └─ RoundSummary    (total count-up, average, best, Play again)
```

## Frontend
- **Phases**: `idle → preparing → showing → recall → reveal → … → summary`. `preparing` (450 ms blank) and `showing` (display time) advance on timers in one effect; everything else advances on taps.
- **Round snapshot**: Start copies difficulty, display time and a freshly generated target list into `round`, so changing the panel mid-round never alters the round in progress. Play again uses the current panel settings.
- **Targets** (`generateTargets`):
  - *Easy*: any hue, saturation 65–100 %, lightness 40–65 % (vivid).
  - *Hard*: saturation 10–40 %, lightness 30–72 %, and every hue in the round sits within ±30° of one random base hue (muted, close-together tones).
- **Scoring**: target and guess are converted HSL → sRGB → linear RGB → XYZ (D65) → CIELAB, then compared with CIEDE2000 (verified against Sharma et al. test pairs). Score = `100 / (1 + (ΔE/10)²)`, rounded: ΔE 0 → 100, 5 → 80, 10 → 50, 20 → 20.
- **Best score**: the round's *average* (0–100) per difficulty, so rounds of different lengths compare fairly. Saved only when beaten; "New best" badge shows in the summary.
- **Sliders**: the shared `Slider` restyled via `data-slot` selectors: 40 px tall track, 36 px ring thumb, 48 px total touch height. Each track's gradient shows what moving that slider would produce given the other two values. Sliders start each turn at a neutral `hsl(180 50% 50%)` and are disabled while the colour is showing and during the reveal.
- **Card**: idle shows preview stripes from a fixed seed (changes with difficulty and count); showing has a draining bar; recall fills with your live colour; reveal splits target (left) / you (right); summary shows one stripe per turn, target on top, yours below, with scores under each.
- **Text on colour**: labels sit in `bg-background/80` pills, so they stay readable on any colour without computing a text colour.
- **Motion**: reveal split is a 550 ms clip-path animation and the score counts up over 900 ms, both with ease-out curves (no overshoot). The drain bar is linear. With `prefers-reduced-motion`, the split and bar don't animate and scores appear at their final value. Sections swap with `.collapse-grid` height transitions.
- **Responsive**: single `max-w-2xl` column; the card is 3:2. The panel is a side column from `lg:`, a bottom sheet below that; primary buttons keep right padding on mobile so the floating controls button never covers them.
- **Shortcuts**: none beyond the sliders' arrow keys.

## API
None.

## AI Usage
None.

## Key Dependencies
- `@/components/controls`: display time, colours per round and difficulty, with persistence, Reset and Randomize
- shadcn/ui `Slider`, `Button`, `Badge`, `Label`
- Web Animations API for the drain bar and reveal split

## Component Tree
```
page.tsx
└─ ColourMemoryGame
   └─ PlaygroundLayout
      ├─ ColourCard
      │  ├─ Stripes (idle preview / summary)
      │  ├─ DrainBar (showing)
      │  └─ Reveal (split + score count-up)
      ├─ HslSliders (in a collapse-grid)
      ├─ RoundSummary (in a collapse-grid)
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- All `localStorage` access is in try/catch; best scores are validated (finite numbers 0–100 per known difficulty), so stale or corrupt data falls back to "no best yet".
- Timers and animations are cleaned up on phase change or unmount, so leaving mid-turn can't fire a late transition.
- Achromatic colours (hue undefined in Lab) are handled by the CIEDE2000 zero-chroma rules.

## File Structure
```
colour-memory/
├─ page.tsx                thin route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts                Hsl, Phase, Round, TurnResult, BestScores
├─ data.ts                 control schema, difficulty ranges, timings, storage key
├─ colour.ts               pure logic: HSL→Lab, CIEDE2000, score, PRNG, target generation
├─ best-scores.ts          load/save bests
├─ use-count-up.ts         ease-out number animation hook
├─ colour-card.tsx         the big card in every phase
├─ hsl-sliders.tsx         large gradient H/S/L sliders
├─ round-summary.tsx       end-of-round total + Play again
└─ colour-memory-game.tsx  state machine, composes everything
```
