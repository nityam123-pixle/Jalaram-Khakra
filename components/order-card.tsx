"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Order, calculateOrderTotalAmount } from "@/lib/supabase"
import { MapPin, MoreHorizontal, Package, ShoppingBag, IndianRupee, Clock } from "lucide-react"

interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: string, status: Order["status"]) => void
  onEdit: (order: Order) => void
  onDelete: (orderId: string) => void
}

export function OrderCard({ order, onStatusChange, onEdit, onDelete }: OrderCardProps) {
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
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

  const orderTotal = calculateOrderTotalAmount(order)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.shop_name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              {order.city}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {order.status !== "completed" && (
                  <DropdownMenuItem onClick={() => onStatusChange(order.id, "completed")}>
                    Mark as Completed
                  </DropdownMenuItem>
                )}
                {order.status !== "pending" && (
                  <DropdownMenuItem onClick={() => onStatusChange(order.id, "pending")}>
                    Mark as Pending
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(order)}>Edit Order</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-red-600">
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">{order.address}</div>

        <div className="flex flex-col gap-2 text-sm">
          {order.total_khakhra_kg > 0 && (
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.total_khakhra_kg} kg</span>
              <span className="text-muted-foreground">Khakhra</span>
            </div>
          )}

          {order.wants_patra && (
            <div className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.patra_packets}</span>
              <span className="text-muted-foreground">Patra @ ₹{order.patra_price_per_packet || 75}</span>
            </div>
          )}

          {order.wants_chikki && (
            <div className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.chikki_packets || 0}</span>
              <span className="text-muted-foreground">Chikki @ ₹{order.chikki_price_per_packet || 31}</span>
            </div>
          )}

          {order.wants_fulvadi && (
            <div className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.fulvadi_packets}</span>
              <span className="text-muted-foreground">Fulvadi @ ₹{order.fulvadi_price_per_packet || 90}</span>
            </div>
          )}
        </div>

        {order.khakhra_items && order.khakhra_items.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Items:</div>
            <div className="flex flex-wrap gap-1">
              {order.khakhra_items.map((item) => (
                <Badge key={item.id} variant="outline" className="text-xs">
                  {item.khakhra_type}:{" "}
                  {item.is_packet_item
                    ? `${item.packet_quantity} packets @ ₹${item.price_per_packet}`
                    : `${item.quantity_kg}kg @ ₹${item.price_per_kg}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Order Total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Order Total:</span>
          <div className="flex items-center gap-1 font-semibold text-lg">
            <IndianRupee className="h-4 w-4" />
            <span>{orderTotal}</span>
          </div>
        </div>

        {/* Order Date & Time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Ordered: {formatDateTime(order.created_at)}
        </div>
      </CardContent>
    </Card>
  )
}
