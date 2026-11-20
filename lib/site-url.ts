/** Absolute origin for OG tags. Set NEXT_PUBLIC_SITE_URL to override. */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return new URL(explicit)
  const vercel =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL
  if (vercel) return new URL(`https://${vercel}`)
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`)
}

export const absoluteUrl = (path: string) => new URL(path, siteUrl()).toString()
