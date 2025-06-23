"use client"

import { NewOrderDialog } from "@/components/new-order-dialog"
import { StatsCard } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateOrderProfit, type Order, supabase } from "@/lib/supabase"
import { CheckCircle, Clock, Plus, ShoppingCart, TrendingUp, IndianRupee } from "lucide-react"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalEarnings: 0,
    totalProfit: 0,
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
      const totalEarnings = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalProfit = data?.reduce((sum, order) => sum + calculateOrderProfit(order), 0) || 0

      setStats({
        total,
        pending,
        completed,
        totalEarnings,
        totalProfit,
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
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to your order management system</p>
        </div>
        <NewOrderDialog
          trigger={
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          }
          onOrderCreated={fetchOrders}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <TrendingUp className="h-5 w-5" />
            Total Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            ₹{stats.totalProfit.toLocaleString()}
          </div>
          <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">Profit from all completed orders</p>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.shop_name}</p>
                      <p className="text-sm text-muted-foreground">{order.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{order.total_amount}</p>
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
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Khakhra (kg)</span>
              <span className="font-medium">{orders.reduce((sum, order) => sum + order.total_khakhra_kg, 0)} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Patra Packets</span>
              <span className="font-medium">{orders.reduce((sum, order) => sum + order.patra_packets, 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="font-medium">
                ₹{stats.total > 0 ? Math.round(stats.totalEarnings / stats.total) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profit Margin</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {stats.totalEarnings > 0 ? Math.round((stats.totalProfit / stats.totalEarnings) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
