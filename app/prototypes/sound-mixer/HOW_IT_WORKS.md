# Sound Mixer — How It Works

## What It Does
A focus sound mixer with three ambient layers (rain, café, coloured noise), each with its own on/off and volume. Every sound is synthesized live with the Web Audio API; there are no audio files and no audio libraries.

## Architecture

```
 data.ts (controls, presets)          localStorage
        │                         ┌── playground:sound-mixer:controls
        ▼                         ├── playground:sound-mixer:layers
 useControls ── useLayers ────────┘
        │  values / layers
        ▼
 MixerPlayground ── PresetPicker (applies layers + settings)
        │
        ▼
 useMixEngine ── MixEngine (AudioContext lifecycle, scheduler, timer)
                     │
                     ▼
                 MixGraph
   RainLayer ─┐
   CafeLayer ─┼─ layer gain ─ master ─ fade ─ timer ─ warmth LPF ─ limiter ─ out
   NoiseLayer ┘
```

## Frontend
- **State**: control-panel values via the shared `useControls`; layer on/off + volume via `useLayers`. Both persist to namespaced localStorage, loaded on mount and validated.
- **Play/Pause**: a 96px round button. The `AudioContext` is created and resumed synchronously inside the tap handler (iOS/Safari autoplay rule). Until then, and whenever the system suspends audio, the UI shows "Paused".
- **Presets**: Deep focus, Rainy café, Sleep. A preset sets the three layers plus noise colour, rain intensity, café busyness, warmth and auto-stop (Sleep = 60 min). Master volume is untouched. The preset that matches the current mix exactly is highlighted.
- **Layers**: big sliders (12px track, 28px thumb, 44px+ hit area). Dragging a muted layer's slider turns it on. The noise card's title follows the noise colour.
- **Control panel**: master volume, noise colour, rain intensity, café busyness, warmth, auto-stop. Number readouts use the controls library's new optional `format` (e.g. "Drizzle" → "Downpour").
- **Auto-stop**: off / 15 / 30 / 60 / 90 min from when play is pressed (or when the timer is changed while playing). The final 10 s fade is automated on the audio clock, so it's exact even when JS timers are throttled. Status shows "Stops in m:ss", then "Fading out".
- **Background**: playback continues when the screen dims or the tab is hidden. The scheduler queues events 2 s ahead, which covers background timer throttling (≈1/s). Safari 17+ gets `navigator.audioSession.type = "playback"`; Media Session play/pause handlers give lock-screen/headphone controls where supported.
- **Closing**: `pagehide` (and unmount) closes the `AudioContext`, so audio stops cleanly.
- **Responsive**: single `max-w-2xl` column; controls beside it from `lg:`, bottom sheet below that.
- **Shortcuts**: none.

## Sound design
- **No clicks**: every gain/frequency change uses `setTargetAtTime` from the current value (`glide()`). Play fades in (τ 0.3 s), pause fades out (τ 0.12 s) and only then suspends the context. Noise buffers are 8 s loops whose tail is equal-power crossfaded into the head, so the loop point is seamless.
- **Noise**: white, pink (Paul Kellet filter) and brown (leaky integrator), stereo, RMS-normalised with per-colour trims. All three run; changing colour crossfades.
- **Rain**: pink bed (high-pass 450 Hz, low-pass 2.2–8.7 kHz) + brown rumble below 280 Hz + Poisson-scheduled droplets: band-passed noise ticks (1.2–7 kHz, 8–45 ms) and occasional rising-sine "plinks" (bubble resonance). Intensity drives drop rate (4 → 74/s), bed level/brightness and rumble.
- **Café**: brown room tone + 7 "voices": band-passed pink noise whose level and formant frequency move in syllable-sized steps (110–280 ms) during utterances, then pause. Busyness sets active voices (2–7), pause length and clink rate. Clinks are inharmonic sine partials (cup: 1, 2.32, 4.25, 6.63; cutlery: brighter, 1–3 quick hits). Voices and clinks go through a synthetic convolution room.
- **Warmth**: master low-pass, 18 kHz (bright) → 450 Hz (muffled), exponential.
- **Volume curve**: slider² for a perceptual taper. A soft limiter guards the sum.

## API
None.

## AI Usage
None.

## Key Dependencies
- Web Audio API (browser built-in)
- `@/components/controls` for the panel, persistence, Reset and Randomize
- shadcn/ui `Button`, `Slider`, `Switch`, `ToggleGroup`, `Label`
- `lucide-react` play/pause icons

## Component Tree
```
page.tsx
└─ MixerPlayground
   └─ PlaygroundLayout
      ├─ PlayButton
      ├─ PresetPicker
      ├─ LayerCard × 3 (Rain, Café, Noise)
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- No `AudioContext` (very old browser / SSR): play does nothing.
- System interruption (iOS call, another app): `statechange` flips the UI to Paused; tapping Play resumes.
- `resume()` / `suspend()` / `close()` rejections are swallowed; state is derived from our own flags.
- localStorage access is wrapped in try/catch; stored layers are validated per field and fall back to defaults.
- Scheduler resets its next-event time if it falls behind the audio clock (e.g. after throttling), instead of bursting a backlog.

## File Structure
```
sound-mixer/
├─ page.tsx               thin route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts               layers, settings, presets
├─ data.ts                control schema, presets, timing constants
├─ mix-math.ts            pure: gain curves, rain/café params, preset matching, validation
├─ noise.ts               pure: seeded PRNG, loopable white/pink/brown noise
├─ audio-utils.ts         Web Audio helpers: buffers, room impulse, glide
├─ rain-layer.ts          rain bed + droplet scheduler
├─ cafe-layer.ts          murmur voices + clinks + room
├─ noise-layer.ts         coloured noise with crossfade
├─ mix-graph.ts           full signal chain (works on any BaseAudioContext)
├─ mix-engine.ts          AudioContext lifecycle, scheduler tick, auto-stop
├─ use-mix-engine.ts      React binding, Media Session, pagehide
├─ use-layers.ts          persisted layer state
├─ mixer-playground.tsx   composes everything
├─ play-button.tsx
├─ preset-picker.tsx
└─ layer-card.tsx
```
