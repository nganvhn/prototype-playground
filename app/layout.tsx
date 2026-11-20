import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/site/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { siteUrl } from "@/lib/site-url"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Prototype Playground", template: "%s · Playground" },
  description: "A personal collection of small prototypes.",
  metadataBase: siteUrl(),
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
