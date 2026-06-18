import { prisma } from "@/lib/prisma"
import { ReorderPointEditor } from "@/components/inventory/reorder-point-editor"
import { TrackingToggle } from "@/components/inventory/tracking-toggle"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Settings, Package, ShieldCheck, ToggleRight, RotateCw, AlertTriangle } from "lucide-react"

export default async function InventorySettingsPage() {
  // Fetch ALL variants (active ones) to configure tracking
  const allVariants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: {
      product: {
        include: { category: true }
      },
      inventory: true
    },
    orderBy: [
      { product: { category: { name: 'asc' } } },
      { product: { name: 'asc' } }
    ]
  })

  // Group by category for better UI
  const groupedVariants = allVariants.reduce((acc, variant) => {
    const cat = variant.product.category.name
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(variant)
    return acc
  }, {} as Record<string, typeof allVariants>)

  const trackedCount = allVariants.filter(v => v.inventory !== null).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure tracking, stock alerts, and reorder points
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Tracking Enabled
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{trackedCount}</span>
              <span className="text-sm text-muted-foreground">/ {allVariants.length} variants</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedVariants).map(([category, variants]) => (
          <Card key={category} className="overflow-hidden">
            <div className="bg-muted/40 px-4 py-3 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                {category}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="w-[120px] text-center">Tracking</TableHead>
                    <TableHead className="text-right">Reorder Point</TableHead>
                    <TableHead className="text-right text-muted-foreground font-normal text-xs">Current Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => {
                    const isTracked = !!variant.inventory
                    
                    return (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">{variant.product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{variant.name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <TrackingToggle variantId={variant.id} isTracked={isTracked} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isTracked ? (
                            <div className="flex justify-end">
                              <ReorderPointEditor 
                                variantId={variant.id} 
                                currentReorderPoint={variant.inventory.reorderPoint} 
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {isTracked ? variant.inventory.availableStock : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
