# Prototype Playground

A personal playground of small, self-contained prototypes in one Next.js app. New prototypes are created by a coding agent following [`AGENTS.md`](./AGENTS.md) (`CLAUDE.md` imports it).

## Run

```bash
npm install
npm run dev          # http://localhost:3000 (no password in dev)
npm run check        # lint + typecheck + production build
npm run thumbnails   # capture light/dark thumbnails (see AGENTS.md for flags)
```

## Deploy (Vercel)

1. Import this repo in Vercel (framework: Next.js, defaults are fine).
2. Set `SITE_PASSWORD` for Production and Preview. Without it, production is locked.
3. Every PR gets a preview deployment; the agent posts that link when it finishes.

Public prototypes (`"public": true` in their `metadata.json`) are served without a password at `/p/<slug>`.

## Asking for a prototype

From any Claude Code session on this repo: *"Make a prototype that …"*. The agent branches, builds it under `app/prototypes/<slug>/`, captures thumbnails, opens a PR and replies with the preview link.
