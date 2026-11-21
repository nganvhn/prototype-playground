<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Prototype Playground — Rules for Agents

This repo is a personal playground: one Next.js app holding many small, self-contained prototypes. The owner asks for new prototypes from their phone. **Read this whole file before doing anything.** Every rule here is non-negotiable unless the owner explicitly overrides it for a specific task.

## Stack at a glance

- Next.js 16 (App Router, Turbopack, **Cache Components on**), React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui (every component already in `components/ui/`, so never install components)
- `next-themes`: dark by default, system available, toggled globally
- Shared control panel library: `components/controls/`
- Hosting: Vercel, with a preview deployment for every PR

```
app/
├── prototypes/
│   ├── [slug]/page.tsx        # 404 for unknown slugs (static folders win)
│   ├── layout.tsx             # back link + theme toggle (class "site-chrome")
│   └── <slug>/                # ONE FOLDER PER PROTOTYPE
│       ├── page.tsx
│       ├── metadata.json
│       └── HOW_IT_WORKS.md
├── p/[slug]/page.tsx          # public route, renders the same component
├── api/auth/route.ts          # password login
├── api/<slug>/...             # private API routes for a prototype
├── api/public/<slug>/...      # API routes a PUBLIC prototype needs (bypass the gate)
├── login/                     # password page
├── page.tsx                   # gallery
└── layout.tsx                 # root layout + ThemeProvider
components/ui/                 # shadcn/ui (vendored, do not edit or lint)
components/controls/           # defineControls / useControls / ControlPanel / PlaygroundLayout
components/gallery/            # homepage gallery
lib/prototypes.ts              # typed access to the registry
lib/registry.generated.ts      # AUTO-GENERATED: never edit
lib/public-slugs.generated.ts  # AUTO-GENERATED: never edit
proxy.ts                       # password gate + /p 404s (Next 16 name for middleware)
public/thumbnails/             # <slug>-light.png, <slug>-dark.png, <slug>-og.png/.mp4
scripts/generate-registry.ts   # scans prototypes → registry (runs before dev/build)
scripts/capture-thumbnails.ts  # Playwright thumbnail + OG capture
```

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Regenerate registry | `npm run registry` (also runs automatically before dev and build) |
| Lint / types / build | `npm run lint`, `npm run typecheck`, `npm run build` |
| All three | `npm run check` |
| Thumbnails, one or several | `npm run thumbnails -- <slug> [<slug> ...]` |
| Thumbnails, missing only | `npm run thumbnails -- --missing` |
| Thumbnails, all | `npm run thumbnails` |
| Reuse existing build | add `--skip-build` |

---

## How to create a new prototype (start → PR)

1. **Branch**: `git checkout -b proto/<slug>`. Slug is kebab-case, short and descriptive.
2. **Folder**: create `app/prototypes/<slug>/`.
3. **metadata.json** (all fields required; the registry script fails the build otherwise):
   ```json
   {
     "title": "My Prototype",
     "description": "What it does, one sentence",
     "tags": ["tag1"],
     "createdAt": "YYYY-MM-DD",
     "updatedAt": "2026-01-01T12:00:00Z",
     "hidden": false,
     "public": false
   }
   ```
4. **Files**: a thin `page.tsx`, plus `types.ts`, `data.ts`, pure logic files, and one file per UI component (see Decomposition below). Copy the shape of `app/prototypes/particle-orbits/`.
5. **HOW_IT_WORKS.md**: every section listed under Documentation below.
6. **Install deps** if needed, at the repo root (`npm i <pkg>`).
7. **Verify**: `npm run check` passes. Then open the prototype at 375px and desktop width, in light and dark, and look at it (Playwright screenshots are fine).
8. **Thumbnails**: `npm run thumbnails -- <slug>` (it builds for you). **Open the two PNGs and look at them** before committing.
9. **Commit** everything, including thumbnails and the regenerated `lib/*.generated.ts`.
10. **Push and open a PR** (`gh pr create` or the GitHub tool you have). Title: `Add <Title> prototype`.
11. **Post the preview link** as your final message: the Vercel preview URL from the PR (Vercel bot comment or deployment status), deep-linked to `/prototypes/<slug>`.

Never build a "new prototype" button, form or create API inside the app. Prototypes are only ever created by an agent following these steps.

---

## Rules for every prototype

