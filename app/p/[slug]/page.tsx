import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { absoluteUrl } from "@/lib/site-url"
import { getPublicPrototype, getPublicPrototypes, loadPublicComponent } from "@/lib/prototypes"

// Unknown or private slugs 404 (never a login redirect, so private names don't leak).
// Cache Components requires at least one param, so a sentinel is used when none are public.
export function generateStaticParams() {
  const slugs = getPublicPrototypes().map((p) => ({ slug: p.slug }))
  return slugs.length ? slugs : [{ slug: "__none__" }]
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const p = getPublicPrototype(slug)
  if (!p) return {}
  const img = p.og.image ?? p.thumbnails?.dark
  const image = img ? absoluteUrl(img) : undefined
  const video = p.og.video ? absoluteUrl(p.og.video) : undefined
  return {
    title: p.title,
    description: p.description,
    openGraph: {
      title: p.title,
      description: p.description,
      type: "website",
      url: absoluteUrl(`/p/${slug}`),
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      videos: video ? [{ url: video, width: 1200, height: 630, type: "video/mp4" }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function PublicPrototypePage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params
  if (!getPublicPrototype(slug)) notFound()
  const Component = await loadPublicComponent(slug)
  if (!Component) notFound()
  return (
    <div className="flex flex-1 flex-col">
      <Component />
    </div>
  )
}
