"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IndianRupee, ShoppingCart, TrendingUp } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from "recharts"

interface RevenueCommandCenterProps {
  orders: any[]
}

type ChartTimeframe = "7d" | "30d" | "90d" | "1y"

export function RevenueCommandCenter({ orders }: RevenueCommandCenterProps) {
  const [mounted, setMounted] = useState(false)
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("30d")

  // Toggles for charts
  const [showRevenue, setShowRevenue] = useState(true)
  const [showProfit, setShowProfit] = useState(true)
  const [showOrders, setShowOrders] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Aggregate daily records
  const dailyTimeline = useMemo(() => {
    const dailyMap: Record<
      string,
      { date: string; displayDate: string; revenue: number; profit: number; orders: number }
    > = {}

    orders.forEach((order) => {
      const d = order.created_at ? new Date(order.created_at) : new Date()
      const key = d.toISOString().split("T")[0]
      const displayDate = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })

      let rev = 0
      let profit = 0
      ;(order.items ?? []).forEach((item: any) => {
        rev += Number(item.totalRevenue) || 0
        profit += Number(item.totalProfit) || 0
      })

      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, displayDate, revenue: 0, profit: 0, orders: 0 }
      }
      dailyMap[key].revenue += rev
      dailyMap[key].profit += profit
      dailyMap[key].orders += 1
    })

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
  }, [orders])

  // Filter timeline based on local timeframe selection
  const filteredTimeline = useMemo(() => {
    if (dailyTimeline.length === 0) return []
    const now = new Date()
    let limitDate = new Date()

    switch (timeframe) {
      case "7d":
        limitDate.setDate(now.getDate() - 7)
        break
      case "30d":
        limitDate.setDate(now.getDate() - 30)
        break
      case "90d":
        limitDate.setDate(now.getDate() - 90)
        break
      case "1y":
        limitDate.setDate(now.getDate() - 365)
        break
    }

    const limitStr = limitDate.toISOString().split("T")[0]
    return dailyTimeline.filter((d) => d.date >= limitStr)
  }, [dailyTimeline, timeframe])

  // Aggregate overall values for header summary
  const summary = useMemo(() => {
    let rev = 0
    let profit = 0
    let count = 0

    filteredTimeline.forEach((day) => {
      rev += day.revenue
      profit += day.profit
      count += day.orders
    })

    const margin = rev > 0 ? (profit / rev) * 100 : 0

    return {
      revenue: rev,
      profit,
      margin,
      ordersCount: count,
    }
  }, [filteredTimeline])

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border px-3 py-2.5 rounded-xl shadow-lg text-xs space-y-1 text-popover-foreground">
          <p className="font-bold border-b border-border pb-1 mb-1.5">{payload[0].payload.displayDate}</p>
          {payload.map((entry: any) => {
            const isOrders = entry.name === "orders"
            const prefix = isOrders ? "" : "₹"
            return (
              <p key={entry.name} className="flex items-center gap-3 font-semibold justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="text-foreground">
                  {prefix}
                  {Math.round(entry.value).toLocaleString("en-IN")}
                </span>
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  const timelineFilters: { value: ChartTimeframe; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" },
  ]

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-foreground">Revenue Command Center</CardTitle>
            <CardDescription>Live timeline plotting revenue growth, net profits and order frequencies</CardDescription>
          </div>

          {/* Timeframe Local Filters */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/80">
            {timelineFilters.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className={`text-[10px] h-6 px-2 rounded-md ${
                  timeframe === tf.value
                    ? "bg-background shadow-xs font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Dynamic Metric Toggles */}
        <div className="grid grid-cols-3 gap-3 pt-4 max-w-2xl">
          <button
            onClick={() => setShowRevenue((prev) => !prev)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              showRevenue
                ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "bg-background border-border hover:bg-muted/10"
            }`}
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Revenue</span>
            <span className="text-lg font-extrabold text-foreground mt-0.5 block flex items-center gap-0.5">
              <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
              {Math.round(summary.revenue).toLocaleString("en-IN")}
            </span>
            {showRevenue && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setShowProfit((prev) => !prev)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              showProfit
                ? "bg-green-500/5 dark:bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20"
                : "bg-background border-border hover:bg-muted/10"
            }`}
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Net Profit</span>
            <span className="text-lg font-extrabold text-green-600 dark:text-green-400 mt-0.5 block flex items-center gap-0.5">
              <IndianRupee className="h-3.5 w-3.5" />
              {Math.round(summary.profit).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-0.5">
              {summary.margin.toFixed(1)}% Margin
            </span>
            {showProfit && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" />
            )}
          </button>

          <button
            onClick={() => setShowOrders((prev) => !prev)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              showOrders
                ? "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20"
                : "bg-background border-border hover:bg-muted/10"
            }`}
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Orders</span>
            <span className="text-lg font-extrabold text-foreground mt-0.5 block flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
              {summary.ordersCount.toLocaleString()}
            </span>
            {showOrders && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {mounted && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <ChartTooltip content={customTooltip} />
                {showRevenue && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                )}
                {showProfit && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                )}
                {showOrders && (
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
