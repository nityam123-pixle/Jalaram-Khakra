"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderActionsMenu } from "@/components/orders/order-actions-menu"
import { MapPin, Package, IndianRupee, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface RecentOrdersProps {
  orders: any[]
  onViewDetails: (order: any) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}

export function RecentOrders({
  orders,
  onViewDetails,
  onStatusChange,
  onDelete,
}: RecentOrdersProps) {
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const diffMs = new Date().getTime() - new Date(dateString).getTime()
    const diffMins = Math.round(diffMs / (60 * 1000))
    const diffHours = Math.round(diffMs / (60 * 60 * 1000))
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

    if (diffMins < 60) {
      return `${Math.max(diffMins, 1)}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })
  }

  return (
    <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b border-border/60">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">Recent Orders</CardTitle>
          <CardDescription className="text-xs">Latest order arrivals and tracking status</CardDescription>
        </div>
        <Link
          href="/orders"
          className="text-xs font-semibold text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {orders.map((order) => {
            const items = order.items ?? []
            const totalRevenue = items.reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
            const totalProfit = items.reduce((s: number, i: any) => s + Number(i.totalProfit), 0)
            const initials = (order.customer?.shop_name || order.shop_name || "?")
              .slice(0, 2)
              .toUpperCase()

            return (
              <div
                key={order.id}
                onClick={() => onViewDetails(order)}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors cursor-pointer"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs font-bold text-muted-foreground shadow-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(order)
                      }}
                      className="text-sm font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 truncate block text-left transition-colors"
                    >
                      {order.customer?.shop_name || order.shop_name}
                    </button>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                      <span className="truncate capitalize">{order.city}</span>
                      <span className="shrink-0">•</span>
                      <Package className="h-3 w-3 text-purple-500 shrink-0" />
                      <span className="truncate">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Revenue, profit, status & Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(order.created_at)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatShortDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-foreground flex items-center justify-end gap-0.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      {Math.round(totalRevenue).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +₹{Math.round(totalProfit).toLocaleString("en-IN")} profit
                    </p>
                    <div className="mt-1">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <OrderActionsMenu
                      order={order}
                      onViewDetails={onViewDetails}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {orders.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">No recent orders found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
