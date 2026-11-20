import { prototypes, publicLoaders } from "./registry.generated"
import type { Prototype } from "./prototype-types"

export type { Prototype, PrototypeMetadata } from "./prototype-types"

const byUpdated = (a: Prototype, b: Prototype) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()

/** Every prototype, most recently updated first (includes hidden ones). */
export function getAllPrototypes(): Prototype[] {
  return [...prototypes].sort(byUpdated)
}

export function getPrototype(slug: string): Prototype | undefined {
  return prototypes.find((p) => p.slug === slug)
}

/** Only prototypes flagged `"public": true`. */
export function getPublicPrototypes(): Prototype[] {
  return getAllPrototypes().filter((p) => p.public)
}

export function getPublicPrototype(slug: string): Prototype | undefined {
  const p = getPrototype(slug)
  return p?.public && slug in publicLoaders ? p : undefined
}

export async function loadPublicComponent(slug: string) {
  const load = publicLoaders[slug]
  return load ? (await load()).default : null
}

export function getAllTags(list: Prototype[] = prototypes): string[] {
  return [...new Set(list.flatMap((p) => p.tags))].sort()
}
