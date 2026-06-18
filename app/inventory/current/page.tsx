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
import { PackageSearch, AlertTriangle, PackageX, IndianRupee } from "lucide-react"
import Link from "next/link"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function CurrentStockPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const inventory = await getCurrentInventory()
  const params = await searchParams
  const filter = params.filter || "ALL"
  
  // Calculate summary stats
  const totalValue = inventory.reduce((sum, item) => sum + item.inventoryValue, 0)
  const lowStockItems = inventory.filter(i => i.status === "LOW_STOCK")
  const outOfStockItems = inventory.filter(i => i.status === "OUT_OF_STOCK")
  
  const filteredInventory = inventory.filter(item => {
    if (filter === "ALL") return true
    return item.status === filter
  })

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

      <Tabs defaultValue={filter} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ALL" asChild><a href="?filter=ALL">All</a></TabsTrigger>
          <TabsTrigger value="HEALTHY" asChild><a href="?filter=HEALTHY">Healthy</a></TabsTrigger>
          <TabsTrigger value="LOW_STOCK" asChild><a href="?filter=LOW_STOCK">Low Stock</a></TabsTrigger>
          <TabsTrigger value="OUT_OF_STOCK" asChild><a href="?filter=OUT_OF_STOCK">Out of Stock</a></TabsTrigger>
          <TabsTrigger value="OVERSTOCKED" asChild><a href="?filter=OVERSTOCKED">Overstocked</a></TabsTrigger>
        </TabsList>
        
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right text-muted-foreground">Reserved</TableHead>
                  <TableHead className="text-right text-muted-foreground">Reorder At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No tracked products matching this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "default"
                    let badgeLabel = item.status
                    
                    if (item.status === "HEALTHY") {
                      badgeVariant = "outline"
                      badgeLabel = "Healthy"
                    } else if (item.status === "LOW_STOCK") {
                      badgeVariant = "secondary"
                      badgeLabel = "Low Stock"
                    } else if (item.status === "OUT_OF_STOCK") {
                      badgeVariant = "destructive"
                      badgeLabel = "Out of Stock"
                    } else if (item.status === "OVERSTOCKED") {
                      badgeVariant = "default"
                      badgeLabel = "Overstocked"
                    }

                    return (
                      <TableRow key={item.id} className="text-sm">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.variant.product.name}</span>
                            <span className="text-xs text-muted-foreground">{item.variant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {item.variant.product.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-base">{item.availableStock}</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.reservedStock}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono">
                          {item.reorderPoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant} className={
                            item.status === "HEALTHY" ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30" :
                            item.status === "LOW_STOCK" ? "text-amber-700 bg-amber-100 hover:bg-amber-100" : ""
                          }>
                            {badgeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.inventoryValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <AdjustStockDialog 
                            variantId={item.variantId}
                            currentStock={item.availableStock}
                            variantName={item.variant.name}
                            productName={item.variant.product.name}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
