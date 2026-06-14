import Link from "next/link"
import { TrendingUp } from "lucide-react"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getDashboardAnalytics, getOrdersForChart, getRecentOrders } from "./actions/analytics"

function previewLabel(order: any) {
  const t = order.items?.[0]?.categoryName
  return t || "Mixed / extras"
}

export default async function DashboardPage() {
  const [stats, chartItems, recent] = await Promise.all([
    getDashboardAnalytics(),
    getOrdersForChart(),
    getRecentOrders(8)
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">Jalaram Khakra — orders, revenue, and profit at a glance.</p>
      </div>

      <SectionCards
        totalOrders={stats.totalOrders}
        pendingOrders={stats.pendingOrders}
        completedOrders={stats.completedOrders}
        totalEarningsFormatted={`₹${stats.totalEarnings.toLocaleString("en-IN")}`}
      />

      <Card className="rounded-xl border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <CardDescription className="text-sm font-medium">Overall Profit</CardDescription>
          </div>
          <CardTitle className="font-mono text-2xl font-semibold text-foreground">
            ₹{stats.totalProfit.toLocaleString("en-IN")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {stats.profitByCategory.map((cat, i) => (
            <div
              key={cat.label}
              className={cn(
                "flex flex-col gap-1",
                i < stats.profitByCategory.length - 1 && "lg:border-r lg:border-border lg:pr-4",
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">{cat.label}</span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                ₹{cat.profit.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-muted-foreground">{Math.round(cat.quantity * 10) / 10} units sold</span>
            </div>
          ))}
          {stats.profitByCategory.length === 0 && (
             <div className="text-sm text-muted-foreground col-span-full">No sales data yet.</div>
          )}
        </CardContent>
      </Card>

      <ChartAreaInteractive items={chartItems} />

      <Card className="rounded-xl border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <CardDescription>Latest activity from your shops</CardDescription>
          </div>
          <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {recent.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((order) => {
                const amount = order.total_amount || 0
                const label = previewLabel(order)
                const letter = label.charAt(0).toUpperCase()
                const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-6"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">
                      {letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-none">{order.shop_name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {label} · {order.city}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-medium tabular-nums">
                        ₹{amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">{dateStr}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
