"use client"

import {
  BarChart3,
  LayoutDashboard,
  Package2,
  Settings2,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const navMain = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "All Orders", url: "/orders", icon: ShoppingCart },
  { title: "Summary", url: "/summary", icon: BarChart3 },
  { title: "Products", url: "/products", icon: Package2 },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Inventory", url: "/inventory", icon: Warehouse },
]

const navSecondary = [{ title: "Settings", url: "/settings", icon: Settings2 }]

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-border bg-muted text-lg">
                  🌾
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Khakra Orders</span>
                  <span className="truncate text-xs text-muted-foreground">Order Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: "Jalaram Khakra", email: "jalaram@business.com" }} />
      </SidebarFooter>
    </Sidebar>
  )
}
