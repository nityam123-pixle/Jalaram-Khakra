"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Clock3, CircleCheck, IndianRupee, Users, MapPin } from "lucide-react"

interface OrdersStatsProps {
  stats: {
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    totalRevenue: number
    customersCount: number
    citiesCount: number
  }
}

export function OrdersStats({ stats }: OrdersStatsProps) {
  const kpis = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      subLabel: "All Time",
      description: "Customer orders logged",
      icon: ShoppingCart,
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      subLabel: "Action Required",
      description: "Awaiting fulfillment",
      icon: Clock3,
      badge: stats.pendingOrders > 0 ? "Active" : undefined,
      badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Completed Orders",
      value: stats.completedOrders.toLocaleString(),
      subLabel: "Fulfilled",
      description: "Delivered successfully",
      icon: CircleCheck,
    },
    {
      title: "Total Revenue",
      value: `₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")}`,
      subLabel: "Gross Sales",
      description: "Combined order value",
      icon: IndianRupee,
    },
    {
      title: "Active Customers",
      value: stats.customersCount.toLocaleString(),
      subLabel: "Buyers",
      description: "Unique businesses",
      icon: Users,
    },
    {
      title: "Coverage Cities",
      value: stats.citiesCount.toLocaleString(),
      subLabel: "Locations",
      description: "Distribution network",
      icon: MapPin,
    }
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