### Metadata
- Every prototype has a complete `metadata.json` (shape above).
- **Bump `updatedAt` (ISO timestamp) on every edit** to the prototype, so the gallery stays sorted by most recently updated.
- `hidden: true` keeps it out of the gallery unless the owner flips the "Hidden" switch.
- `public` stays `false`. See Privacy.

### Documentation: `HOW_IT_WORKS.md`
Keep it current on every change. Sections:
- **What It Does**: 1–2 sentences
- **Architecture**: ASCII data-flow diagram
- **Frontend / API**: bullets on state, shortcuts, responsive behaviour, request/response shapes
- **AI Usage** (if any model is called): model ID, why that model, how it's called, key parameters, system prompt summary, user prompt shape
- **Key Dependencies**, **Component Tree**, **Error Handling**, **File Structure**

### Self-contained and decomposed
- A prototype lives entirely in its own folder and **never imports from another prototype**. Shared code belongs in `components/` or `lib/`, and only when it's truly general.
- **Never write one giant file.** Keep `page.tsx` thin (~60 lines max, ideally just metadata + one component). Split out:
  - `types.ts`: shared types
  - `data.ts`: mock data, constants, config, control schemas
  - pure logic (`simulation.ts`, `search.ts`, `utils.ts`): no React, testable on its own
  - one file per meaningful UI component, named descriptively (`orbit-canvas.tsx`, not `components.tsx`)
- `page.tsx` should export `metadata` using the title/description from `metadata.json` (`import meta from "./metadata.json"`).

