import { notFound } from "next/navigation"

/**
 * Real prototypes are static folders (app/prototypes/<slug>/), which take
 * precedence over this dynamic route. Anything that reaches here is unknown.
 */
export default function UnknownPrototype() {
  notFound()
}
