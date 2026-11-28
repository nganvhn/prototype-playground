import { COMBINATIONS, FAVOURITES_KEY } from "./data"

/** Saved favourite ids, oldest first. Unknown ids (e.g. removed from data) are dropped. */
export function loadFavourites(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? "[]")
    if (!Array.isArray(raw)) return []
    const known = new Set(COMBINATIONS.map((c) => c.id))
    return [...new Set(raw.filter((id): id is string => typeof id === "string" && known.has(id)))]
  } catch {
    return []
  }
}

export function saveFavourites(ids: string[]) {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(ids))
  } catch {
    /* storage unavailable: favourites last for this visit only */
  }
}
