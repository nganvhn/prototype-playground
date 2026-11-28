"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"
import { ControlPanel, PlaygroundLayout, useControls } from "@/components/controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { STORAGE_NAMESPACE, paletteControls } from "./data"
import { loadFavourites, saveFavourites } from "./favourites"
import { FavouritesList } from "./favourites-list"
import { byId, candidates, pickCombination } from "./palette"
import { PaletteCard } from "./palette-card"
import { useSwipe } from "./use-swipe"

type Entry = { id: string; exact: boolean }

export function PalettesPlayground() {
  const controls = useControls(STORAGE_NAMESPACE, paletteControls)
  const { count, families, layout } = controls.values
  const [history, setHistory] = useState<Entry[]>([])
  const [index, setIndex] = useState(0)
  const [favourites, setFavourites] = useState<string[]>([])
  const [showFavourites, setShowFavourites] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage on mount
    setFavourites(loadFavourites())
  }, [])

  // Before the first Generate, show a deterministic match so server and client agree.
  const initial = candidates(Number(count), families)
  const entry: Entry | undefined = history[index] ?? (initial.pool[0] && { id: initial.pool[0].id, exact: initial.exact })
  const combination = entry ? byId(entry.id) : undefined

  const push = (e: Entry) => {
    setIndex(history.length)
    setHistory([...history, e])
  }

  const generate = () => {
    const pick = pickCombination(Number(count), families, history.map((h) => h.id))
    if (!pick) return toast("Nothing in the collection uses those colour families.")
    push({ id: pick.combination.id, exact: pick.exact })
  }

  const canPrev = index > 0
  const canNext = index < history.length - 1
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(history.length - 1, i + 1)), [history.length])
  const swipe = useSwipe(next, prev)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=slider]")) return
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next])

  const updateFavourites = (ids: string[]) => {
    setFavourites(ids)
    saveFavourites(ids)
  }
  const isFavourite = !!combination && favourites.includes(combination.id)
  const toggleFavourite = () => {
    if (!combination) return
    updateFavourites(isFavourite ? favourites.filter((id) => id !== combination.id) : [...favourites, combination.id])
  }
  const showFavourite = (id: string) => {
    if (id !== entry?.id) push({ id, exact: true })
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
  }

  return (
    <PlaygroundLayout panel={<ControlPanel controls={controls} />}>
      <div className="mx-auto w-full max-w-2xl pb-20 lg:pb-0">
        <div className="site-chrome mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-medium">Nature Palettes</h1>
          <Button
            variant="ghost"
            className="h-11"
            aria-expanded={showFavourites}
            onClick={() => setShowFavourites((s) => !s)}
          >
            Favourites
            <Badge variant="outline" className="tabular-nums">
              {favourites.length}
            </Badge>
          </Button>
        </div>

        <div className="collapse-grid" data-open={showFavourites}>
          <div>
            <div className="pb-6">
              <FavouritesList
                ids={favourites}
                onShow={showFavourite}
                onRemove={(id) => updateFavourites(favourites.filter((f) => f !== id))}
              />
            </div>
          </div>
        </div>

        <div {...swipe} onDragStart={(e) => e.preventDefault()} className="touch-pan-y select-none">
          {combination && (
            <PaletteCard
              combination={combination}
              exact={entry?.exact ?? true}
              layout={layout}
              favourite={isFavourite}
              onToggleFavourite={toggleFavourite}
            />
          )}
        </div>

        <div className="mt-8 flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-11" aria-label="Previous" disabled={!canPrev} onClick={prev}>
            <ChevronLeftIcon />
          </Button>
          <Button className="h-11 flex-1" onClick={generate}>
            Generate
          </Button>
          <Button variant="outline" size="icon" className="size-11" aria-label="Next" disabled={!canNext} onClick={next}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </PlaygroundLayout>
  )
}
