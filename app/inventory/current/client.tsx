"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCurrentInventory } from "@/app/actions/inventory"
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog"
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
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PackageSearch, AlertTriangle, PackageX, IndianRupee, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { PageHeaderSkeleton, TableSkeleton, MetricCardsSkeleton } from "@/components/ui/skeleton-layouts"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

const ITEMS_PER_PAGE = 10;

export function CurrentStockClient({ initialData }: { initialData: any[] }) {
  const [filter, setFilter] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  const { data: inventory = initialData, isLoading } = useQuery({
    queryKey: ["currentInventory"],
    queryFn: () => getCurrentInventory(),
    initialData,
    staleTime: 60 * 1000,
  })

  if (isLoading && !inventory.length) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <MetricCardsSkeleton count={4} />
        <div className="mt-8">
          <TableSkeleton columns={6} rows={10} />
        </div>
      </div>
    )
  }

  // Calculate summary stats
  const totalValue = inventory.reduce((sum: number, item: any) => sum + item.inventoryValue, 0)
  const lowStockItems = inventory.filter((i: any) => i.status === "LOW_STOCK")
  const outOfStockItems = inventory.filter((i: any) => i.status === "OUT_OF_STOCK")
  
  const filteredInventory = inventory.filter((item: any) => {
    if (filter === "ALL") return true
    return item.status === filter
  })

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleFilterChange = (val: string) => {
    setFilter(val)
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Current Stock</h1>
          <p className="text-sm text-muted-foreground">
            Real-time view of your available inventory
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inventory/settings">Inventory Settings</Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" /> Tracked SKUs
            </span>
            <span className="text-2xl font-bold">{inventory.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Total Value
            </span>
            <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(totalValue)}
            </span>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className={`h-3.5 w-3.5 ${lowStockItems.length > 0 ? "text-amber-500" : ""}`} /> Low Stock
            </span>
            <span className={`text-2xl font-bold ${lowStockItems.length > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {lowStockItems.length}
            </span>
          </CardContent>
        </Card>
        <Card className={outOfStockItems.length > 0 ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <PackageX className={`h-3.5 w-3.5 ${outOfStockItems.length > 0 ? "text-red-500" : ""}`} /> Out of Stock
            </span>
            <span className={`text-2xl font-bold ${outOfStockItems.length > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              {outOfStockItems.length}
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={handleFilterChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="ALL">All Items</TabsTrigger>
            <TabsTrigger value="HEALTHY">Healthy</TabsTrigger>
            <TabsTrigger value="LOW_STOCK">Low Stock</TabsTrigger>
            <TabsTrigger value="OUT_OF_STOCK">Out of Stock</TabsTrigger>
            <TabsTrigger value="OVERSTOCKED">Overstocked</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right text-muted-foreground">Reserved</TableHead>
              <TableHead className="text-right">Value (₹)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No items found matching the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedInventory.map((item: any) => {
                const productName = item.variant?.product?.name || "Unknown Product";
                const variantName = item.variant?.name || "Unknown Variant";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{productName}</div>
                      <div className="text-sm text-muted-foreground">{variantName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "HEALTHY" ? "default" :
                          item.status === "LOW_STOCK" ? "secondary" :
                          item.status === "OUT_OF_STOCK" ? "destructive" :
                          "outline"
                        }
                        className={
                          item.status === "HEALTHY" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          item.status === "LOW_STOCK" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" :
                          item.status === "OVERSTOCKED" ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" :
                          ""
                        }
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.availableStock}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.reservedStock}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.inventoryValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdjustStockDialog 
                        variantId={item.variantId}
                        productName={productName}
                        variantName={variantName}
                        currentStock={item.availableStock}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredInventory.length)}</span> of <span className="font-medium">{filteredInventory.length}</span> results
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
    </div>
  )
}
