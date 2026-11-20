import { NextResponse, type NextRequest } from "next/server"
import { AUTH_COOKIE, PUBLIC_PATHS, authEnabled, isValidToken } from "@/lib/auth"
import { publicSlugs } from "@/lib/public-slugs.generated"

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // /p/<slug>: unknown or private slugs get a real 404 status, never a login redirect.
  const publicMatch = pathname.match(/^\/p\/([^/]+)\/?$/)
  if (publicMatch && !publicSlugs.includes(decodeURIComponent(publicMatch[1]))) {
    return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } })
  }

  if (!authEnabled()) return NextResponse.next()

  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return NextResponse.next()

  if (await isValidToken(request.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|thumbnails/).*)"],
}
