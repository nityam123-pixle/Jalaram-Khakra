"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  calculateDynamicProfit,
  calculateOrderProfit,
  calculateOrderTotalAmount,
  KHAKHRA_TYPES,
  supabase,
  type Order,
} from "@/lib/supabase"
import { cn } from "@/lib/utils"

function aggregateStats(orders: Order[]) {
  const total = orders.length
  const pending = orders.filter((o) => o.status === "pending").length
  const completed = orders.filter((o) => o.status === "completed").length
  const totalEarnings = orders.reduce((sum, o) => sum + calculateOrderTotalAmount(o), 0)

  let totalKhakhraProfit = 0
  let totalBhakarwadiProfit = 0
  let totalBhakriProfit = 0
  let totalFaraliProfit = 0
  let totalMathiyaPuriProfit = 0
  let totalPatraProfit = 0
  let totalFulvadiProfit = 0
  let totalChikkiProfit = 0
  let totalKhakhraSold = 0
  let totalBhakarwadiSold = 0
  let totalPatraSold = 0
  let totalChikkiSold = 0

  orders.forEach((order) => {
    const { khakhraProfit, bhakarwadiProfit, bhakriProfit, faraliProfit, mathiyaPuriProfit, patraProfit, fulvadiProfit, chikkiProfit } = calculateOrderProfit(order)
    totalKhakhraProfit += khakhraProfit
    totalBhakarwadiProfit += bhakarwadiProfit
    totalBhakriProfit += bhakriProfit
    totalFaraliProfit += faraliProfit
    totalMathiyaPuriProfit += mathiyaPuriProfit
    totalPatraProfit += patraProfit
    totalFulvadiProfit += fulvadiProfit
    totalChikkiProfit += chikkiProfit

    let regularKhakhraSold = 0
    let bhakarwadiSoldKg = 0

    if (order.khakhra_items) {
      order.khakhra_items.forEach((item) => {
        const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)
        if (!khakhraType) return

        if (khakhraType.category === "bhakarwadi") {
          if (item.is_packet_item && item.packet_quantity && item.price_per_packet) {
            bhakarwadiSoldKg += item.quantity_kg
          } else {
            bhakarwadiSoldKg += item.quantity_kg
          }
        } else if (khakhraType.category === "regular" || khakhraType.category === "premium") {
          regularKhakhraSold += item.quantity_kg
        }
      })
    }

    totalKhakhraSold += regularKhakhraSold
    totalBhakarwadiSold += bhakarwadiSoldKg
    totalPatraSold += order.patra_packets || 0
    totalChikkiSold += order.chikki_packets || 0
  })

  const totalProfit =
    totalKhakhraProfit + totalBhakarwadiProfit + totalBhakriProfit + totalFaraliProfit + totalMathiyaPuriProfit + totalPatraProfit + totalFulvadiProfit + totalChikkiProfit

  return {
    total,
    pending,
    completed,
    totalEarnings,
    totalKhakhraProfit: Math.round(totalKhakhraProfit),
    totalBhakarwadiProfit: Math.round(totalBhakarwadiProfit),
    totalBhakriProfit: Math.round(totalBhakriProfit),
    totalFaraliProfit: Math.round(totalFaraliProfit),
    totalMathiyaPuriProfit: Math.round(totalMathiyaPuriProfit),
    totalPatraProfit: Math.round(totalPatraProfit),
    totalFulvadiProfit: Math.round(totalFulvadiProfit),
    totalChikkiProfit: Math.round(totalChikkiProfit),
    totalProfit: Math.round(totalProfit),
    totalKhakhraSold: Math.round(totalKhakhraSold * 10) / 10,
    totalBhakarwadiSold: Math.round(totalBhakarwadiSold * 10) / 10,
    totalPatraSold,
    totalChikkiSold,
  }
}

function previewLabel(order: Order) {
  const t = order.khakhra_items?.[0]?.khakhra_type
  return t || "Mixed / extras"
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, khakhra_items (*)`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    const onRefresh = () => {
      void fetchOrders()
    }
    window.addEventListener("orders:refresh", onRefresh)
    return () => window.removeEventListener("orders:refresh", onRefresh)
  }, [])

  const stats = aggregateStats(orders)
  const recent = orders.slice(0, 8)

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center text-sm text-muted-foreground">Loading dashboard…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">Jalaram Khakra — orders, revenue, and profit at a glance.</p>
      </div>

      <SectionCards
        totalOrders={stats.total}
        pendingOrders={stats.pending}
        completedOrders={stats.completed}
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
          {[
            {
              label: "Khakhra",
              value: stats.totalKhakhraProfit,
              cap: `${stats.totalKhakhraSold.toLocaleString("en-IN")} kg sold`,
            },
            {
              label: "Bhakarwadi",
              value: stats.totalBhakarwadiProfit,
              cap: `${stats.totalBhakarwadiSold.toLocaleString("en-IN")} kg sold`,
            },
            {
              label: "Bhakri",
              value: stats.totalBhakriProfit,
              cap: "Bhakri products",
            },
            {
              label: "Farali",
              value: stats.totalFaraliProfit,
              cap: "Farali products",
            },
            {
              label: "Mathiya Puri",
              value: stats.totalMathiyaPuriProfit,
              cap: "Mathiya Puri products",
            },
            {
              label: "Patra",
              value: stats.totalPatraProfit,
              cap: `${stats.totalPatraSold.toLocaleString("en-IN")} packets`,
            },
            {
              label: "Fulvadi",
              value: stats.totalFulvadiProfit,
              cap: "Fulvadi products",
            },
            {
              label: "Chikki",
              value: stats.totalChikkiProfit,
              cap: `${stats.totalChikkiSold.toLocaleString("en-IN")} packets`,
            },
          ].map((col, i) => (
            <div
              key={col.label}
              className={cn(
                "flex flex-col gap-1",
                i < 7 && "lg:border-r lg:border-border lg:pr-4",
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                ₹{col.value.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-muted-foreground">{col.cap}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <ChartAreaInteractive orders={orders} />

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
                const amount = calculateOrderTotalAmount(order)
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
