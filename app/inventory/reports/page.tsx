import { getInventoryAnalytics } from "@/app/actions/inventory"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, TrendingUp, Package, Users, BarChart2 } from "lucide-react"
import { InventoryStockChart } from "@/components/inventory/inventory-stock-chart"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function InventoryReportsPage() {
  const analytics = await getInventoryAnalytics()
  const {
    stockInOutTrend,
    topMovingWithDetails,
    categoryValues,
    supplierPerformance,
  } = analytics

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Inventory Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Analytics and performance metrics for your inventory
        </p>
      </div>

      {/* Stock In vs Out Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Stock In vs Stock Out (Last 30 Days)</CardTitle>
          </div>
          <CardDescription>Daily stock movements by volume</CardDescription>
        </CardHeader>
        <CardContent>
          {stockInOutTrend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No stock movements in the last 30 days</p>
            </div>
          ) : (
            <InventoryStockChart data={stockInOutTrend} />
          )}
        </CardContent>
      </Card>

      {/* Two-column: Top Moving + Category Values */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Moving Products */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Top Moving Products</CardTitle>
            </div>
            <CardDescription>Highest consumption in last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topMovingWithDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {topMovingWithDetails.map((item, i) => (
                  <div key={item.variantId} className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.variant?.product.name} — {item.variant?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.variant?.product.category.name}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.qty} units
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Inventory Value */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Category Inventory Value</CardTitle>
            </div>
            <CardDescription>Total stock value by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryValues.filter((c) => c.units > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No tracked inventory yet</p>
            ) : (
              <div className="space-y-3">
                {categoryValues
                  .filter((c) => c.units > 0)
                  .sort((a, b) => b.value - a.value)
                  .map((cat) => {
                    const maxValue = Math.max(...categoryValues.map((c) => c.value))
                    const pct = maxValue > 0 ? (cat.value / maxValue) * 100 : 0
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(cat.value)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{cat.units} units</p>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supplier Performance */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Supplier Performance</CardTitle>
          </div>
          <CardDescription>Fulfillment rate and total purchase value by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          {supplierPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No suppliers configured yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-muted-foreground py-2 pr-4">Supplier</th>
                    <th className="text-right font-medium text-muted-foreground py-2 px-4">Total Orders</th>
                    <th className="text-right font-medium text-muted-foreground py-2 px-4">Completed</th>
                    <th className="text-right font-medium text-muted-foreground py-2 px-4">Total Value</th>
                    <th className="text-right font-medium text-muted-foreground py-2 pl-4">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {supplierPerformance
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">
                          {s.totalOrders}
                        </td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">
                          {s.completedOrders}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium">
                          {formatCurrency(s.totalValue)}
                        </td>
                        <td className="py-2.5 pl-4 text-right">
                          <Badge
                            variant={
                              s.fulfillmentRate >= 90
                                ? "default"
                                : s.fulfillmentRate >= 70
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {s.fulfillmentRate.toFixed(0)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
