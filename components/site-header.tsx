"use client"

import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"

import { NewOrderDialog } from "@/components/new-order-dialog"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "All Orders",
  "/summary": "Summary",
  "/products": "Products",
  "/customers": "Customers",
  "/inventory": "Inventory",
  "/settings": "Settings",
}

export function SiteHeader() {
  const pathname = usePathname() || "/"
  const title = titles[pathname] ?? "Khakhra Orders"

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 lg:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-base font-medium tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <NewOrderDialog
            trigger={
              <Button size="sm" variant="outline" className="hidden gap-1.5 sm:inline-flex">
                <Plus className="h-4 w-4" />
                New order
              </Button>
            }
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
