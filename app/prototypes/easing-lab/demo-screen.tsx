/** A small phone-shaped frame that hosts one motion demo. */
export function DemoScreen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-muted/40">
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
        <div key={i} className="h-8 rounded-md bg-muted-foreground/10" />
      ))}
    </div>
  )
}
