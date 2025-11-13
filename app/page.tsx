"use client"

import { KhakhraAnalyticsChart } from "@/components/khakhra-analytics-chart"
import { NewOrderDialog } from "@/components/new-order-dialog"
import { StatsCard } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  calculateOrderProfit,
  type Order,
  supabase,
  KHAKHRA_TYPES,
  calculateDynamicProfit,
  calculateOrderTotalAmount,
} from "@/lib/supabase"
import { CheckCircle, Clock, Plus, ShoppingCart, TrendingUp, IndianRupee, Package, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalEarnings: 0,
    totalKhakhraProfit: 0,
    totalPatraProfit: 0,
    totalBhakarwadiProfit: 0,
    totalChikkiProfit: 0,
    totalKhakhraSold: 0,
    totalBhakarwadiSold: 0,
    totalPatraSold: 0,
    totalChikkiSold: 0,
  })

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          khakhra_items (*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])

      // Calculate stats
      const total = data?.length || 0
      const pending = data?.filter((order) => order.status === "pending").length || 0
      const completed = data?.filter((order) => order.status === "completed").length || 0
      const totalEarnings =
        data?.reduce((sum, order) => {
          return sum + calculateOrderTotalAmount(order)
        }, 0) || 0

      let totalKhakhraProfit = 0
      let totalPatraProfit = 0
      let totalBhakarwadiProfit = 0
      let totalChikkiProfit = 0
      let totalKhakhraSold = 0
      let totalBhakarwadiSold = 0
      let totalPatraSold = 0
      let totalChikkiSold = 0

      data?.forEach((order) => {
        const { khakhraProfit, patraProfit, chikkiProfit } = calculateOrderProfit(order)

        // Separate Bhakarwadi from regular Khakhra
        let regularKhakhraProfit = 0
        let bhakarwadiProfit = 0
        let regularKhakhraSold = 0
        let bhakarwadiSoldKg = 0

        if (order.khakhra_items) {
          order.khakhra_items.forEach((item: any) => {
            const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)

            if (!khakhraType) return

            // Skip Chikki items - they are calculated separately from order fields
            if (khakhraType.category === "chikki") return

            if (khakhraType.category === "bhakarwadi") {
              // This is Bhakarwadi
              if (item.is_packet_item && item.packet_quantity && item.price_per_packet) {
                const packetProfit = calculateDynamicProfit(khakhraType, item.price_per_packet, true)
                bhakarwadiProfit += item.packet_quantity * packetProfit
                bhakarwadiSoldKg += item.quantity_kg
              } else {
                const kgProfit = calculateDynamicProfit(khakhraType, item.price_per_kg, false)
                bhakarwadiProfit += item.quantity_kg * kgProfit
                bhakarwadiSoldKg += item.quantity_kg
              }
            } else {
              // This is regular Khakhra
              if (item.is_packet_item && item.packet_quantity && item.price_per_packet) {
                const packetProfit = calculateDynamicProfit(khakhraType, item.price_per_packet, true)
                regularKhakhraProfit += item.packet_quantity * packetProfit
              } else {
                const kgProfit = calculateDynamicProfit(khakhraType, item.price_per_kg, false)
                regularKhakhraProfit += item.quantity_kg * kgProfit
              }
              regularKhakhraSold += item.quantity_kg
            }
          })
        }

        totalKhakhraProfit += regularKhakhraProfit
        totalBhakarwadiProfit += bhakarwadiProfit
        totalPatraProfit += patraProfit
        totalChikkiProfit += chikkiProfit
        totalKhakhraSold += regularKhakhraSold
        totalBhakarwadiSold += bhakarwadiSoldKg
        totalPatraSold += order.patra_packets || 0
        totalChikkiSold += order.chikki_packets || 0
      })

      setStats({
        total,
        pending,
        completed,
        totalEarnings,
        totalKhakhraProfit: Math.round(totalKhakhraProfit),
        totalPatraProfit: Math.round(totalPatraProfit),
        totalBhakarwadiProfit: Math.round(totalBhakarwadiProfit),
        totalChikkiProfit: Math.round(totalChikkiProfit),
        totalKhakhraSold: Math.round(totalKhakhraSold * 10) / 10,
        totalBhakarwadiSold: Math.round(totalBhakarwadiSold * 10) / 10,
        totalPatraSold,
        totalChikkiSold,
      })
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Dashboard</h2>
            <p className="text-muted-foreground text-sm sm:text-base">Welcome to your order management system</p>
          </div>
          <div className="flex-shrink-0">
            <NewOrderDialog
              trigger={
                <Button size="default" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="sm:inline">New Order</span>
                </Button>
              }
              onOrderCreated={fetchOrders}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Orders"
            value={stats.total}
            description="All time orders"
            icon={ShoppingCart}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard title="Pending Orders" value={stats.pending} description="Awaiting completion" icon={Clock} />
          <StatsCard
            title="Completed Orders"
            value={stats.completed}
            description="Successfully delivered"
            icon={CheckCircle}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Total Earnings"
            value={`₹${stats.totalEarnings.toLocaleString()}`}
            description="Revenue generated"
            icon={IndianRupee}
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Profit Card */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Overall Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              ₹{(stats.totalKhakhraProfit + stats.totalPatraProfit + stats.totalBhakarwadiProfit + stats.totalChikkiProfit).toLocaleString()}{" "}
              Total Profit
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">Khakhra Profit</p>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{stats.totalKhakhraProfit.toLocaleString()}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  <Package className="inline-block h-3 w-3 mr-1" />
                  {stats.totalKhakhraSold} kg sold
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">Bhakarwadi Profit</p>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{stats.totalBhakarwadiProfit.toLocaleString()}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  <ShoppingBag className="inline-block h-3 w-3 mr-1" />
                  {stats.totalBhakarwadiSold} kg sold
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">Patra Profit</p>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{stats.totalPatraProfit.toLocaleString()}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  <ShoppingBag className="inline-block h-3 w-3 mr-1" />
                  {stats.totalPatraSold} packets sold
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">Chikki Profit</p>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  ₹{stats.totalChikkiProfit.toLocaleString()}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  <ShoppingBag className="inline-block h-3 w-3 mr-1" />
                  {stats.totalChikkiSold} packets sold
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Chart */}

        <div className="w-full">
          <KhakhraAnalyticsChart orders={orders} />
        </div>

        {/* Recent Orders and Business Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentOrders.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentOrders.map((order) => {
                    const orderTotal = calculateOrderTotalAmount(order)
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{order.shop_name}</p>
                          <p className="text-xs text-muted-foreground">{order.city}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-medium">₹{orderTotal}</p>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No orders yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Business Insights</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total Khakhra (kg)</span>
                  <span className="font-medium text-sm">
                    {orders.reduce((sum, order) => sum + order.total_khakhra_kg, 0)} kg
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total Patra Packets</span>
                  <span className="font-medium text-sm">
                    {orders.reduce((sum, order) => sum + order.patra_packets, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Average Order Value</span>
                  <span className="font-medium text-sm">
                    ₹{stats.total > 0 ? Math.round(stats.totalEarnings / stats.total) : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Profit Margin</span>
                  <span className="font-medium text-sm text-green-600 dark:text-green-400">
                    {stats.totalEarnings > 0
                      ? Math.round(
                          ((stats.totalKhakhraProfit + stats.totalPatraProfit + stats.totalBhakarwadiProfit + stats.totalChikkiProfit) /
                            stats.totalEarnings) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Unique Khakhra Flavors</span>
                  <span className="font-medium text-sm">
                    {
                      new Set(orders.flatMap((order) => order.khakhra_items?.map((item) => item.khakhra_type) || []))
                        .size
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Cities Served</span>
                  <span className="font-medium text-sm">{new Set(orders.map((order) => order.city)).size}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
