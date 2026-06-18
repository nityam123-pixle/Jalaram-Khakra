"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Clock3, CircleCheck, IndianRupee, Users, MapPin } from "lucide-react"

interface OrdersStatsProps {
  orders: any[]
}

export function OrdersStats({ orders }: OrdersStatsProps) {
  const stats = useMemo(() => {
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status?.toLowerCase() === "pending").length
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === "completed" || o.status?.toLowerCase() === "delivered").length

    // Sum revenue from items to avoid stale 0 values
    let totalRevenue = 0
    const uniqueCustomers = new Set()
    const uniqueCities = new Set()

    orders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          totalRevenue += Number(item.totalRevenue) || 0
        })
      }
      if (order.customerId) {
        uniqueCustomers.add(order.customerId)
      } else if (order.shop_name) {
        uniqueCustomers.add(order.shop_name)
      }
      if (order.city) {
        uniqueCities.add(order.city.trim().toLowerCase())
      }
    })

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      customersCount: uniqueCustomers.size,
      citiesCount: uniqueCities.size
    }
  }, [orders])

  const kpis = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      description: "All customer orders",
      icon: ShoppingCart,
      colorClass: "text-purple-600 dark:text-purple-400",
      bgClass: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40",
      iconBgClass: "bg-purple-100 dark:bg-purple-900/50"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      description: "Awaiting fulfillment",
      icon: Clock3,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40",
      iconBgClass: "bg-amber-100 dark:bg-amber-900/50"
    },
    {
      title: "Completed Orders",
      value: stats.completedOrders.toLocaleString(),
      description: "Successfully delivered",
      icon: CircleCheck,
      colorClass: "text-green-600 dark:text-green-400",
      bgClass: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40",
      iconBgClass: "bg-green-100 dark:bg-green-900/50"
    },
    {
      title: "Revenue",
      value: `₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")}`,
      description: "Total order revenue",
      icon: IndianRupee,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40",
      iconBgClass: "bg-emerald-100 dark:bg-emerald-900/50"
    },
    {
      title: "Customers",
      value: stats.customersCount.toLocaleString(),
      description: "Active buyers",
      icon: Users,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
      iconBgClass: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      title: "Cities",
      value: stats.citiesCount.toLocaleString(),
      description: "Order locations",
      icon: MapPin,
      colorClass: "text-rose-600 dark:text-rose-400",
      bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40",
      iconBgClass: "bg-rose-100 dark:bg-rose-900/50"
    }
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, idx) => {
        const IconComponent = kpi.icon
        return (
          <Card key={idx} className={`overflow-hidden border shadow-sm ${kpi.bgClass}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-full shrink-0 ${kpi.iconBgClass} ${kpi.colorClass}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
