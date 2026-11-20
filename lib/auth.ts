export const AUTH_COOKIE = "pg_auth"

/** Paths reachable without the password (public prototypes and the login flow). */
export const PUBLIC_PATHS = [/^\/login$/, /^\/api\/auth$/, /^\/p\//, /^\/api\/public\//, /^\/robots\.txt$/]

export function authEnabled() {
  return process.env.NODE_ENV === "production" && process.env.PLAYGROUND_AUTH_DISABLED !== "1"
}

/** The cookie stores a hash of the password, never the password itself. */
export async function tokenFor(password: string) {
  const data = new TextEncoder().encode(`prototype-playground:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function isValidToken(token: string | undefined) {
  const password = process.env.SITE_PASSWORD
  if (!password || !token) return false
  return safeEqual(token, await tokenFor(password))
}
