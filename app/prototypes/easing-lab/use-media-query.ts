"use client"

import { useCallback, useSyncExternalStore } from "react"

/** Live `matchMedia` result; false during server render. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)")
/** Matches Tailwind's `lg:` breakpoint, where the layout goes two-column. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")
