"use client"

import { SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

/**
 * Subject + control panel. Desktop (lg+): panel sits to the side and never covers
 * the subject. Mobile: by default the panel opens as a bottom sheet from a floating
 * button; with `mobilePanel="inline"` it flows below the subject instead (use this when
 * the prototype has its own fixed bottom bar). Inline mode mounts the panel only once.
 */
export function PlaygroundLayout({
  children,
  panel,
  title = "Controls",
  mobilePanel = "sheet",
}: {
  children: React.ReactNode
  panel: React.ReactNode
  title?: string
  mobilePanel?: "sheet" | "inline"
}) {
  const inline = mobilePanel === "inline"
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 gap-6 p-4 lg:p-6",
        inline && "flex-col lg:flex-row",
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>

      <aside className={cn("shrink-0 lg:block lg:w-72", inline ? "w-full" : "hidden")}>
        <div className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-medium">{title}</h2>
          {panel}
        </div>
      </aside>

      {!inline && (
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              size="icon"
              className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 size-12 rounded-full shadow-lg lg:hidden"
              aria-label="Open controls"
            >
              <SlidersHorizontalIcon />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[60vh] overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {panel}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
