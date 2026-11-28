import { NextResponse } from "next/server"
import { trackDownload, unsplashKey } from "../../unsplash"

const PHOTO_ID = /^[A-Za-z0-9_-]{1,40}$/

/** POST { id } → 204. Fires Unsplash's download event for a photo that was shown. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { id?: unknown } | null
    const id = typeof body?.id === "string" ? body.id : ""
    if (!PHOTO_ID.test(id)) return NextResponse.json({ error: "Invalid photo id" }, { status: 400 })

    const key = unsplashKey()
    if (!key) return NextResponse.json({ error: "Photos aren't configured" }, { status: 503 })

    await trackDownload(id, key)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error("[nature-palettes] download", err)
    return NextResponse.json({ error: "Photo service unavailable" }, { status: 502 })
  }
}
