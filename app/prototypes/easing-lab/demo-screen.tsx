import { cn } from "@/lib/utils"

/** A small screen-shaped frame that hosts one motion demo. Height is set by the stage. */
export function DemoScreen({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-1.5">
      <div className={cn("relative overflow-hidden rounded-xl border border-border bg-muted/40", className)}>
        {children}
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

/** Static placeholder rows that give each demo a screen to live on. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="h-2 w-1/2 rounded-full bg-muted-foreground/25" />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-7 shrink-0 rounded-md bg-muted-foreground/10" />
      ))}
    </div>
  )
}
