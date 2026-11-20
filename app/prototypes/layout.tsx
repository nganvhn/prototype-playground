import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/site/theme-toggle"

export default function PrototypesLayout({ children }: LayoutProps<"/prototypes">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="site-chrome flex items-center justify-between px-2 pt-2">
        <Button asChild variant="ghost" size="icon" className="size-11" aria-label="All prototypes">
          <Link href="/">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <ThemeToggle />
      </header>
      {children}
    </div>
  )
}
