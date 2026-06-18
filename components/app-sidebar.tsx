"use client"

import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package2,
  BookOpen,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  PackageSearch,
  ArrowLeftRight,
  Building2,
  TrendingDown,
  BookMarked,
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

const navGroups = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Products", url: "/products", icon: Package2 },
      { title: "Catalogue", url: "/catalogue", icon: BookOpen },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Summary", url: "/summary", icon: BarChart3 },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Inventory", url: "/inventory", icon: Warehouse },
      { title: "Current Stock", url: "/inventory/current", icon: PackageSearch },
      { title: "Low Stock", url: "/inventory/low-stock", icon: TrendingDown },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { title: "Purchase Orders", url: "/inventory/purchase-orders", icon: ClipboardList },
      { title: "Incoming Stock", url: "/inventory/incoming", icon: Truck },
      { title: "Suppliers", url: "/inventory/suppliers", icon: Building2 },
      { title: "Stock Ledger", url: "/inventory/ledger", icon: BookMarked },
      { title: "Movements", url: "/inventory/movements", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Inventory Reports", url: "/inventory/reports", icon: FileText },
    ],
  },
]

const navSecondary = [{ title: "Settings", url: "/settings", icon: Settings2 }]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Khakra Orders">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-border bg-muted text-lg">
                  🌾
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Khakra Orders</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Order Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: "Jalaram Khakra", email: "jalaram@business.com" }} />
      </SidebarFooter>
    </Sidebar>
  )
}
