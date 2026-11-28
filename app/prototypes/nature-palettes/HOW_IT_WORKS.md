# Nature Palettes — How It Works

## What It Does
Generates two- or three-colour palettes from a curated set of 54 combinations found in nature (food, sea and sky, forest, desert, flowers, minerals, animals, seasons). Each one is shown with a reference photo of its subject from Unsplash, large tap-to-copy swatches, and can be saved as a favourite on the device.

## Architecture

```
 data.ts ── COMBINATIONS (54) + control schema
    │
    ▼
 PalettesPlayground ── useControls ──► localStorage  playground:nature-palettes:controls
    │   history[] + index (session only)      favourites ──► playground:nature-palettes:favourites
    │
    │ Generate ─► pickCombination(count, families, recentIds)   palette.ts (pure)
    ▼
 PaletteCard
   ├─ ReferencePhoto ── usePhoto(id) ──► GET /api/nature-palettes/photo?id=…
   │                                         │  searchPhoto(query)  "use cache" (weeks)
   │                                         ▼
   │                                     api.unsplash.com/search/photos  (UNSPLASH_ACCESS_KEY)
   │     img onLoad ─► POST /api/nature-palettes/photo/download { id } ─► /photos/:id/download
   └─ Swatches ── tap ─► clipboard + toast
```

## Frontend
- **Generating**: candidates must have exactly the chosen number of colours. With family filters, a combination must contain every selected family; if none does, the combinations matching the most families are used and the card says "Closest match to your filters". The last 12 results are avoided, and the one on screen is never repeated.
- **History**: every result is appended to an in-memory history. Prev/next buttons (always visible), arrow keys, and horizontal swipe (pointer events, 50px threshold, `touch-action: pan-y`) move through it. A click that ends a swipe is swallowed so a swatch isn't copied by accident.
- **First render**: before the first Generate, the first matching combination is shown, so server and client render the same thing.
- **Swatches**: three layouts (stripes, circles, blocks with the first colour dominant). Each shows its colour name and hex in black or white, whichever has the higher WCAG contrast ratio. Tapping copies the hex; "Copy all" copies `#AAAAAA, #BBBBBB[, #CCCCCC]`. Colours transition with `ease-out` when the result changes.
- **Photo**: 4:3, hotlinked from Unsplash (imgix crop params on the raw URL). A soft gradient of the palette sits underneath, so it shows while loading and stays when there's no photo; the image fades in on load and is removed if it fails.
- **Favourites**: heart toggles the current combination. The "Favourites" button in the header opens an inline list (animated with `.collapse-grid`); tap a row to show it, × to remove.
- **Controls**: colours per combination (2/3), colour families (multi-select, max 3; new shared `multi` control type), swatch layout. Reset and Randomize from the shared panel.
- **Responsive**: single `max-w-2xl` column; controls in a side panel from `lg:`, bottom sheet below. All tap targets are ≥44px; "Copy all" is icon-only below `sm:`.

## API
- `GET /api/nature-palettes/photo?id=<combination id>`
  - `200 { photo: { id, src, alt, author: { name, url }, unsplashUrl } }`
  - `400 { error }` unknown id (only curated subjects can be searched), `503` no key set, `404` no result, `502` Unsplash failed.
  - The Unsplash search is wrapped in `"use cache"` with `cacheLife("weeks")`, keyed by query, so each subject costs one API call per server cache. Errors throw and are never cached. The browser also caches per id for the visit.
- `POST /api/nature-palettes/photo/download` `{ id }` → `204`. Calls Unsplash's download endpoint (required when a photo is displayed). Fired once per photo per visit, after the image loads.
- The access key stays server-side (`UNSPLASH_ACCESS_KEY`). Attribution links carry `utm_source=prototype_playground&utm_medium=referral`.

## AI Usage
None.

## Key Dependencies
- Unsplash API (search + download tracking)
- `@/components/controls`: panel, persistence, Reset, Randomize, `multi` control type
- shadcn/ui `Button`, `Badge`, `ToggleGroup`; `sonner` for copy toasts; `lucide-react` icons

## Component Tree
```
page.tsx
└─ PalettesPlayground
   └─ PlaygroundLayout
      ├─ header: title + Favourites button
      ├─ FavouritesList (collapse-grid)
      ├─ PaletteCard (swipe area)
      │  ├─ ReferencePhoto → PhotoImage
      │  ├─ name / source / category, heart, Copy all
      │  └─ Swatches
      ├─ Prev · Generate · Next
      └─ ControlPanel (aside on desktop, Drawer on mobile)
```

## Error Handling
- No key, failed search, no result, or an image that fails to load: the palette gradient stays and no attribution is shown. Nothing broken is ever rendered.
- API handlers are wrapped in try/catch and return `{ error }` with 400/404/502/503.
- Clipboard failures show an error toast.
- `localStorage` access is wrapped in try/catch; favourites are filtered to known ids, controls are sanitised against the schema.

## File Structure
```
nature-palettes/
├─ page.tsx                 route entry + metadata
├─ metadata.json
├─ HOW_IT_WORKS.md
├─ types.ts                 Colour, Combination, Photo, settings
├─ data.ts                  54 combinations, families, control schema, constants
├─ palette.ts               pure: candidates, pickCombination, contrast, gradient
├─ favourites.ts            localStorage load/save
├─ clipboard.ts             copy + toast
├─ use-photo.ts             photo fetch cache + download ping
├─ use-swipe.ts             horizontal swipe handlers
├─ palettes-playground.tsx  state, history, controls, layout
├─ palette-card.tsx         photo + title + actions + swatches
├─ reference-photo.tsx      photo, gradient fallback, attribution
├─ swatches.tsx             three swatch layouts, tap to copy
└─ favourites-list.tsx      saved palettes list

app/api/nature-palettes/
├─ unsplash.ts              server-only Unsplash helpers (cached search, download)
├─ photo/route.ts           GET photo for a combination
└─ photo/download/route.ts  POST download event
```
