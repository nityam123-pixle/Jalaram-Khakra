"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { OrderStatusBadge } from "./order-status-badge"
import { OrderActionsMenu } from "./order-actions-menu"
import { Button } from "@/components/ui/button"
import { MapPin, IndianRupee, Eye } from "lucide-react"
import { getOrderTotals } from "@/lib/order-utils"

interface OrdersMobileCardsProps {
  orders: any[]
  selectedOrderIds: string[]
  onSelectOrder: (id: string, selected: boolean) => void
  onViewDetails: (order: any) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}

export function OrdersMobileCards({
  orders,
  selectedOrderIds,
  onSelectOrder,
  onViewDetails,
  onStatusChange,
  onDelete,
}: OrdersMobileCardsProps) {
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    })
  }

  return (
    <div className="grid grid-cols-1 gap-3.5">
      {orders.map((order) => {
        const isSelected = selectedOrderIds.includes(order.id)
        const items = order.items ?? []
        const totals = getOrderTotals(order)
        const totalRevenue = totals.totalRevenue
        const totalProfit = totals.totalProfit
        const marginPercent = totals.marginPercent
        const totalWeight = totals.totalKhakhraKg

        return (
          <Card
            key={order.id}
            className={`border border-border relative transition-all duration-150 rounded-xl overflow-hidden shadow-sm ${
              isSelected ? "bg-muted/40 border-ring/50" : "bg-card hover:border-border/80"
            }`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectOrder(order.id, !!checked)}
                aria-label={`Select order ${order.id}`}
              />
            </div>

            <CardContent className="p-4 pl-12 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4
                    onClick={() => onViewDetails(order)}
                    className="font-bold text-foreground text-sm hover:underline cursor-pointer transition-colors duration-150 truncate"
                  >
                    {order.customer?.shop_name || order.shop_name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate capitalize">
                      {order.city}
                    </span>
                    <span className="text-muted-foreground/30 text-xs shrink-0">•</span>
                    <span className="text-xs text-muted-foreground shrink-0 font-mono">
                      {formatShortDate(order.created_at)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {/* Order Info Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-muted/30 dark:bg-black/20 border border-border/40 rounded-lg p-3 text-center">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                    ₹{Math.round(totalRevenue).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Profit</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                    ₹{Math.round(totalProfit).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 truncate font-mono">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Row */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  #{order.id.slice(0, 8).toUpperCase()} • {marginPercent.toFixed(0)}% Margin {totalWeight > 0 ? `• ${totalWeight.toFixed(1)}kg` : ""}
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(order)}
                    className="h-8 gap-1 text-xs border-border bg-card hover:bg-muted font-medium rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Details</span>
                  </Button>
                  <OrderActionsMenu
                    order={order}
                    onViewDetails={onViewDetails}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
