"use client"

import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { byId } from "./palette"

export function FavouritesList({
  ids,
  onShow,
  onRemove,
}: {
  ids: string[]
  onShow: (id: string) => void
  onRemove: (id: string) => void
}) {
  if (ids.length === 0) return <p className="py-6 text-sm text-muted-foreground">No favourites yet.</p>

  // Newest first.
  return (
    <ul className="divide-y divide-border">
      {[...ids].reverse().map((id) => {
        const c = byId(id)
        if (!c) return null
        return (
          <li key={id} className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => onShow(id)}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:opacity-70"
            >
              <span className="flex h-10 w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                {c.colours.map((col, i) => (
                  <span key={i} className="flex-1" style={{ backgroundColor: col.hex }} />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.source}</span>
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-muted-foreground"
              aria-label={`Remove ${c.name} from favourites`}
              onClick={() => onRemove(id)}
            >
              <XIcon />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
