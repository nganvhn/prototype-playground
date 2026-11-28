import { NextResponse, type NextRequest } from "next/server"
import { byId } from "@/app/prototypes/nature-palettes/palette"
import { searchPhoto, unsplashKey } from "../unsplash"

/** GET /api/nature-palettes/photo?id=<combination id> → { photo } | { error } */
export async function GET(request: NextRequest) {
  // Read outside try/catch: this throws Next's prerender bail-out at build time, which must propagate.
  const id = request.nextUrl.searchParams.get("id") ?? ""
  try {
    // Only curated subjects can be searched, so the key can't be used for arbitrary queries.
    const combination = byId(id)
    if (!combination) return NextResponse.json({ error: "Unknown combination" }, { status: 400 })

    if (!unsplashKey()) return NextResponse.json({ error: "Photos aren't configured" }, { status: 503 })

    const photo = await searchPhoto(combination.query)
    if (!photo) return NextResponse.json({ error: "No photo found" }, { status: 404 })
    return NextResponse.json({ photo }, { headers: { "Cache-Control": "private, max-age=86400" } })
  } catch (err) {
    console.error("[nature-palettes] photo", err)
    return NextResponse.json({ error: "Photo service unavailable" }, { status: 502 })
  }
}
