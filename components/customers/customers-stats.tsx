"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, RefreshCw } from "lucide-react"

interface CustomerStatsProps {
  stats: {
    totalCustomers: number
    activeCustomers: number
    activePct?: number
    repeatCustomers: number
    repeatPct?: number
  }
}

export function CustomersStats({ stats }: CustomerStatsProps) {
  const activePercentage =
    stats.activePct !== undefined
      ? stats.activePct.toFixed(1)
      : stats.totalCustomers > 0
      ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)
      : "0"

  const repeatPercentage =
    stats.repeatPct !== undefined
      ? Math.round(stats.repeatPct)
      : stats.totalCustomers > 0
      ? Math.round((stats.repeatCustomers / stats.totalCustomers) * 100)
      : 0

  const primaryCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      subLabel: "ALL TIME",
      description: "Registered businesses",
      icon: Users,
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers.toLocaleString(),
      badge: `${activePercentage}%`,
      badgeColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      description: "Placed at least 1 order",
      icon: UserCheck,
    },
    {
      title: "Repeat Customers",
      value: stats.repeatCustomers.toLocaleString(),
      badge: `${repeatPercentage}%`,
      badgeColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      description: "Ordered more than once",
      icon: RefreshCw,
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {primaryCards.map((card, idx) => {
        const IconComponent = card.icon
        return (
          <Card
            key={idx}
            className="border border-border bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden hover:border-ring/40 transition-colors"
          >
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <div className="p-2 rounded-lg bg-muted/60 dark:bg-secondary/40 text-muted-foreground border border-border/40">
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>

              <div className="my-3">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {card.value}
                </p>
              </div>

              <div className="bg-muted/30 dark:bg-black/20 border border-border/40 rounded-lg px-3 py-2 flex items-center justify-between text-xs mt-auto">
                <span className="text-muted-foreground font-medium truncate">{card.description}</span>
                {card.badge ? (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-muted-foreground/70 uppercase">
                    {card.subLabel}
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
