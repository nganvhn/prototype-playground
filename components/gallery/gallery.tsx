"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Prototype } from "@/lib/prototype-types"
import { filterPrototypes } from "./filter"
import { PrototypeCard } from "./prototype-card"
import { TagFilter } from "./tag-filter"

export function Gallery({ prototypes, tags }: { prototypes: Prototype[]; tags: string[] }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [showHidden, setShowHidden] = useState(false)

  const visible = useMemo(
    () => filterPrototypes(prototypes, { query, tags: selected, showHidden }),
    [prototypes, query, selected, showHidden]
  )
  const hiddenCount = prototypes.filter((p) => p.hidden).length

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search"
          aria-label="Search prototypes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <TagFilter tags={tags} selected={selected} onChange={setSelected} />
        {hiddenCount > 0 && (
          <div className="flex min-h-11 items-center gap-2">
            <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} />
            <Label htmlFor="show-hidden" className="text-muted-foreground">
              Hidden ({hiddenCount})
            </Label>
          </div>
        )}
      </div>

      {visible.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((p) => (
            <PrototypeCard key={p.slug} prototype={p} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Nothing matches.</p>
      )}
    </div>
  )
}
