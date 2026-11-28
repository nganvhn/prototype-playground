"use client"

import { useEffect, useState } from "react"
import type { Photo } from "./types"

// Per-visit caches: one request per combination, one download ping per photo.
const requests = new Map<string, Promise<Photo | null>>()
const tracked = new Set<string>()

function requestPhoto(id: string) {
  let req = requests.get(id)
  if (!req) {
    req = fetch(`/api/nature-palettes/photo?id=${encodeURIComponent(id)}`)
      .then(async (res) => (res.ok ? ((await res.json()) as { photo?: Photo }).photo ?? null : null))
      .catch(() => null)
    requests.set(id, req)
  }
  return req
}

/** `undefined` while loading, `null` when there's no photo (no key, no result, error). */
export function usePhoto(combinationId: string) {
  const [result, setResult] = useState<{ id: string; photo: Photo | null } | null>(null)

  useEffect(() => {
    let live = true
    requestPhoto(combinationId).then((photo) => {
      if (live) setResult({ id: combinationId, photo })
    })
    return () => {
      live = false
    }
  }, [combinationId])

  return result?.id === combinationId ? result.photo : undefined
}

/** Unsplash asks apps to trigger the download endpoint when a photo is displayed. */
export function trackPhotoShown(photoId: string) {
  if (tracked.has(photoId)) return
  tracked.add(photoId)
  fetch("/api/nature-palettes/photo/download", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: photoId }),
  }).catch(() => tracked.delete(photoId))
}
