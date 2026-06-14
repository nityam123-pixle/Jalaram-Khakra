"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Package, IndianRupee, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

interface OrderCardProps {
  order: any
  onStatusChange?: (orderId: string, status: string) => void
  onEdit?: (order: any) => void
  onDelete?: (orderId: string) => void
}

export function OrderCard({ order }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Always sum from items — order.total_amount can be stale (0) for older records
  const orderTotal = (order.items ?? []).reduce((sum: number, i: any) => sum + Number(i.totalRevenue), 0)

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer relative group bg-card border-border">
        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 flex items-center text-sm font-medium">
          View details <ExternalLink className="ml-1 w-4 h-4" />
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">{order.customer?.shop_name || order.shop_name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {order.city}
              </div>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">{order.address}</div>

          {/* Items Section — from new OrderItems table */}
          {order.items && order.items.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Package className="h-3 w-3" />
                Items:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {order.items.slice(0, 3).map((item: any) => (
                  <Badge key={item.id} variant="secondary" className="font-normal text-xs">
                    <span className="font-medium mr-1">{item.productName}</span>
                    {item.variantName}: {item.quantity} {item.unitType === "KG" ? "kg" : "pkt"} @ ₹{Number(item.unitSellingPrice).toFixed(0)}
                  </Badge>
                ))}
                {order.items.length > 3 && (
                  <Badge variant="secondary" className="font-normal text-xs">
                    +{order.items.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          {(!order.items || order.items.length === 0) && (
            <div className="text-sm text-muted-foreground italic">No items recorded</div>
          )}

          {/* Order Total — derived from items */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Order Total:</div>
            <div className="flex items-center gap-0.5 text-lg font-bold text-foreground order-amount">
              <IndianRupee className="h-4 w-4" />
              {orderTotal.toFixed(0)}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Ordered: {formatDateTime(order.created_at)}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
