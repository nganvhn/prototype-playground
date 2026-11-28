"use client"

import { CopyIcon, HeartIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { copyText } from "./clipboard"
import { paletteText } from "./palette"
import { ReferencePhoto } from "./reference-photo"
import { Swatches } from "./swatches"
import type { Combination, SwatchLayout } from "./types"

export function PaletteCard({
  combination,
  exact,
  layout,
  favourite,
  onToggleFavourite,
}: {
  combination: Combination
  exact: boolean
  layout: SwatchLayout
  favourite: boolean
  onToggleFavourite: () => void
}) {
  return (
    <article className="flex flex-col gap-6">
      <ReferencePhoto combination={combination} />

      <div className="flex items-start justify-between gap-3">
        <div key={combination.id} className="min-w-0 animate-in fade-in duration-500 ease-out">
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">{combination.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{combination.source}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {combination.category}
            </Badge>
            {!exact && <span className="text-xs text-muted-foreground">Closest match to your filters</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={favourite ? "Remove from favourites" : "Save to favourites"}
            aria-pressed={favourite}
            onClick={onToggleFavourite}
          >
            <HeartIcon className={cn(favourite && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            className="h-11 min-w-11"
            aria-label="Copy all hex values"
            onClick={() => copyText(paletteText(combination.colours), "Copied palette")}
          >
            <CopyIcon />
            <span className="hidden sm:inline">Copy all</span>
          </Button>
        </div>
      </div>

      <Swatches colours={combination.colours} layout={layout} />
    </article>
  )
}
