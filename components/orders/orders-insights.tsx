"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Landmark, Trophy, BarChart2, CalendarDays, RefreshCw } from "lucide-react"

interface OrdersInsightsProps {
  orders: any[]
}

export function OrdersInsights({ orders }: OrdersInsightsProps) {
  const insights = useMemo(() => {
    if (orders.length === 0) {
      return {
        topCity: "N/A",
        topProduct: "N/A",
        aov: 0,
        ordersThisMonth: 0,
        repeatPercent: 0
      }
    }

    // 1. Top City
    const cityCounts: Record<string, number> = {}
    orders.forEach(o => {
      if (o.city) {
        const city = o.city.trim()
        cityCounts[city] = (cityCounts[city] || 0) + 1
      }
    })
    let topCity = "N/A"
    let maxCityCount = 0
    Object.entries(cityCounts).forEach(([city, count]) => {
      if (count > maxCityCount) {
        maxCityCount = count
        topCity = city
      }
    })

    // 2. Top Product
    const productQuantities: Record<string, { qty: number; name: string }> = {}
    let totalRevenue = 0
    orders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const key = item.variantId || `${item.productName}-${item.variantName}`
          const displayName = `${item.productName} (${item.variantName})`
          const qty = Number(item.quantity) || 0
          totalRevenue += Number(item.totalRevenue) || 0
          
          if (!productQuantities[key]) {
            productQuantities[key] = { qty: 0, name: displayName }
          }
          productQuantities[key].qty += qty
        })
      }
    })

    let topProduct = "N/A"
    let maxProductQty = 0
    Object.entries(productQuantities).forEach(([_, data]) => {
      if (data.qty > maxProductQty) {
        maxProductQty = data.qty
        topProduct = data.name
      }
    })

    // 3. Average Order Value
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0

    // 4. Orders This Month
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const ordersThisMonth = orders.filter(o => {
      if (!o.created_at) return false
      const d = new Date(o.created_at)
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth
    }).length

    // 5. Repeat Customers
    const customerOrderCounts: Record<string, number> = {}
    orders.forEach(order => {
      const custId = order.customerId || order.shop_name
      if (custId) {
        customerOrderCounts[custId] = (customerOrderCounts[custId] || 0) + 1
      }
    })
    const totalCustomers = Object.keys(customerOrderCounts).length
    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count >= 2).length
    const repeatPercent = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0

    return {
      topCity,
      topProduct,
      aov,
      ordersThisMonth,
      repeatPercent
    }
  }, [orders])

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
