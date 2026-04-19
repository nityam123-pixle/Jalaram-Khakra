"use client"

import { useNextTheme } from "@space-man/react-theme-animation"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme, ref } = useNextTheme()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full"
      type="button"
      onClick={() => void toggleTheme()}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
