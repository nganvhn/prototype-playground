import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in", robots: { index: false } }

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <h1 className="mb-6 text-lg font-medium">Playground</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
