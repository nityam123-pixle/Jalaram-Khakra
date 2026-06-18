"use client"
import { NextThemeProvider, ThemeAnimationType } from "@space-man/react-theme-animation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemeProvider defaultTheme="system" animationType={ThemeAnimationType.CIRCLE} duration={600}>
        <SidebarProvider>
          {children}
          <SonnerToaster />
        </SidebarProvider>
      </NextThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
