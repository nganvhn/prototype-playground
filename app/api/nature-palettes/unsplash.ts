import { cacheLife } from "next/cache"
import { UNSPLASH_UTM } from "@/app/prototypes/nature-palettes/data"
import type { Photo } from "@/app/prototypes/nature-palettes/types"

const API = "https://api.unsplash.com"

export function unsplashKey() {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() || null
}

export function unsplashHeaders(key: string) {
  return { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }
}

type SearchResult = {
  id?: unknown
  alt_description?: unknown
  description?: unknown
  urls?: { raw?: unknown }
  links?: { html?: unknown }
  user?: { name?: unknown; links?: { html?: unknown } }
}

const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null)
const withUtm = (url: string) => `${url}${url.includes("?") ? "&" : "?"}${UNSPLASH_UTM}`

/** Turns one Unsplash search result into our Photo shape, or null if fields are missing. */
export function toPhoto(r: SearchResult, fallbackAlt: string): Photo | null {
  const id = str(r.id)
  const raw = str(r.urls?.raw)
  const html = str(r.links?.html)
  const name = str(r.user?.name)
  const profile = str(r.user?.links?.html)
  if (!id || !raw || !html || !name || !profile) return null
  return {
    id,
    // Hotlinked, as Unsplash requires. Cropped server-side by imgix to 4:3.
    src: `${raw}${raw.includes("?") ? "&" : "?"}w=1200&h=900&fit=crop&crop=entropy&auto=format&q=75`,
    alt: str(r.alt_description) ?? str(r.description) ?? fallbackAlt,
    author: { name, url: withUtm(profile) },
    unsplashUrl: withUtm(html),
  }
}

/**
 * Searches Unsplash for one photo. Cached per query, so each subject costs one
 * API call. Failures throw, and thrown results are never cached.
 */
export async function searchPhoto(query: string): Promise<Photo | null> {
  "use cache"
  cacheLife("weeks")
  const key = unsplashKey()
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY is not set")
  const url = `${API}/search/photos?${new URLSearchParams({
    query,
    per_page: "5",
    orientation: "landscape",
    content_filter: "high",
  })}`
  const res = await fetch(url, { headers: unsplashHeaders(key) })
  if (!res.ok) throw new Error(`Unsplash search failed: ${res.status}`)
  const body = (await res.json()) as { results?: unknown }
  const results = Array.isArray(body.results) ? (body.results as SearchResult[]) : []
  for (const r of results) {
    const photo = toPhoto(r, query)
    if (photo) return photo
  }
  return null
}

/** Tells Unsplash a photo was shown (their "download" event). */
export async function trackDownload(id: string, key: string) {
  const res = await fetch(`${API}/photos/${encodeURIComponent(id)}/download`, {
    headers: unsplashHeaders(key),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Unsplash download tracking failed: ${res.status}`)
}
