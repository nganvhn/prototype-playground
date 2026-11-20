"use client"

import { SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

/**
 * Subject + control panel. Desktop (lg+): panel sits to the side and never covers
 * the subject. Mobile: panel opens as a bottom sheet from a floating button.
 */
export function PlaygroundLayout({
  children,
  panel,
  title = "Controls",
}: {
  children: React.ReactNode
  panel: React.ReactNode
  title?: string
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 p-4 lg:p-6">
      <div className="min-w-0 flex-1">{children}</div>

      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-6 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">{title}</h2>
          {panel}
        </div>
      </aside>

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
    </div>
  )
}
