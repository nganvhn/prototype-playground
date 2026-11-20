import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Prototype } from "@/lib/prototype-types"

export function PrototypeCard({ prototype: p }: { prototype: Prototype }) {
  return (
    <Link
      href={`/prototypes/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-ring focus-visible:border-ring active:border-ring focus-visible:outline-none"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
        {p.thumbnails ? (
          <>
            <Image src={p.thumbnails.light} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="thumb-light object-cover object-top" />
            <Image src={p.thumbnails.dark} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="thumb-dark object-cover object-top" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No preview yet</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-medium">{p.title}</h2>
          {p.public && <Badge variant="outline">Public</Badge>}
          {p.hidden && <Badge variant="outline">Hidden</Badge>}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
      </div>
    </Link>
  )
}
