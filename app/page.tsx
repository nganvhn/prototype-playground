import { Gallery } from "@/components/gallery/gallery"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { getAllPrototypes, getAllTags } from "@/lib/prototypes"

export default function Home() {
  const prototypes = getAllPrototypes()

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium">Playground</h1>
        <ThemeToggle />
      </header>
      <Gallery prototypes={prototypes} tags={getAllTags(prototypes)} />
    </main>
  )
}
