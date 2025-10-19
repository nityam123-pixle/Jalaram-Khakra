"use client"

import { Home, Package, Settings, ShoppingCart, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "All Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Summary",
    url: "/summary",
    icon: BarChart3,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="bg-background border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Khakhra Orders</span>
            <span className="text-sm text-muted-foreground">Order Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 text-sm font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground"
                  >
                    <Link href={item.url} className="flex items-center gap-4">
                      <item.icon className="h-6 w-6 text-muted-foreground" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
