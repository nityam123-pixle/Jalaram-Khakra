"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Truck, Clock3, AlertCircle, CheckCircle2, AlertTriangle, Building2 } from "lucide-react"

export interface IncomingStatsData {
  totalShipments: number
  inTransitCount: number
  arrivedCount: number
  completedCount: number
  overdueCount: number
  suppliersCount: number
}

interface IncomingStatsProps {
  stats: IncomingStatsData
}

export function IncomingStats({ stats }: IncomingStatsProps) {
  const kpis = [
    {
      title: "Total Freight Shipments",
      value: stats.totalShipments.toLocaleString(),
      subLabel: "Logistics",
      description: "Shipments tracked",
      icon: Truck,
    },
    {
      title: "In Transit",
      value: stats.inTransitCount.toLocaleString(),
      subLabel: "En Route",
      description: "On the road",
      icon: Clock3,
      badge: stats.inTransitCount > 0 ? "In Transit" : undefined,
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Arrived / Ready for Intake",
      value: stats.arrivedCount.toLocaleString(),
      subLabel: "Action Required",
      description: "Awaiting inspection",
      icon: AlertCircle,
      badge: stats.arrivedCount > 0 ? "Arrived" : undefined,
      badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Completed Intake",
      value: stats.completedCount.toLocaleString(),
      subLabel: "Processed",
      description: "Stock ledger updated",
      icon: CheckCircle2,
    },
    {
      title: "Overdue Shipments",
      value: stats.overdueCount.toLocaleString(),
      subLabel: "Attention",
      description: "Delayed arrivals",
      icon: AlertTriangle,
      badge: stats.overdueCount > 0 ? "Delayed" : undefined,
      badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Origin Suppliers",
      value: stats.suppliersCount.toLocaleString(),
      subLabel: "Vendors",
      description: "Active suppliers shipping",
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
