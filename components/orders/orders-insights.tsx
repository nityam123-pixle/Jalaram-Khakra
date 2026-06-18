"use client"

import { useMemo } from "react"
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
  const insights = stats;

  const items = [
    {
      label: "Top City",
      value: insights.topCity,
      icon: Landmark,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      label: "Top Product",
      value: insights.topProduct,
      icon: Trophy,
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      label: "Avg Order Value",
      value: `₹${Math.round(insights.aov).toLocaleString("en-IN")}`,
      icon: BarChart2,
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      label: "Orders This Month",
      value: insights.ordersThisMonth.toString(),
      icon: CalendarDays,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      label: "Repeat Customers",
      value: `${Math.round(insights.repeatPercent)}%`,
      icon: RefreshCw,
      color: "text-rose-600 dark:text-rose-400"
    }
  ]

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item, idx) => {
        const IconComponent = item.icon
        return (
          <Card key={idx} className="border border-border/60 bg-muted/20 dark:bg-muted/5 shadow-none rounded-lg">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{item.label}</p>
                <p className="text-sm font-bold text-foreground mt-1 truncate">{item.value}</p>
              </div>
              <IconComponent className={`h-4 w-4 shrink-0 ${item.color}`} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
