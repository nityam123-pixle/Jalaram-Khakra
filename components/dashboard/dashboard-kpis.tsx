"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  MapPin,
  Package,
  Activity,
  ArrowUpRight,
  TrendingUpIcon,
} from "lucide-react"

interface DashboardKPIsProps {
  currentOrders: any[]
  priorOrders: any[]
  totalCustomers: number
  priorCustomersCount: number
}

// Inline SVG Sparkline helper
function Sparkline({ data, colorClass }: { data: number[]; colorClass: string }) {
  const points = useMemo(() => {
    if (!data || data.length <= 1) return ""
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min === 0 ? 1 : max - min
    const width = 50
    const height = 16
    return data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width
        const y = height - 1 - ((val - min) / range) * (height - 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ")
  }, [data])

  if (!points) return null

  return (
    <svg width="50" height="16" className={`overflow-visible ${colorClass}`}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function DashboardKPIs({
  currentOrders,
  priorOrders,
  totalCustomers,
  priorCustomersCount,
}: DashboardKPIsProps) {
  const stats = useMemo(() => {
    // Current Period Metrics
    let currentRevenue = 0
    let currentProfit = 0
    const currentUniqueCities = new Set<string>()
    const currentUniqueCats = new Set<string>()
    const currentCustomerFreq: Record<string, number> = {}

    currentOrders.forEach((o) => {
      if (o.city) currentUniqueCities.add(o.city.trim().toLowerCase())
      const items = o.items ?? []
      items.forEach((item: any) => {
        currentRevenue += Number(item.totalRevenue) || 0
        currentProfit += Number(item.totalProfit) || 0
        if (item.categoryName) currentUniqueCats.add(item.categoryName.trim())
      })
      const custId = o.customerId || o.shop_name
      if (custId) {
        currentCustomerFreq[custId] = (currentCustomerFreq[custId] || 0) + 1
      }
    })

    const currentOrdersCount = currentOrders.length
    const currentAOV = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0
    const currentRepeatCust = Object.values(currentCustomerFreq).filter((cnt) => cnt >= 2).length
    const currentTotalCustCount = Object.keys(currentCustomerFreq).length
    const currentRepeatRate = currentTotalCustCount > 0 ? (currentRepeatCust / currentTotalCustCount) * 100 : 0

    // Prior Period Metrics
    let priorRevenue = 0
    let priorProfit = 0
    const priorUniqueCities = new Set<string>()
    const priorUniqueCats = new Set<string>()
    const priorCustomerFreq: Record<string, number> = {}

    priorOrders.forEach((o) => {
      if (o.city) priorUniqueCities.add(o.city.trim().toLowerCase())
      const items = o.items ?? []
      items.forEach((item: any) => {
        priorRevenue += Number(item.totalRevenue) || 0
        priorProfit += Number(item.totalProfit) || 0
        if (item.categoryName) priorUniqueCats.add(item.categoryName.trim())
      })
      const custId = o.customerId || o.shop_name
      if (custId) {
        priorCustomerFreq[custId] = (priorCustomerFreq[custId] || 0) + 1
      }
    })

    const priorOrdersCount = priorOrders.length
    const priorAOV = priorOrdersCount > 0 ? priorRevenue / priorOrdersCount : 0
    const priorRepeatCust = Object.values(priorCustomerFreq).filter((cnt) => cnt >= 2).length
    const priorTotalCustCount = Object.keys(priorCustomerFreq).length
    const priorRepeatRate = priorTotalCustCount > 0 ? (priorRepeatCust / priorTotalCustCount) * 100 : 0

    // Helper to compute percentage trend
    const getTrend = (current: number, prior: number) => {
      if (prior === 0) return current > 0 ? 100 : 0
      return Math.round(((current - prior) / prior) * 100)
    };

    // Construct sparkline data (e.g. daily breakdown, default to simple values if small)
    const getSparklineData = (ordersList: any[], field: "revenue" | "profit" | "orders") => {
      if (ordersList.length === 0) return [0, 0]
      const dailyMap: Record<string, number> = {}
      ordersList.forEach((o) => {
        const d = o.created_at ? new Date(o.created_at).toISOString().split("T")[0] : "N/A"
        let val = 0
        if (field === "orders") {
          val = 1
        } else if (field === "revenue") {
          val = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
        } else {
          val = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalProfit), 0)
        }
        dailyMap[d] = (dailyMap[d] || 0) + val
      })
      const sortedDays = Object.keys(dailyMap).sort()
      if (sortedDays.length <= 1) {
        return [0, ...sortedDays.map((d) => dailyMap[d])]
      }
      return sortedDays.map((d) => dailyMap[d])
    };

    return {
      revenue: {
        val: currentRevenue,
        trend: getTrend(currentRevenue, priorRevenue),
        spark: getSparklineData(currentOrders, "revenue"),
      },
      profit: {
        val: currentProfit,
        trend: getTrend(currentProfit, priorProfit),
        spark: getSparklineData(currentOrders, "profit"),
      },
      orders: {
        val: currentOrdersCount,
        trend: getTrend(currentOrdersCount, priorOrdersCount),
        spark: getSparklineData(currentOrders, "orders"),
      },
      customers: {
        val: totalCustomers,
        trend: getTrend(totalCustomers, priorCustomersCount),
      },
      aov: {
        val: currentAOV,
        trend: getTrend(currentAOV, priorAOV),
      },
      repeatRate: {
        val: currentRepeatRate,
        trend: getTrend(currentRepeatRate, priorRepeatRate),
      },
      cities: {
        val: currentUniqueCities.size,
        trend: getTrend(currentUniqueCities.size, priorUniqueCities.size),
      },
      categories: {
        val: currentUniqueCats.size,
      },
    }
  }, [currentOrders, priorOrders, totalCustomers, priorCustomersCount])

  const renderTrend = (value: number) => {
    if (value === 0) return null
    const isUp = value > 0
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isUp
            ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
            : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30"
        }`}
      >
        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isUp ? "+" : ""}
        {value}%
      </span>
    )
  }

  const kpiList = [
    {
      title: "Revenue",
      value: `₹${Math.round(stats.revenue.val).toLocaleString("en-IN")}`,
      subtitle: "vs previous period",
      icon: IndianRupee,
      trend: stats.revenue.trend,
      spark: stats.revenue.spark,
      iconClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40",
      sparkColor: "text-emerald-500",
    },
    {
      title: "Profit",
      value: `₹${Math.round(stats.profit.val).toLocaleString("en-IN")}`,
      subtitle: "vs previous period",
      icon: Activity,
      trend: stats.profit.trend,
      spark: stats.profit.spark,
      iconClass: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40",
      sparkColor: "text-green-500",
    },
    {
      title: "Orders",
      value: stats.orders.val.toLocaleString(),
      subtitle: "vs previous period",
      icon: ShoppingCart,
      trend: stats.orders.trend,
      spark: stats.orders.spark,
      iconClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40",
      sparkColor: "text-purple-500",
    },
    {
      title: "Customers",
      value: stats.customers.val.toLocaleString(),
      subtitle: "total registered",
      icon: Users,
      trend: stats.customers.trend,
      iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
    },
    {
      title: "Avg Order Value",
      value: `₹${Math.round(stats.aov.val).toLocaleString("en-IN")}`,
      subtitle: "vs previous period",
      icon: ArrowUpRight,
      trend: stats.aov.trend,
      iconClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40",
    },
    {
      title: "Repeat Cust. Rate",
      value: `${Math.round(stats.repeatRate.val)}%`,
      subtitle: "vs prior period",
      icon: Activity,
      trend: stats.repeatRate.trend,
      iconClass: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40",
    },
    {
      title: "Cities Served",
      value: stats.cities.val.toLocaleString(),
      subtitle: "with active orders",
      icon: MapPin,
      trend: stats.cities.trend,
      iconClass: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40",
    },
    {
      title: "Active Products",
      value: `${stats.categories.val} Categories`,
      subtitle: "in active catalog",
      icon: Package,
      iconClass: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/40",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {kpiList.map((kpi, idx) => {
        const IconComponent = kpi.icon
        return (
          <Card key={idx} className="border border-border/80 bg-card hover:bg-muted/5 transition-all duration-200 shadow-sm rounded-2xl group">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border shrink-0 ${kpi.iconClass}`}>
                  <IconComponent className="h-4.5 w-4.5" />
                </div>
                {/* Trend Badge or Sparkline */}
                <div className="flex items-center gap-3">
                  {kpi.spark && kpi.sparkColor && (
                    <Sparkline data={kpi.spark} colorClass={kpi.sparkColor} />
                  )}
                  {kpi.trend !== undefined && renderTrend(kpi.trend)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{kpi.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
