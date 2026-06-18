"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Landmark, Trophy, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface TopPerformersProps {
  currentOrders: any[]
  priorOrders: any[]
}

import { getCategoryColor } from "./product-performance"

export function TopPerformers({ currentOrders, priorOrders }: TopPerformersProps) {
  // 1. Calculate Top Cities dynamically
  const { topCitiesList, totalRevenue } = useMemo(() => {
    const currentCityStats: Record<
      string,
      { revenue: number; profit: number; orders: number; categoryRevenue: Record<string, number> }
    > = {}
    let totalRevenue = 0

    currentOrders.forEach((o) => {
      if (o.city) {
        const city = o.city.trim().toLowerCase()
        const rev = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
        const profit = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalProfit), 0)
        totalRevenue += rev

        if (!currentCityStats[city]) {
          currentCityStats[city] = { revenue: 0, profit: 0, orders: 0, categoryRevenue: {} }
        }
        currentCityStats[city].revenue += rev
        currentCityStats[city].profit += profit
        currentCityStats[city].orders += 1

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
      const topCat = Object.entries(data.categoryRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || "Other"

      return {
        name: city,
        revenue: data.revenue,
        profit: data.profit,
        orders: data.orders,
        growth,
        topCat,
      }
    })

    return {
      topCitiesList: list.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      totalRevenue,
    }
  }, [currentOrders, priorOrders])

  // 2. Calculate Top Products dynamically
  const topProductsList = useMemo(() => {
    const currentProductStats: Record<
      string,
      { revenue: number; profit: number; quantity: number; categoryName: string }
    > = {}
    currentOrders.forEach((o) => {
      const items = o.items ?? []
      items.forEach((item: any) => {
        const pName = item.productName || "Unknown"
        if (!currentProductStats[pName]) {
          currentProductStats[pName] = {
            revenue: 0,
            profit: 0,
            quantity: 0,
            categoryName: item.categoryName || "Other",
          }
        }
        currentProductStats[pName].revenue += Number(item.totalRevenue) || 0
        currentProductStats[pName].profit += Number(item.totalProfit) || 0
        currentProductStats[pName].quantity += Number(item.quantity) || 0
      })
    })

    const priorProductStats: Record<string, { revenue: number }> = {}
    priorOrders.forEach((o) => {
      const items = o.items ?? []
      items.forEach((item: any) => {
        const pName = item.productName || "Unknown"
        if (!priorProductStats[pName]) {
          priorProductStats[pName] = { revenue: 0 }
        }
        priorProductStats[pName].revenue += Number(item.totalRevenue) || 0
      })
    })

    const list = Object.entries(currentProductStats).map(([name, data]) => {
      const priorRev = priorProductStats[name]?.revenue || 0
      const growth = priorRev > 0 ? ((data.revenue - priorRev) / priorRev) * 100 : 0
      const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0

      return {
        name,
        revenue: data.revenue,
        profit: data.profit,
        quantity: data.quantity,
        growth,
        margin,
        categoryName: data.categoryName,
      }
    })

    return list.sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [currentOrders, priorOrders])

  const renderRankMedal = (index: number) => {
    switch (index) {
      case 0:
        return (
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 text-xs font-extrabold border border-amber-500/20 shadow-xs shrink-0">
            🥇
          </span>
        )
      case 1:
        return (
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-400/15 text-slate-400 text-xs font-extrabold border border-slate-300/20 shadow-xs shrink-0">
            🥈
          </span>
        )
      case 2:
        return (
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-700/15 text-amber-700 text-xs font-extrabold border border-amber-600/20 shadow-xs shrink-0">
            🥉
          </span>
        )
      default:
        return (
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-bold shrink-0">
            {index + 1}
          </span>
        )
    }
  }

  const renderGrowthTrend = (growth: number) => {
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
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {/* Top Cities */}
      <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b border-border/60">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground">Top Cities</CardTitle>
            <CardDescription className="text-xs">Location performance ranked by gross revenue</CardDescription>
          </div>
          <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {topCitiesList.map((city, idx) => {
              const contribution = totalRevenue > 0 ? (city.revenue / totalRevenue) * 100 : 0
              const meta = getCategoryColor(city.topCat)
              return (
                <div key={city.name} className="px-5 py-4 hover:bg-muted/10 transition-colors space-y-2">
                  <div className="flex items-center gap-4">
                    {renderRankMedal(idx)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate capitalize">{city.name}</p>
                        <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-full">
                          {city.orders} orders
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Profit: ₹{Math.round(city.profit).toLocaleString("en-IN")} • {contribution.toFixed(0)}% contribution
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        ₹{Math.round(city.revenue).toLocaleString("en-IN")}
                      </p>
                      <div className="mt-0.5">{renderGrowthTrend(city.growth)}</div>
                    </div>
                  </div>
                  {/* Contribution bar styled by main category in that city */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden shadow-xs">
                    <div
                      className={`h-full rounded-full ${meta.bg}`}
                      style={{ width: `${contribution}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {topCitiesList.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">No city sales data available.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b border-border/60">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground">Top Selling Products</CardTitle>
            <CardDescription className="text-xs">Product rankings based on sales value</CardDescription>
          </div>
          <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {topProductsList.map((prod, idx) => {
              const meta = getCategoryColor(prod.categoryName)
              return (
                <div key={prod.name} className="px-5 py-4 hover:bg-muted/10 transition-colors space-y-2">
                  <div className="flex items-center gap-4">
                    {renderRankMedal(idx)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{prod.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.lightBg} ${meta.text}`}>
                          {prod.categoryName}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Units: {Math.round(prod.quantity)} • Profit: ₹{Math.round(prod.profit).toLocaleString("en-IN")} ({prod.margin.toFixed(0)}% margin)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        ₹{Math.round(prod.revenue).toLocaleString("en-IN")}
                      </p>
                      <div className="mt-0.5">{renderGrowthTrend(prod.growth)}</div>
                    </div>
                  </div>
                  {/* Visual volume track bar styled by category */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden shadow-xs">
                    <div
                      className={`h-full rounded-full ${meta.bg}`}
                      style={{ width: `${Math.min(prod.margin * 2, 100)}%` }} // representing margin or generic fill level
                    />
                  </div>
                </div>
              )
            })}
            {topProductsList.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">No product sales data available.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
