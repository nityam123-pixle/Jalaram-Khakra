import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Khakhra Orders - Order Management System",
  description: "Modern order management system for Khakhra and Patra business",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
              <AppSidebar />
              <SidebarInset className="flex flex-col min-w-0 flex-1">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">Khakhra Order Management</h1>
                  </div>
                </header>
                <main className="flex-1 overflow-auto min-h-0">
                  <div className="h-full">{children}</div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
