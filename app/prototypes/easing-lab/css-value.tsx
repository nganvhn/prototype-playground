import { toCss } from "./bezier"
import type { Bezier } from "./types"

export function CssValue({ bezier }: { bezier: Bezier }) {
  return <code className="block rounded-md bg-muted px-3 py-2.5 font-mono text-sm">{toCss(bezier)}</code>
}
