"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getLowStockAlerts } from "@/app/actions/inventory"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingDown, ShoppingCart, PackageCheck, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { PageHeaderSkeleton, TableSkeleton, MetricCardsSkeleton } from "@/components/ui/skeleton-layouts"

const URGENCY_CONFIG = {
  CRITICAL: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", badge: "destructive" },
  HIGH: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", badge: "outline" },
  MEDIUM: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", badge: "secondary" },
}

const ITEMS_PER_PAGE = 10;

export function LowStockClient({ initialData }: { initialData: any[] }) {
  const [currentPage, setCurrentPage] = useState(1)

  const { data: alerts = initialData, isLoading } = useQuery({
    queryKey: ["lowStockAlerts"],
    queryFn: () => getLowStockAlerts(),
    initialData,
    staleTime: 60 * 1000,
  })

  if (isLoading && !alerts.length) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <MetricCardsSkeleton count={3} />
        <div className="mt-8">
          <TableSkeleton columns={6} rows={10} />
        </div>
      </div>
    )
  }

  const criticalCount = alerts.filter((a: any) => a.urgency === "CRITICAL").length
  const highCount = alerts.filter((a: any) => a.urgency === "HIGH").length
  const mediumCount = alerts.filter((a: any) => a.urgency === "MEDIUM").length

  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE)
  const paginatedAlerts = alerts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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
        <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="text-right">Available / Reorder</TableHead>
                <TableHead className="text-right">Days Left</TableHead>
                <TableHead className="text-right">Avg Burn</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAlerts.map((alert: any) => {
                const cfg = URGENCY_CONFIG[alert.urgency as keyof typeof URGENCY_CONFIG]
                const isEmpty = alert.availableStock <= 0
                const productName = alert.variant?.product?.name || "Unknown Product"
                const variantName = alert.variant?.name || "Unknown Variant"
                
                return (
                  <TableRow key={alert.variantId}>
                    <TableCell>
                      <div className="font-medium">{productName}</div>
                      <div className="text-sm text-muted-foreground">{variantName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={cfg.badge as any} 
                        className={alert.urgency !== "CRITICAL" ? `${cfg.color} ${cfg.bg} border-transparent` : ""}
                      >
                        {alert.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${isEmpty ? 'text-red-500' : ''}`}>
                        {alert.availableStock}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">
                        / {alert.reorderPoint}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {alert.daysRemaining !== null ? (
                        <span className={`font-medium ${alert.daysRemaining <= 3 ? 'text-red-500' : ''}`}>
                          {alert.daysRemaining <= 0 ? "Out now" : `~${alert.daysRemaining} days`}
                        </span>
                      ) : (
                        <span className="font-medium text-red-500">
                          {isEmpty ? "Out of Stock" : "Needs Reorder"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {alert.dailyConsumption > 0 ? `${alert.dailyConsumption.toFixed(1)}/day` : "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/inventory/purchase-orders`}>
                          <ShoppingCart className="mr-2 h-4 w-4" /> Create PO
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, alerts.length)}</span> of <span className="font-medium">{alerts.length}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
