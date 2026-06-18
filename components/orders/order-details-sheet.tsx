"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { OrderStatusBadge } from "./order-status-badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Phone,
  Calendar,
  IndianRupee,
  Package,
  TrendingUp,
  FileText,
  MessageCircle,
  Edit2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

interface OrderDetailsSheetProps {
  order: any | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (id: string, status: string) => void
}

export function OrderDetailsSheet({
  order,
  isOpen,
  onOpenChange,
  onStatusChange,
}: OrderDetailsSheetProps) {
  if (!order) return null

  // Sum metrics dynamically from items
  const items = order.items ?? []
  const totalRevenue = items.reduce((acc: number, i: any) => acc + Number(i.totalRevenue), 0)
  const totalCost = items.reduce((acc: number, i: any) => acc + Number(i.totalCost), 0)
  const totalProfit = items.reduce((acc: number, i: any) => acc + Number(i.totalProfit), 0)
  const totalWeight = Number(order.total_khakhra_kg) || 0
  const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handlePrint = () => {
    toast.success(`Invoice for Order #${order.id.slice(0, 8).toUpperCase()} sent to printer.`)
  }

  const handleWhatsAppShare = () => {
    const itemsText = items
      .map((i: any) => `${i.productName} (${i.variantName}) x ${i.quantity}`)
      .join(", ")
    const text = `Hi ${order.customer?.shop_name || order.shop_name}, your order totaling ₹${Math.round(totalRevenue)} containing: ${itemsText} is being processed. Thanks, Jalaram Khakra.`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank")
  }

  const status = order.status?.toLowerCase() || "pending"

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[700px] overflow-y-auto bg-card border-l border-border text-foreground p-6">
        <SheetHeader className="text-left space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Order Detail</span>
              <SheetTitle className="text-2xl font-bold mt-1 text-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </SheetTitle>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Placed on {formatDate(order.created_at)}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-6 border-border" />

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/60">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Shop Name</p>
              <p className="text-sm font-semibold text-foreground">
                {order.customer?.shop_name || order.shop_name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">City</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1 capitalize">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                {order.city}
              </p>
            </div>
            {order.customer?.phone && (
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                  {order.customer.phone}
                </p>
              </div>
            )}
            <div className="space-y-1 col-span-1 md:col-span-2">
              <p className="text-xs text-muted-foreground">Delivery Address</p>
              <p className="text-sm text-foreground leading-relaxed">
                {order.address || "No address recorded"}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6 border-border" />

        {/* Order Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4 text-purple-500" />
              Order Items ({items.length})
            </h3>
            {totalWeight > 0 && (
              <span className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full font-medium border border-purple-100 dark:border-purple-900/40">
                Total Weight: {totalWeight.toFixed(1)} kg
              </span>
            )}
          </div>

          <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/80 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="py-3 px-4">Product Variant</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div>{item.productName}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.variantName}</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-foreground">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right text-muted-foreground">
                      ₹{Number(item.unitSellingPrice).toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                      ₹{Math.round(Number(item.totalRevenue)).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator className="my-6 border-border" />

        {/* Financial Summary & Margins */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Financial Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border/60 rounded-xl p-3.5 text-center shadow-sm">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Revenue</p>
              <p className="text-lg font-bold text-foreground mt-1 flex items-center justify-center gap-0.5">
                <IndianRupee className="h-3.5 w-3.5" />
                {Math.round(totalRevenue).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-3.5 text-center shadow-sm">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cost</p>
              <p className="text-lg font-bold text-muted-foreground mt-1 flex items-center justify-center gap-0.5">
                <IndianRupee className="h-3.5 w-3.5" />
                {Math.round(totalCost).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-3.5 text-center shadow-sm">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Net Profit</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-0.5">
                <IndianRupee className="h-3.5 w-3.5" />
                {Math.round(totalProfit).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-3.5 text-center shadow-sm">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Margin</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                {marginPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6 border-border" />

        {/* Footer Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 flex-1 min-w-[140px]"
            >
              <FileText className="h-4 w-4" />
              <span>Print Invoice</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="gap-2 flex-1 min-w-[140px]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Share WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 flex-1 min-w-[140px]"
            >
              <a href={`/orders/${order.id}/edit`}>
                <Edit2 className="h-4 w-4" />
                <span>Edit Order</span>
              </a>
            </Button>
          </div>

          <div className="flex gap-2 mt-1">
            {status !== "completed" && status !== "delivered" && (
              <Button
                onClick={() => {
                  onStatusChange(order.id, "completed")
                  onOpenChange(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex-1 gap-2 h-10"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark as Completed</span>
              </Button>
            )}
            {status !== "cancelled" && (
              <Button
                variant="destructive"
                onClick={() => {
                  onStatusChange(order.id, "cancelled")
                  onOpenChange(false)
                }}
                className="font-medium text-sm flex-1 gap-2 h-10"
              >
                <XCircle className="h-4 w-4" />
                <span>Cancel Order</span>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
