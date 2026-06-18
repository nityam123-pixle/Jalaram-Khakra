import { getLowStockAlerts } from "@/app/actions/inventory"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, TrendingDown, ShoppingCart, PackageCheck } from "lucide-react"
import Link from "next/link"

const URGENCY_CONFIG = {
  CRITICAL: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800" },
  HIGH: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/40", border: "border-orange-200 dark:border-orange-800" },
  MEDIUM: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800" },
}

export default async function LowStockPage() {
  const alerts = await getLowStockAlerts()

  const criticalCount = alerts.filter(a => a.urgency === "CRITICAL").length
  const highCount = alerts.filter(a => a.urgency === "HIGH").length
  const mediumCount = alerts.filter(a => a.urgency === "MEDIUM").length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Low Stock Center</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Products requiring immediate attention based on consumption rates
          </p>
        </div>
        
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-lg border">
            <Badge variant="destructive" className="bg-red-500 hover:bg-red-500">{criticalCount} Critical</Badge>
            <Badge variant="outline" className="text-orange-500 border-orange-200">{highCount} High</Badge>
            <Badge variant="secondary" className="text-amber-600">{mediumCount} Medium</Badge>
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-xl border border-border/80">
          <div className="bg-emerald-100 dark:bg-emerald-950/30 p-4 rounded-full mb-4">
            <PackageCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">All products are well stocked! 🎉</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            There are currently no products below their reorder point. Your inventory levels are healthy.
          </p>
          <Button asChild>
            <Link href="/inventory/current">View Current Stock</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => {
            const cfg = URGENCY_CONFIG[alert.urgency]
            const fillPct = Math.min(100, Math.max(0, (alert.currentStock / alert.reorderPoint) * 100))
            const isEmpty = alert.currentStock <= 0
            
            return (
              <Card key={alert.variantId} className={`flex flex-col border-l-4 overflow-hidden ${cfg.border}`}>
                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-base">{alert.productName}</p>
                      <p className="text-sm text-muted-foreground">{alert.variantName}</p>
                    </div>
                    <Badge variant={isEmpty ? "destructive" : "outline"} className={`text-[10px] ${!isEmpty ? cfg.color + " " + cfg.bg : ""}`}>
                      {alert.urgency}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Stock</span>
                      <span className={`font-bold ${isEmpty ? 'text-red-500' : ''}`}>
                        {alert.currentStock} <span className="text-xs text-muted-foreground font-normal">/ {alert.reorderPoint} (Reorder)</span>
                      </span>
                    </div>
                    <Progress value={fillPct} className="h-2" indicatorClassName={isEmpty ? "bg-red-500" : undefined} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4 bg-muted/20 p-3 rounded-lg text-sm">
                    {alert.daysRemaining !== null ? (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Days Left
                        </span>
                        <p className={`font-semibold ${alert.daysRemaining <= 3 ? 'text-red-500' : ''}`}>
                          {alert.daysRemaining <= 0 ? "Out now" : `~${alert.daysRemaining} days`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Status
                        </span>
                        <p className="font-semibold text-red-500">
                          {isEmpty ? "Out of Stock" : "Needs Reorder"}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Avg Burn
                      </span>
                      <p className="font-semibold">
                        {alert.dailyConsumptionRate > 0 ? `${alert.dailyConsumptionRate.toFixed(1)}/day` : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button className="w-full" size="sm" asChild>
                      <Link href={`/inventory/purchase-orders`}>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Create PO
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
