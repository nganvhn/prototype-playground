"use client"

import { cn } from "@/lib/utils"

export function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: string[]
  selected: string[]
  onChange: (tags: string[]) => void
}) {
  if (!tags.length) return null
  const toggle = (t: string) =>
    onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t])

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const on = selected.includes(t)
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(t)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md border px-3 text-xs transition-colors sm:min-h-8",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground active:text-foreground"
            )}
          >
            {t}
          </button>
        )
      })}
    </div>
  )
}
