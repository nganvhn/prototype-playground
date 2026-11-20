import type { Prototype } from "@/lib/prototype-types"

export type GalleryFilter = { query: string; tags: string[]; showHidden: boolean }

/** Pure filter: text matches title/description/tags; every selected tag must match. */
export function filterPrototypes(list: Prototype[], f: GalleryFilter): Prototype[] {
  const q = f.query.trim().toLowerCase()
  return list.filter((p) => {
    if (p.hidden && !f.showHidden) return false
    if (f.tags.length && !f.tags.every((t) => p.tags.includes(t))) return false
    if (!q) return true
    return [p.title, p.description, p.slug, ...p.tags].some((s) => s.toLowerCase().includes(q))
  })
}
