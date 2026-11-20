import type { Control, ControlSchema, ControlValues } from "./types"

export function defaultsOf<S extends ControlSchema>(schema: S): ControlValues<S> {
  return Object.fromEntries(
    Object.entries(schema).map(([k, c]) => [k, c.default])
  ) as ControlValues<S>
}

function randomValue(c: Control, rand: () => number) {
  switch (c.type) {
    case "number": {
      const step = c.step ?? 1
      const n = Math.round((c.min + rand() * (c.max - c.min)) / step) * step
      return Math.min(c.max, Math.max(c.min, Number(n.toFixed(6))))
    }
    case "hue":
      return Math.round(rand() * 360)
    case "boolean":
      return rand() < 0.5
    case "select":
      return c.options[Math.floor(rand() * c.options.length)]
  }
}

export function randomize<S extends ControlSchema>(
  schema: S,
  rand: () => number = Math.random
): ControlValues<S> {
  return Object.fromEntries(
    Object.entries(schema).map(([k, c]) => [k, randomValue(c, rand)])
  ) as ControlValues<S>
}

/** Keeps only known keys with valid values, so stale localStorage can't break a prototype. */
export function sanitize<S extends ControlSchema>(schema: S, raw: unknown): ControlValues<S> {
  const out = defaultsOf(schema) as Record<string, unknown>
  if (!raw || typeof raw !== "object") return out as ControlValues<S>
  for (const [k, c] of Object.entries(schema)) {
    const v = (raw as Record<string, unknown>)[k]
    if (c.type === "number" && typeof v === "number" && v >= c.min && v <= c.max) out[k] = v
    if (c.type === "hue" && typeof v === "number" && v >= 0 && v <= 360) out[k] = v
    if (c.type === "boolean" && typeof v === "boolean") out[k] = v
    if (c.type === "select" && typeof v === "string" && c.options.includes(v)) out[k] = v
  }
  return out as ControlValues<S>
}
