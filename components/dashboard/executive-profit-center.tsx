"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { IndianRupee, PieChart as PieIcon, BarChart3, TrendingUp, Trophy, AlertTriangle, Lightbulb } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
} from "recharts"

interface ExecutiveProfitCenterProps {
  currentOrders: any[]
  priorOrders?: any[]
  customers?: any[]
}

import { getCategoryColor } from "./product-performance"

export function ExecutiveProfitCenter({
  currentOrders,
  priorOrders = [],
  customers = [],
}: ExecutiveProfitCenterProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const stats = useMemo(() => {
    const breakdown: Record<
      string,
      { name: string; revenue: number; cost: number; profit: number; units: number }
    > = {}

    let totalRevenue = 0
    let totalCost = 0
    let totalUnits = 0

    currentOrders.forEach((order) => {
      const items = order.items ?? []
      items.forEach((item: any) => {
        const cat = item.categoryName || "Other"
        const rev = Number(item.totalRevenue) || 0
        const cost = Number(item.totalCost) || 0
        const profit = Number(item.totalProfit) || 0
        const qty = Number(item.quantity) || 0

        totalRevenue += rev
        totalCost += cost
        totalUnits += qty

        if (!breakdown[cat]) {
          breakdown[cat] = { name: cat, revenue: 0, cost: 0, profit: 0, units: 0 }
        }
        breakdown[cat].revenue += rev
        breakdown[cat].cost += cost
        breakdown[cat].profit += profit
        breakdown[cat].units += qty
      })
    })

    const totalProfit = totalRevenue - totalCost
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const totalOrdersCount = currentOrders.length
    const currentAOV = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0

    // Repeat rate for current period
    const currentCustFreq: Record<string, number> = {}
    currentOrders.forEach((o) => {
      const custId = o.customerId || o.shop_name
      if (custId) {
        currentCustFreq[custId] = (currentCustFreq[custId] || 0) + 1
      }
    })
    const repeatCust = Object.values(currentCustFreq).filter((cnt) => cnt >= 2).length
    const totalCustCount = Object.keys(currentCustFreq).length
    const currentRepeatRate = totalCustCount > 0 ? (repeatCust / totalCustCount) * 100 : 0

    // Prior period calculations
    let priorRevenue = 0
    let priorCost = 0
    let priorUnits = 0
    const priorBreakdown: Record<string, { revenue: number; profit: number }> = {}

    priorOrders.forEach((order) => {
      const items = order.items ?? []
      items.forEach((item: any) => {
        const cat = item.categoryName || "Other"
        const rev = Number(item.totalRevenue) || 0
        const cost = Number(item.totalCost) || 0
        const profit = Number(item.totalProfit) || 0
        const qty = Number(item.quantity) || 0

        priorRevenue += rev
        priorCost += cost
        priorUnits += qty

        if (!priorBreakdown[cat]) {
          priorBreakdown[cat] = { revenue: 0, profit: 0 }
        }
        priorBreakdown[cat].revenue += rev
        priorBreakdown[cat].profit += profit
      })
    })

    const priorProfit = priorRevenue - priorCost

    // Growth rates
    const revenueGrowth = priorRevenue > 0 ? ((totalRevenue - priorRevenue) / priorRevenue) * 100 : 0
    const profitGrowth = priorProfit > 0 ? ((totalProfit - priorProfit) / priorProfit) * 100 : 0

    const list = Object.values(breakdown).map((item) => {
      const contributionRev = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
      const contributionProfit = totalProfit > 0 ? (item.profit / totalProfit) * 100 : 0
      const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0

      // Category specific trend comparison
      const priorCatRev = priorBreakdown[item.name]?.revenue || 0
      const priorCatProfit = priorBreakdown[item.name]?.profit || 0
      const revTrend = priorCatRev > 0 ? ((item.revenue - priorCatRev) / priorCatRev) * 100 : 0
      const profitTrend = priorCatProfit > 0 ? ((item.profit - priorCatProfit) / priorCatProfit) * 100 : 0

      return {
        ...item,
        margin,
        contributionRev,
        contributionProfit,
        revTrend,
        profitTrend,
      }
    })

    // Sort by profit desc
    const sortedList = [...list].sort((a, b) => b.profit - a.profit)

    // Generate dynamic financial insights
    const profitInsights: string[] = []
    if (sortedList.length > 0) {
      const top = sortedList[0]
      const topPercent = totalRevenue > 0 ? (top.revenue / totalRevenue) * 100 : 0
      profitInsights.push(`🏆 ${top.name} remains your dominant category, contributing ${topPercent.toFixed(0)}% of total revenue.`)

      const highMargin = [...list]
        .filter((c) => c.revenue >= 5000)
        .sort((a, b) => b.margin - a.margin)[0]
      if (highMargin) {
        profitInsights.push(`💰 ${highMargin.name} delivers your highest profit margin at ${highMargin.margin.toFixed(1)}%.`)
      }

      const lowMargin = list.find((c) => c.margin < 5 && c.revenue > 2000)
      if (lowMargin) {
        profitInsights.push(`⚠️ ${lowMargin.name} has low profitability (${lowMargin.margin.toFixed(1)}% margin). Review item costings.`)
      } else {
        profitInsights.push(`📈 All major categories maintain stable profit margins above 10%.`)
      }
    }

    return {
      list: sortedList,
      totalRevenue,
      totalProfit,
      overallMargin,
      totalUnits,
      totalOrdersCount,
      currentAOV,
      currentRepeatRate,
      revenueGrowth,
      profitGrowth,
      insights: profitInsights,
    }
  }, [currentOrders, priorOrders])

  const revenueChartData = useMemo(() => {
    return stats.list.map((c) => ({
      name: c.name,
      value: Math.round(c.revenue),
    }))
  }, [stats.list])

  const profitChartData = useMemo(() => {
    return stats.list.map((c) => ({
      name: c.name,
      value: Math.round(c.profit),
    }))
  }, [stats.list])

  const qtyChartData = useMemo(() => {
    return stats.list
      .map((c) => ({
        name: c.name,
        quantity: Math.round(c.units),
      }))
      .sort((a, b) => b.quantity - a.quantity)
  }, [stats.list])

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-md text-xs font-semibold text-popover-foreground">
          <p className="font-bold border-b border-border pb-1 mb-1">{payload[0].name}</p>
          <p className="text-foreground">
            Value: {payload[0].value.toLocaleString("en-IN")}
          </p>
        </div>
      )
    }
    return null
  }

  const renderTrend = (val: number) => {
    if (val === 0) return <span className="text-[10px] text-muted-foreground">Flat</span>
    const isUp = val > 0
    return (
      <span className={`inline-flex items-center gap-0.5 font-bold ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
        {isUp ? "↑" : "↓"} {Math.abs(val).toFixed(0)}%
      </span>
    )
  }

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/60">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-foreground">Executive Profit Center</CardTitle>
            <CardDescription>Visualizing category contributions, margins, and sales volume</CardDescription>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-9 gap-3 xl:gap-5 bg-card border border-border/80 px-4 py-3 rounded-xl shadow-xs shrink-0 w-full xl:w-auto">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</p>
              <p className="text-xs font-extrabold text-foreground mt-0.5">
                ₹{Math.round(stats.totalRevenue).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Profit</p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{Math.round(stats.totalProfit).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Margin</p>
              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                {stats.overallMargin.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Orders</p>
              <p className="text-xs font-extrabold text-foreground mt-0.5">
                {stats.totalOrdersCount}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AOV</p>
              <p className="text-xs font-extrabold text-foreground mt-0.5">
                ₹{Math.round(stats.currentAOV).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Units</p>
              <p className="text-xs font-extrabold text-foreground mt-0.5">
                {Math.round(stats.totalUnits).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Rev Growth</p>
              <p className={`text-xs font-extrabold mt-0.5 ${stats.revenueGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth.toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Profit Growth</p>
              <p className={`text-xs font-extrabold mt-0.5 ${stats.profitGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.profitGrowth >= 0 ? "+" : ""}{stats.profitGrowth.toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Repeat Rate</p>
              <p className="text-xs font-extrabold text-foreground mt-0.5">
                {stats.currentRepeatRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <Tabs defaultValue="revenue" className="w-full">
          <div className="flex justify-between items-center border-b border-border pb-3 mb-4 flex-wrap gap-3">
            <TabsList className="bg-muted border border-border">
              <TabsTrigger value="revenue" className="text-xs">Revenue View</TabsTrigger>
              <TabsTrigger value="profit" className="text-xs">Profit View</TabsTrigger>
              <TabsTrigger value="units" className="text-xs">Quantity View</TabsTrigger>
            </TabsList>
            <span className="text-xs text-muted-foreground font-medium">Click tabs to toggle charts</span>
          </div>

          {mounted && (
            <>
              <TabsContent value="revenue" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[260px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {revenueChartData.map((entry, index) => {
                            const meta = getCategoryColor(entry.name)
                            return <Cell key={`cell-${index}`} fill={meta.stroke} />
                          })}
                        </Pie>
                        <ChartTooltip content={customTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:col-span-5 space-y-3.5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue Distribution</h4>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {stats.list.map((c) => {
                        const meta = getCategoryColor(c.name)
                        return (
                          <div key={c.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-foreground truncate">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.bg}`} />
                                {c.name}
                              </span>
                              <span className="text-muted-foreground font-bold">
                                ₹{Math.round(c.revenue).toLocaleString("en-IN")} ({c.contributionRev.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden shadow-xs">
                              <div
                                className={`h-full rounded-full ${meta.bg}`}
                                style={{ width: `${c.contributionRev}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="profit" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[260px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profitChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {profitChartData.map((entry, index) => {
                            const meta = getCategoryColor(entry.name)
                            return <Cell key={`cell-${index}`} fill={meta.stroke} />
                          })}
                        </Pie>
                        <ChartTooltip content={customTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:col-span-5 space-y-3.5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profit Contribution</h4>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {stats.list.map((c) => {
                        const meta = getCategoryColor(c.name)
                        return (
                          <div key={c.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-foreground truncate">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.bg}`} />
                                {c.name}
                              </span>
                              <span className="text-muted-foreground font-bold">
                                ₹{Math.round(c.profit).toLocaleString("en-IN")} ({c.contributionProfit.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden shadow-xs">
                              <div
                                className={`h-full rounded-full ${meta.bg}`}
                                style={{ width: `${c.contributionProfit}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="units" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={qtyChartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <ChartTooltip content={customTooltip} />
                        <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                          {qtyChartData.map((entry, index) => {
                            const meta = getCategoryColor(entry.name)
                            return <Cell key={`cell-${index}`} fill={meta.stroke} />
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:col-span-5 space-y-3.5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Volume Leaderboard</h4>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {qtyChartData.map((c) => {
                        const total = stats.totalUnits || 1
                        const pct = (c.quantity / total) * 100
                        const meta = getCategoryColor(c.name)
                        return (
                          <div key={c.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-foreground truncate">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.bg}`} />
                                {c.name}
                              </span>
                              <span className="text-muted-foreground font-bold">
                                {c.quantity.toLocaleString()} units ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden shadow-xs">
                              <div
                                className={`h-full rounded-full ${meta.bg}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category Vitals Breakdown</h4>
          <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/80 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-3 text-right">Revenue</th>
                  <th className="py-3 px-3 text-right">Profit</th>
                  <th className="py-3 px-3 text-right">Qty Sold</th>
                  <th className="py-3 px-3 text-right">Margin</th>
                  <th className="py-3 px-3 text-right">Contribution</th>
                  <th className="py-3 px-3 text-right">Rev Trend</th>
                  <th className="py-3 px-4 text-right">Profit Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {stats.list.map((c) => {
                  const meta = getCategoryColor(c.name)
                  return (
                    <tr key={c.name} className="hover:bg-muted/10">
                      <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-1.5 truncate">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.bg}`} />
                        {c.name}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-foreground">
                        ₹{Math.round(c.revenue).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        ₹{Math.round(c.profit).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {Math.round(c.units).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {c.margin.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-semibold">
                        {c.contributionRev.toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-semibold">
                        {renderTrend(c.revTrend)}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground font-semibold">
                        {renderTrend(c.profitTrend)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {stats.insights.map((insight, i) => (
            <div
              key={i}
              className="p-3 bg-muted/40 border border-border/80 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed"
            >
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-foreground">{insight}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
