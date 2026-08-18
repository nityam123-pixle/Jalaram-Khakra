"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Landmark, Trophy, BarChart2, CalendarDays, RefreshCw } from "lucide-react"

interface OrdersInsightsProps {
  stats: {
    topCity: string
    topProduct: string
    aov: number
    ordersThisMonth: number
    repeatPercent: number
  }
}

export function OrdersInsights({ stats }: OrdersInsightsProps) {
  const items = [
    {
      label: "Top City",
      value: stats.topCity || "None",
      icon: Landmark,
    },
    {
      label: "Top Product",
      value: stats.topProduct || "None",
      icon: Trophy,
    },
    {
      label: "Avg Order Value",
      value: `₹${Math.round(stats.aov || 0).toLocaleString("en-IN")}`,
      icon: BarChart2,
    },
    {
      label: "Orders This Month",
      value: (stats.ordersThisMonth || 0).toString(),
      icon: CalendarDays,
    },
    {
      label: "Repeat Customers",
      value: `${Math.round(stats.repeatPercent || 0)}%`,
      icon: RefreshCw,
    }
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item, idx) => {
        const IconComponent = item.icon
        return (
          <Card 
            key={idx} 
            className="border border-border bg-card shadow-sm rounded-xl overflow-hidden hover:border-ring/30 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">
                  {item.label}
                </p>
                <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate font-mono">
                  {item.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/60 dark:bg-secondary/40 text-muted-foreground border border-border/40 shrink-0">
                <IconComponent className="h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
