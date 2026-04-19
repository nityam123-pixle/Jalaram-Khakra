import type React from "react"
import type { Metadata } from "next"
import { Outfit, JetBrains_Mono } from "next/font/google"

import { AppSidebar } from "@/components/app-sidebar"
import { Providers } from "@/components/providers"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Khakhra Orders — Jalaram Khakra",
  description: "Order management for Khakhra, Patra, and snacks",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <AppSidebar />
          <SidebarInset className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex flex-1 flex-col overflow-auto">{children}</main>
          </SidebarInset>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
