import { GARDEN_STORAGE_KEY } from "./data"
import type { StoredSeed } from "./types"

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
const in01 = (v: unknown) => isNum(v) && v >= 0 && v <= 1

/** Returns the saved garden, or null when nothing valid is stored. Never throws. */
export function loadGarden(): StoredSeed[] | null {
  try {
    const raw = localStorage.getItem(GARDEN_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
      .filter((s): s is StoredSeed => !!s && in01(s.x) && in01(s.y) && in01(s.h))
      .slice(0, 300)
  } catch {
    return null
  }
}

export function saveGarden(seeds: StoredSeed[]) {
  try {
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(seeds))
  } catch {
    /* quota / private mode: the garden just won't persist */
  }
}
