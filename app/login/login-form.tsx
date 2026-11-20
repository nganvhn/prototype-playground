"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const params = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? "Login failed")
      }
      const next = params.get("next")
      window.location.assign(next && next.startsWith("/") && !next.startsWith("//") ? next : "/")
    } catch (err) {
      setError((err as Error).message)
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="password"
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        aria-label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-11"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-11" disabled={pending || !password}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
