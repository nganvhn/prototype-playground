import { NextResponse } from "next/server"
import { AUTH_COOKIE, safeEqual, tokenFor } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const password = process.env.SITE_PASSWORD
    if (!password) {
      return NextResponse.json({ error: "SITE_PASSWORD is not configured" }, { status: 500 })
    }
    const body = (await request.json().catch(() => ({}))) as { password?: unknown }
    const given = typeof body.password === "string" ? body.password : ""
    const [a, b] = await Promise.all([tokenFor(given), tokenFor(password)])
    if (!safeEqual(a, b)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(AUTH_COOKIE, b, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    })
    return res
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(AUTH_COOKIE)
  return res
}
