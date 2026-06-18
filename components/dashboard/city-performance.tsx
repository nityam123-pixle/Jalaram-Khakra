"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Landmark, ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react"

interface CityPerformanceProps {
  currentOrders: any[]
  priorOrders: any[]
}

import { getCategoryColor } from "./product-performance"

export function CityPerformance({ currentOrders, priorOrders }: CityPerformanceProps) {
  const cityStats = useMemo(() => {
    const currentCityStats: Record<
      string,
      { orders: number; revenue: number; profit: number; categoryRevenue: Record<string, number> }
    > = {}
    let totalRevenue = 0

    currentOrders.forEach((o) => {
      if (o.city) {
        const city = o.city.trim().toLowerCase()
        const rev = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
        const profit = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalProfit), 0)

        totalRevenue += rev

        if (!currentCityStats[city]) {
          currentCityStats[city] = { orders: 0, revenue: 0, profit: 0, categoryRevenue: {} }
        }
        currentCityStats[city].orders += 1
        currentCityStats[city].revenue += rev
        currentCityStats[city].profit += profit

        ;(o.items ?? []).forEach((item: any) => {
          const cat = item.categoryName || "Other"
          currentCityStats[city].categoryRevenue[cat] =
            (currentCityStats[city].categoryRevenue[cat] || 0) + Number(item.totalRevenue)
        })
      }
    })

    const priorCityStats: Record<string, { revenue: number }> = {}
    priorOrders.forEach((o) => {
      if (o.city) {
        const city = o.city.trim().toLowerCase()
        const rev = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
        if (!priorCityStats[city]) {
          priorCityStats[city] = { revenue: 0 }
        }
        priorCityStats[city].revenue += rev
      }
    })

    const list = Object.entries(currentCityStats).map(([city, data]) => {
      const priorRev = priorCityStats[city]?.revenue || 0
      const growth = priorRev > 0 ? ((data.revenue - priorRev) / priorRev) * 100 : 0
      const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      const topCat = Object.entries(data.categoryRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || "Other"

      return {
        name: city,
        orders: data.orders,
        revenue: data.revenue,
        profit: data.profit,
        growth,
        pct,
        topCat,
      }
    })

    return list.sort((a, b) => b.revenue - a.revenue)
  }, [currentOrders, priorOrders])

  const renderGrowth = (growth: number) => {
    if (growth === 0) return <span className="text-[10px] text-muted-foreground font-medium">Flat</span>
    const isUp = growth > 0
    return (
      <span
        className={`inline-flex items-center text-[10px] font-bold ${
          isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {isUp ? (
          <ArrowUpRight className="h-3 w-3 shrink-0" />
        ) : (
          <ArrowDownRight className="h-3 w-3 shrink-0" />
        )}
        {Math.abs(growth).toFixed(0)}%
      </span>
    )
  }

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b border-border/60">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">City Performance Map</CardTitle>
          <CardDescription className="text-xs">Geographical orders contribution and growth leaderboard</CardDescription>
        </div>
        <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {cityStats.map((city) => {
            const meta = getCategoryColor(city.topCat)
            return (
              <div key={city.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="min-w-0">
                    <span className="text-foreground capitalize font-bold block">{city.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {city.orders} {city.orders === 1 ? "order" : "orders"} • Profit: ₹
                      {Math.round(city.profit).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-foreground font-bold flex items-center justify-end gap-0.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      {Math.round(city.revenue).toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {city.pct.toFixed(0)}% contribution
                      </span>
                      {renderGrowth(city.growth)}
                    </div>
                  </div>
                </div>
                {/* Custom category-colored progress bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-xs">
                  <div
                    className={`h-full rounded-full ${meta.bg}`}
                    style={{ width: `${city.pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {cityStats.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">No geographical sales data available.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
