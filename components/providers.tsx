"use client"
import { NextThemeProvider, ThemeAnimationType } from "@space-man/react-theme-animation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider defaultTheme="system" animationType={ThemeAnimationType.CIRCLE} duration={600}>
      <SidebarProvider>
        {children}
        <SonnerToaster />
      </SidebarProvider>
    </NextThemeProvider>
  )
}
