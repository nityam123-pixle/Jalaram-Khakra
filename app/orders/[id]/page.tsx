import { getOrderById } from "@/app/actions/order"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Edit2, Package } from "lucide-react"
import { OrderActions } from "@/components/order-actions"

export const dynamic = "force-dynamic"

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderById(id)
  
  if (!order) {
    notFound()
  }

  // Always derive totals from OrderItems — order.total_amount may be stale (0) for legacy orders
  const totalRevenue = (order.items ?? []).reduce((sum: number, i: any) => sum + Number(i.totalRevenue), 0)
  const totalProfit  = (order.items ?? []).reduce((sum: number, i: any) => sum + Number(i.totalProfit),  0)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link href="/orders" className="hover:underline flex items-center gap-1 w-fit">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-muted rounded-lg">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              Order #{order.id.slice(0, 8).toUpperCase()}
              <Badge variant="outline" className="capitalize">{order.status}</Badge>
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-14">
            Customer: {order.customer?.shop_name || order.shop_name} • {order.city}
          </p>
          <div className="flex gap-4 mt-3 ml-14 text-sm text-muted-foreground">
            <span>Created: {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, p') : 'Unknown'}</span>
            <span>Updated: {order.updated_at ? format(new Date(order.updated_at), 'dd MMM yyyy, p') : 'Unknown'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <OrderActions orderId={order.id} status={order.status} />
          <Link href={`/orders/${order.id}/edit`}>
            <Button>
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/40 flex justify-between items-center">
          <h3 className="font-semibold text-foreground">Order Items ({order.items?.length || 0})</h3>
        </div>

        <div className="divide-y divide-border">
          {order.items?.map((item: any) => (
            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-muted/20 transition-colors">
              <div>
                <div className="font-medium text-lg text-foreground">{item.productName}</div>
                <div className="text-muted-foreground text-sm">
                  {item.variantName} • Qty: {item.quantity} • @₹{Number(item.unitSellingPrice).toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">₹{Number(item.totalRevenue).toFixed(2)}</div>
                <div className="text-sm text-emerald-600 font-medium">Profit: ₹{Number(item.totalProfit).toFixed(2)}</div>
              </div>
            </div>
          ))}
          {(!order.items || order.items.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">No items in this order.</div>
          )}
        </div>

        {/* Totals Footer */}
        <div className="p-6 bg-muted/30 border-t border-border flex flex-col items-end gap-2">
          <div className="flex justify-between w-72">
            <span className="text-muted-foreground">Total Revenue</span>
            <span className="font-bold text-foreground text-xl order-amount">₹{totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-72">
            <span className="text-muted-foreground">Total Profit</span>
            <span className="font-bold text-emerald-600 profit-value">₹{totalProfit.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