### Design system
- Always use the shared components from `@/components/ui/*` and the design tokens: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-accent`, `border-border`, `ring-ring`, `text-destructive`, `chart-1…5`.
- **Never hardcode colours**: no `bg-black`, `text-white`, `bg-zinc-900`, hex/rgb values, or inline colour styles. The one exception is colour that is the prototype's *data* (e.g. a user-chosen hue drawn on a canvas).
- **Check the actual component source in `components/ui/` before assuming a prop or variant exists.** These are shadcn "new-york-v4" sources and can differ from the docs. Example: `Button` sizes are `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`.

### Clean and minimal by default
- Start with a single centred column: `max-w-2xl mx-auto`. No sidebars, split panels or tab-heavy layouts unless asked. (A control panel beside the subject is the exception; use `PlaygroundLayout`.)
- Build only what was asked for. No extra dashboards, charts, stats or views.
- Fewer elements is better; every element must justify its existence. Plain `Badge variant="outline"` over colourful badges. No decorative icons.
- Minimal interface copy. No captions that restate labels, no hints nobody needs, no marketing intros.

### Control panels
- Anything with tunable parameters (speed, colour, size, count…) gets a control panel, not scattered inputs.
- **Use the shared library**:
  ```tsx
  // data.ts
  export const controls = defineControls({
    speed: { type: "number", label: "Speed", min: 0.1, max: 3, step: 0.1, default: 1 },
    hue:   { type: "hue", label: "Hue", default: 250 },
    mode:  { type: "select", label: "Mode", options: ["a", "b"], default: "a" },
    trails:{ type: "boolean", label: "Trails", default: true },
  })
  // playground.tsx
  const c = useControls("<slug>", controls)
  return (
    <PlaygroundLayout panel={<ControlPanel controls={c} />}>
      <div className="mx-auto w-full max-w-2xl">…uses c.values…</div>
    </PlaygroundLayout>
  )
  ```
  You get persistence (namespaced localStorage), **Reset** and **Randomize** for free.
- Every control panel includes Randomize ("surprise me") next to Reset. Don't remove it.
- `PlaygroundLayout` puts the panel to the side from `lg:` (never covering the subject) and a bottom sheet with a floating button on mobile. Don't reinvent this.
- Need a new control type? Add it to `components/controls/` (types, logic, panel) so every prototype benefits.

### Mobile first
- Everything works at **375px wide**. Check it.
- **Tap targets ≥ 44×44px.** shadcn's default `Button` is 36px (`h-9`), so use `className="h-11"` or `size="icon" className="size-11"` for primary touch targets.
- Icon-only buttons on mobile, labels from `sm:` up (`<span className="hidden sm:inline">Label</span>`), with an `aria-label`.
- No hover-only interactions. Every hover state has a visible touch equivalent (`active:` / always-visible control).
- Code blocks wrap (global CSS does this for `pre`/`code`; don't override it). No horizontal scrolling anywhere.
- Modals and lightboxes need visible prev/next buttons or swipe on mobile, not just keyboard shortcuts.
- Respect safe areas for fixed elements (`env(safe-area-inset-bottom)`).

### Light and dark mode
- Design dark-first; light must also work, which it does automatically if you use tokens.
- **Never hardcode a `dark` class on a page or element.** The theme is global (`next-themes`, `attribute="class"`).
- Use `useTheme()` / `resolvedTheme` only when *behaviour* must change by theme (canvas/WebGL colours). For canvas backgrounds, read the token at runtime: `getComputedStyle(el).getPropertyValue("--background")`, and re-run the effect when `resolvedTheme` changes.

### Motion
- Rows or sections the user adds or removes **animate their height** open and closed; nothing pops in and makes the page jump. Use the global `.collapse-grid` utility:
  ```tsx
  <div className="collapse-grid" data-open={open}><div>…content…</div></div>
  ```
- Smooth deceleration curves only (`ease-out`, or `var(--ease-out-smooth)`); no bouncy overshoot or spring wobble.
- Respect `prefers-reduced-motion`. Global CSS neutralises CSS transitions; JS/canvas animation loops must check `matchMedia("(prefers-reduced-motion: reduce)")` themselves and render a static frame.
- **Verify animations actually run** by checking computed styles (`getComputedStyle(el).animationName` / `transitionDuration`). Utility classes like `animate-in` silently do nothing if their CSS (`tw-animate-css`, imported in `globals.css`) isn't loaded.

### AI-backed prototypes
- Call models **server-side only**, through an API route (`app/api/<slug>/route.ts`). Never expose keys to the client; keys live in env vars (`ANTHROPIC_API_KEY`, etc.).
- If a model generates UI or layout, put explicit layout constraints in the system prompt (max columns, no wide tables, mobile width). Defensive CSS is a backup, not the fix.
- Parse JSON from model output defensively: extract the first `{…}` block, `try/catch` the parse, validate the shape.
- Always wrap API route handlers in `try/catch` and return proper status codes (400 bad input, 500/502 upstream failure) with a JSON `{ error }` body.
- Document the model usage in HOW_IT_WORKS.md (AI Usage section).

### Storage
- Wrap **all** `localStorage` access in `try/catch`.
- Load on mount (in `useEffect`), **never during server render**.
- Namespace keys per prototype: `playground:<slug>:<key>`.
- Validate what you load; stale data must fall back to defaults, not crash.

### Thumbnails
- New prototype or any visual change → regenerate that prototype's thumbnails **in the same commit** (`npm run thumbnails -- <slug>`).
- Global style change (tokens, `globals.css`, shared components) → regenerate all (`npm run thumbnails`).
- **Open and check the captured images before committing.** A stale or broken thumbnail is worse than none. Look for blank canvases, error overlays, loading states, or the wrong theme.
- Capture hides elements with class `site-chrome` (the back link bar). Give a page-title `h1` that class too if it shouldn't appear in the thumbnail.
- A missing thumbnail shows "No preview yet"; it never breaks the build.

### Privacy
- The whole site is behind a password in production (`SITE_PASSWORD` env var; `proxy.ts`). With no `SITE_PASSWORD` set, production stays locked (fail closed).
- **Every prototype is private by default.** Only set `"public": true` when the owner explicitly asks for *that specific* prototype to be public. Never make one public on your own initiative, "for testing", or because it seems shareable.
- Public prototypes are served at `/p/<slug>` (same component, no site chrome). Unknown or private slugs return a real **404**, never a login redirect, so private names don't leak.
- If a public prototype calls API routes, put them under `app/api/public/<slug>/` (the only API path the gate lets through), and make sure they're safe to call anonymously (rate limits / input caps for anything that costs money).
- **When making a prototype public, ALWAYS create og:image and og:video**: run `npm run thumbnails -- <slug>` after flipping the flag. It writes `<slug>-og.png` (1200×630) and `<slug>-og.mp4` (4s, needs `ffmpeg` on PATH). Check both, commit both, and verify the tags render absolute URLs: `curl -s <preview>/p/<slug> | grep og:`.

---

## Workflow rules

- **Always work on a branch**, push, and open a pull request when done. The PR triggers the build check and a Vercel preview deployment. Never push straight to `main`.
- **Before finishing, run `npm run check`** (lint + type-check + production build). All must pass.
- **End every task by posting the preview link** (deep link to the prototype) so the owner can open it straight from their phone. If the preview isn't ready yet, post the PR link and say the preview is building.
- **When something goes wrong and gets fixed, add the lesson to "Lessons learned" below** in the same PR. This file should grow over time.
- Keep PRs focused: one prototype (or one foundation change) per PR.

---

## Suggested libraries

Add as needed, installed at the repo root.

| Need | Suggestions |
|---|---|
| 3D / WebGL | three.js, React Three Fiber |
| Physics | Rapier, Matter.js |
| Charts | Recharts (already installed, via `components/ui/chart.tsx`), or plain SVG for sparklines |
| Maps | MapLibre GL |
| Text layout / typography effects | `@chenglou/pretext` |
| Audio / synths | Web Audio API, Tone.js |
| AI | Anthropic SDK (`@anthropic-ai/sdk`), server-side only |
| Generated UI from JSON | json-render or similar |
| Browser automation | Playwright (already installed: thumbnails, visual checks, demo videos) |
| Native app wrapper | Capacitor, if a prototype graduates to the App Store |

---

## Lessons learned

Add a dated bullet whenever something breaks and gets fixed.

- **2026-11-20 · Next 16 renamed middleware → `proxy.ts`** (export `proxy`, Node runtime only). Don't create `middleware.ts`.
- **2026-11-20 · Cache Components is on.** `export const dynamicParams` / `dynamic` / `revalidate` segment configs are rejected at build. `generateStaticParams` must return **at least one** param (hence the `__none__` sentinel in `/p/[slug]`). `params` is a `Promise`; `await` it.
- **2026-11-20 · `notFound()` in a partially prerendered route returns HTTP 200** (the shell streams first). Real 404s for `/p/<slug>` are enforced in `proxy.ts` using `lib/public-slugs.generated.ts`.
- **2026-11-20 · `next build` type-checks `scripts/` too.** Keep scripts type-safe (e.g. `env: Record<string, string>`, not `NodeJS.ProcessEnv`).
- **2026-11-20 · Playwright's `recordVideo` needs Playwright's own ffmpeg build**, which may not be downloadable. The OG video is made from screenshot frames + system `ffmpeg` instead.
- **2026-11-20 · The thumbnail script uses a local Chrome when Playwright's Chromium isn't installed** (override with `CHROME_PATH`). Run `npx playwright install chromium` if neither exists.
- **2026-11-20 · Setting attributes on `<html>` from a Playwright init script doesn't survive hydration.** Inject a style tag after navigation instead.
- **2026-11-20 · `ui.shadcn.com` may be unreachable from agent sandboxes**, so `npx shadcn add` can fail. All components are already vendored from the shadcn GitHub repo (`apps/v4/registry/new-york-v4/ui`) with imports rewritten to `@/components/ui/*`.
- **2026-11-20 · A control panel mounted twice (side panel + mobile sheet) duplicated element ids.** `ControlPanel` prefixes ids with `useId()`; do the same in any component that can render twice.
- **2026-11-20 · `next start` runs as a `next-server` process.** `pkill -f "next start"` leaves it alive, so kill by port or `pkill -f next-server` before restarting, or you'll test a stale build.
- **2026-11-20 · Fonts come from the `geist` npm package**, not `next/font/google`, so builds don't depend on reaching Google Fonts.
- **2026-11-21 · Closed `.collapse-grid` sections still take part in a parent's flex/grid `gap`**, leaving phantom space. Put spacing inside the collapsible content (`pt-*`) instead of using `gap` on the parent.
- **2026-11-21 · `ToggleGroup type="single"` items have `role="radio"`, not `button`.** In Playwright use `getByRole("radio", { name })`. Also: number controls accept an optional `format: (v) => string` for the readout (e.g. "Drizzle" → "Downpour").
- **2026-11-21 · Web Audio in background tabs:** JS timers are throttled to ~1/s when hidden, so schedulers need ≥1.5 s lookahead, and anything time-critical (e.g. a sleep-timer fade) should be automated on the `AudioContext` clock, not driven by `setTimeout`.
