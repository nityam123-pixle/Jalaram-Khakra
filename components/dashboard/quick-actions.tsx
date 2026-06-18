"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PlusCircle,
  UserPlus,
  Package,
  Download,
  Printer,
  Warehouse,
  FileText,
  MousePointerClick,
} from "lucide-react"

interface QuickActionsProps {
  onExport: () => void
}

export function QuickActions({ onExport }: QuickActionsProps) {
  const actions = [
    {
      title: "Create Order",
      desc: "Place new sales order",
      icon: PlusCircle,
      href: "/orders/new",
      colorClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Add Customer",
      desc: "Register new shop owner",
      icon: UserPlus,
      href: "/customers",
      colorClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Manage Products",
      desc: "Edit catalog & pricing",
      icon: Package,
      href: "/products",
      colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Export Report",
      desc: "Download sales logs CSV",
      icon: Download,
      onClick: onExport,
      colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "View Inventory",
      desc: "Track variant stock levels",
      icon: Warehouse,
      href: "/inventory",
      colorClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Print Summary",
      desc: "Show physical summary page",
      icon: Printer,
      href: "/summary",
      colorClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Generate Invoice",
      desc: "Access invoice print records",
      icon: FileText,
      href: "/orders",
      colorClass: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
  ]

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b border-border/60">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">Quick Business Actions</CardTitle>
          <CardDescription className="text-xs">One-click shortcut links for operational workflows</CardDescription>
        </div>
        <MousePointerClick className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {actions.map((act, idx) => {
            const IconComponent = act.icon
            const Wrapper = act.href ? "a" : "button"
            const wrapperProps = act.href ? { href: act.href } : { onClick: act.onClick }

            return (
              <Wrapper
                key={idx}
                {...(wrapperProps as any)}
                className="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/10 hover:border-border transition-all duration-150 shadow-xs hover:scale-[1.015] outline-none group"
              >
                <div className={`p-2.5 rounded-xl border shrink-0 mb-3 transition-transform group-hover:scale-105 ${act.colorClass}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground block truncate max-w-full">
                  {act.title}
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5 block truncate max-w-full hidden sm:block">
                  {act.desc}
                </span>
              </Wrapper>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
