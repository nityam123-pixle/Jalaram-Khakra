"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, Clock3, Truck, CheckCircle2, IndianRupee, Building2 } from "lucide-react"

export interface POStatsData {
  totalPOs: number
  draftCount: number
  inTransitCount: number
  receivedCount: number
  totalSpend: number
  suppliersCount: number
}

interface POStatsProps {
  stats: POStatsData
}

export function POStats({ stats }: POStatsProps) {
  const kpis = [
    {
      title: "Total Purchase Orders",
      value: stats.totalPOs.toLocaleString(),
      subLabel: "All Time",
      description: "Procurement volume",
      icon: ClipboardList,
    },
    {
      title: "Draft / Pending",
      value: stats.draftCount.toLocaleString(),
      subLabel: "Action Required",
      description: "Ready to confirm",
      icon: Clock3,
      badge: stats.draftCount > 0 ? "Draft" : undefined,
      badgeColor: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    },
    {
      title: "Ordered & In Transit",
      value: stats.inTransitCount.toLocaleString(),
      subLabel: "On The Way",
      description: "Active transport",
      icon: Truck,
      badge: stats.inTransitCount > 0 ? "In Transit" : undefined,
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Received / Fulfilled",
      value: stats.receivedCount.toLocaleString(),
      subLabel: "Fulfilled",
      description: "Added to stock ledger",
      icon: CheckCircle2,
    },
    {
      title: "Procurement Spend",
      value: `₹${Math.round(stats.totalSpend).toLocaleString("en-IN")}`,
      subLabel: "Total Billed",
      description: "Vendor invoice amount",
      icon: IndianRupee,
    },
    {
      title: "Active Suppliers",
      value: stats.suppliersCount.toLocaleString(),
      subLabel: "Vendors",
      description: "Supplying network",
      icon: Building2,
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, idx) => {
        const IconComponent = kpi.icon
        return (
          <Card
            key={idx}
            className="border border-border bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden hover:border-ring/40 transition-colors"
          >
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {kpi.title}
                </p>
                <div className="p-2 rounded-lg bg-muted/60 dark:bg-secondary/40 text-muted-foreground border border-border/40">
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>

              <div className="my-3">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {kpi.value}
                </p>
              </div>

              <div className="bg-muted/30 dark:bg-black/20 border border-border/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs mt-auto">
                <span className="text-muted-foreground font-medium truncate">{kpi.description}</span>
                {kpi.badge ? (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${kpi.badgeColor}`}>
                    {kpi.badge}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-muted-foreground/70 uppercase">
                    {kpi.subLabel}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
