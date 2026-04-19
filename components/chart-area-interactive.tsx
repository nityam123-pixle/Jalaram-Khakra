"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { calculateOrderProfit, calculateOrderTotalAmount, type Order } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const chartConfig = {
  revenue: {
    label: "Revenue ₹",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "Profit ₹",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

function localDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type DayRow = {
  date: string
  revenue: number
  profit: number
  ordersCount: number
}

function buildSeries(orders: Order[], timeRange: "90d" | "30d" | "7d"): DayRow[] {
  const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const keys: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    keys.push(localDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const map = new Map<string, { revenue: number; profit: number; ordersCount: number }>()
  keys.forEach((k) => map.set(k, { revenue: 0, profit: 0, ordersCount: 0 }))

  for (const order of orders) {
    const key = localDateKey(new Date(order.created_at))
    const bucket = map.get(key)
    if (!bucket) continue
    bucket.revenue += calculateOrderTotalAmount(order)
    bucket.profit += calculateOrderProfit(order).totalProfit
    bucket.ordersCount += 1
  }

  return keys.map((date) => {
    const b = map.get(date)!
    return {
      date,
      revenue: Math.round(b.revenue),
      profit: Math.round(b.profit),
      ordersCount: b.ordersCount,
    }
  })
}

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

export function ChartAreaInteractive({ orders }: { orders: Order[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<"90d" | "30d" | "7d">("90d")

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const filteredData = React.useMemo(() => buildSeries(orders, timeRange), [orders, timeRange])

  return (
    <Card className="@container/card rounded-xl border border-border pt-0">
      <CardHeader className="relative flex flex-col gap-2 space-y-0 border-b px-4 py-4 sm:flex-row sm:px-6">
        <div className="grid flex-1 gap-1">
          <CardTitle>Revenue & Profit Trend</CardTitle>
          <CardDescription>
            <span className="@[540px]/card:block hidden">
              Daily revenue (order totals) vs estimated profit; hover a day for details
            </span>
            <span className="@[540px]/card:hidden">Revenue & profit</span>
          </CardDescription>
        </div>
        <div className="flex sm:ml-auto">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as "90d" | "30d" | "7d")}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5 text-xs">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5 text-xs">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5 text-xs">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "90d" | "30d" | "7d")}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Select range">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData} margin={{ left: 8, right: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} className="stroke-border" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as DayRow
                const marginPct = d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0
                const label = new Date(d.date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                return (
                  <div
                    className={cn(
                      "grid min-w-[220px] max-w-[280px] gap-2 rounded-lg border border-border/50 bg-popover px-3 py-2.5 text-xs shadow-xl",
                    )}
                  >
                    <div className="font-medium text-foreground">{label}</div>
                    <div className="grid gap-2 border-t border-border pt-2">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="text-right font-mono font-semibold tabular-nums text-foreground">
                          {formatInr(d.revenue)}
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Sum of order totals (selling amounts) for this day.
                      </p>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">Est. profit</span>
                        <span className="text-right font-mono font-semibold tabular-nums text-foreground">
                          {formatInr(d.profit)}
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        From your cost rules (khakhra, patra, chikki, etc.).
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Margin</span>
                        <span className="font-mono tabular-nums text-foreground">
                          {d.revenue > 0 ? `${marginPct.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Orders</span>
                        <span className="tabular-nums text-foreground">{d.ordersCount}</span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Area
              dataKey="profit"
              type="monotone"
              fill="url(#fillProfit)"
              stroke="var(--color-profit)"
              strokeWidth={1.5}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
