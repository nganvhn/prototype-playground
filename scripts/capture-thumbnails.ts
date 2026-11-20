/**
 * Captures static light + dark thumbnails for prototypes, plus og:image and
 * og:video for public ones. Builds for production, starts the server with the
 * password gate disabled, and screenshots each prototype in a headless browser.
 *
 *   npm run thumbnails                      # all prototypes
 *   npm run thumbnails -- particle-orbits   # one
 *   npm run thumbnails -- a b c             # several
 *   npm run thumbnails -- --missing         # only those missing any image
 *   npm run thumbnails -- --skip-build ...  # reuse the existing .next build
 *
 * Output: public/thumbnails/<slug>-light.png, <slug>-dark.png,
 *         and for public prototypes <slug>-og.png, <slug>-og.mp4
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { chromium, type Browser, type BrowserContextOptions } from "playwright"

const root = process.cwd()
const thumbsDir = path.join(root, "public", "thumbnails")
const prototypesDir = path.join(root, "app", "prototypes")
const PORT = Number(process.env.THUMBNAIL_PORT ?? 3123)
const BASE = `http://127.0.0.1:${PORT}`
const SETTLE_MS = 1500
const VIDEO_SECONDS = 4

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith("--")))
const requested = args.filter((a) => !a.startsWith("--"))

type Meta = { public?: boolean }
const allSlugs = fs
  .readdirSync(prototypesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((s) => fs.existsSync(path.join(prototypesDir, s, "metadata.json")))

const meta = (slug: string): Meta =>
  JSON.parse(fs.readFileSync(path.join(prototypesDir, slug, "metadata.json"), "utf8"))
const has = (file: string) => fs.existsSync(path.join(thumbsDir, file))
const isMissing = (slug: string) =>
  !has(`${slug}-light.png`) ||
  !has(`${slug}-dark.png`) ||
  (meta(slug).public === true && !has(`${slug}-og.png`))

const unknown = requested.filter((s) => !allSlugs.includes(s))
if (unknown.length) {
  console.error(`Unknown prototype(s): ${unknown.join(", ")}`)
  process.exit(1)
}

let slugs = requested.length ? requested : allSlugs
if (flags.has("--missing")) slugs = slugs.filter(isMissing)
if (!slugs.length) {
  console.log("Nothing to capture.")
  process.exit(0)
}

function run(cmd: string, cmdArgs: string[], env: Record<string, string> = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", env: { ...process.env, ...env } })
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(" ")} failed`)
}

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error("Server did not start in time")
}

/** Prefer a locally installed Chrome when Playwright's browser isn't downloaded. */
function chromeExecutable(): string | undefined {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  try {
    if (fs.existsSync(chromium.executablePath())) return undefined
  } catch {
    /* fall through */
  }
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]
  return candidates.find((c) => fs.existsSync(c))
}

function contextFor(theme: "light" | "dark", extra: BrowserContextOptions = {}): BrowserContextOptions {
  return { colorScheme: theme, reducedMotion: "no-preference", ...extra }
}

async function openPrototype(browser: Browser, slug: string, theme: "light" | "dark", opts: BrowserContextOptions) {
  const context = await browser.newContext(contextFor(theme, opts))
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  const res = await page.goto(`${BASE}/prototypes/${slug}`, { waitUntil: "networkidle" })
  if (!res || !res.ok()) throw new Error(`${slug}: HTTP ${res?.status()}`)
  // Hide site chrome (back link, theme toggle, page title) so the image shows only the prototype.
  await page.addStyleTag({ content: ".site-chrome{display:none!important}" })
  await page.waitForTimeout(SETTLE_MS)
  return { context, page }
}

async function captureThumbs(browser: Browser, slug: string) {
  for (const theme of ["light", "dark"] as const) {
    // 1280×800 layout rendered at 0.5× → 640×400 image.
    const { context, page } = await openPrototype(browser, slug, theme, {
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 0.5,
    })
    await page.screenshot({ path: path.join(thumbsDir, `${slug}-${theme}.png`) })
    await context.close()
  }
}

async function captureOg(browser: Browser, slug: string) {
  const size = { width: 1200, height: 630 }
  const { context, page } = await openPrototype(browser, slug, "dark", { viewport: size })
  await page.screenshot({ path: path.join(thumbsDir, `${slug}-og.png`) })
  await context.close()

  const hasFfmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0
  if (!hasFfmpeg) {
    console.warn(`  ! ffmpeg not found: skipped og:video for ${slug}`)
    return
  }
  // Frames are screenshotted in real time and encoded with the system ffmpeg
  // (avoids depending on Playwright's bundled ffmpeg for recordVideo).
  const tmp = fs.mkdtempSync(path.join(root, ".thumb-video-"))
  try {
    const rec = await openPrototype(browser, slug, "dark", { viewport: size })
    let frames = 0
    const t0 = Date.now()
    while (Date.now() - t0 < VIDEO_SECONDS * 1000) {
      const file = path.join(tmp, `f${String(frames).padStart(5, "0")}.jpg`)
      await rec.page.screenshot({ path: file, type: "jpeg", quality: 85 })
      frames++
    }
    const fps = Math.max(1, frames / ((Date.now() - t0) / 1000))
    await rec.context.close()
    run("ffmpeg", [
      "-y", "-loglevel", "error",
      "-framerate", fps.toFixed(2), "-i", path.join(tmp, "f%05d.jpg"),
      "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-an",
      path.join(thumbsDir, `${slug}-og.mp4`),
    ])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

async function main() {
  fs.mkdirSync(thumbsDir, { recursive: true })
  if (!flags.has("--skip-build")) run("npm", ["run", "build"])

  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    stdio: "ignore",
    env: { ...process.env, PLAYGROUND_AUTH_DISABLED: "1" },
    detached: true,
  })
  const stop = () => {
    try {
      if (server.pid) process.kill(-server.pid)
    } catch {}
  }
  process.on("exit", stop)

  let failed = 0
  try {
    await waitForServer()
    const browser = await chromium.launch({ executablePath: chromeExecutable() })
    for (const slug of slugs) {
      try {
        process.stdout.write(`• ${slug}\n`)
        await captureThumbs(browser, slug)
        if (meta(slug).public === true) await captureOg(browser, slug)
      } catch (e) {
        failed++
        console.error(`  ✗ ${slug}: ${(e as Error).message}`)
      }
    }
    await browser.close()
  } finally {
    stop()
  }

  // Refresh the registry so the gallery picks up new thumbnails.
  run("npx", ["tsx", "scripts/generate-registry.ts"])
  console.log(`Captured ${slugs.length - failed}/${slugs.length}. Check the images in public/thumbnails/ before committing.`)
  if (failed) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
