"use client"

import { useEffect, useState } from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { copyText } from "./clipboard"
import { readableText } from "./palette"
import type { Colour, SwatchLayout } from "./types"

const CONTAINER: Record<SwatchLayout, string> = {
  stripes: "flex h-44 overflow-hidden rounded-xl ring-1 ring-border sm:h-56",
  circles: "mx-auto grid w-full max-w-lg gap-3 sm:gap-6",
  blocks: "grid h-56 grid-cols-3 grid-rows-2 gap-2 sm:h-72",
}

function itemClass(layout: SwatchLayout, index: number, count: number) {
  if (layout === "stripes") return "flex-1 items-start justify-end p-3 text-left sm:p-4"
  if (layout === "circles") return "aspect-square rounded-full items-center justify-center p-2 text-center ring-1 ring-border"
  // Blocks: first colour dominant, the rest stacked beside it.
  return cn(
    "rounded-xl items-start justify-end p-3 text-left ring-1 ring-border sm:p-4",
    index === 0 && "col-span-2 row-span-2",
    count === 2 && index === 1 && "row-span-2"
  )
}

export function Swatches({ colours, layout }: { colours: Colour[]; layout: SwatchLayout }) {
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(null), 1400)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div
      className={CONTAINER[layout]}
      style={layout === "circles" ? { gridTemplateColumns: `repeat(${colours.length}, minmax(0, 1fr))` } : undefined}
    >
      {colours.map((colour, i) => {
        const isCopied = copied === `${i}${colour.hex}`
        return (
          <button
            key={i}
            type="button"
            aria-label={`Copy ${colour.name} ${colour.hex}`}
            onClick={async () => {
              if (await copyText(colour.hex, `Copied ${colour.hex}`)) setCopied(`${i}${colour.hex}`)
            }}
            // Swatch colours are the prototype's data, so inline colour is intended here.
            style={{ backgroundColor: colour.hex, color: readableText(colour.hex) }}
            className={cn(
              "flex min-h-11 min-w-0 flex-col outline-none transition-[background-color,color,filter] duration-500 ease-out focus-visible:ring-[3px] focus-visible:ring-ring active:brightness-95",
              itemClass(layout, i, colours.length)
            )}
          >
            <span className="w-full truncate text-xs opacity-75">{colour.name}</span>
            <span className="flex items-center gap-1 font-mono text-sm tracking-tight sm:text-base">
              {isCopied && <CheckIcon className="size-4" aria-hidden />}
              {isCopied ? "Copied" : colour.hex}
            </span>
          </button>
        )
      })}
    </div>
  )
}
