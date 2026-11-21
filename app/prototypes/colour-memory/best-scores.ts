import { BEST_SCORES_KEY } from "./data"
import type { BestScores, Difficulty } from "./types"

const DIFFICULTIES: Difficulty[] = ["easy", "hard"]

/** Reads saved bests. Call on the client only (from an effect or event). */
export function loadBestScores(): BestScores {
  try {
    const raw = localStorage.getItem(BEST_SCORES_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    const out: BestScores = {}
    for (const d of DIFFICULTIES) {
      const v = (parsed as Record<string, unknown>)[d]
      if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100) out[d] = Math.round(v)
    }
    return out
  } catch {
    return {}
  }
}

export function saveBestScores(best: BestScores) {
  try {
    localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(best))
  } catch {
    /* private mode / quota: bests just won't persist */
  }
}
