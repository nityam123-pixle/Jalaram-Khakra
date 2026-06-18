"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { receiveStock } from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PackageCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ReceiveStockDialog({ shipment }: { shipment: any }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Initialize state from PO items if linked, otherwise empty (or from receiving logs if we supported partials heavily)
  const poItems = shipment.purchaseOrder?.items || []
  const initialItems = poItems.map((item: any) => ({
    variantId: item.variantId,
    productName: item.variant.product.name,
    variantName: item.variant.name,
    quantityExpected: item.quantityOrdered - item.quantityReceived,
    quantityReceived: item.quantityOrdered - item.quantityReceived,
    quantityDamaged: 0,
    notes: "",
  })).filter((i: any) => i.quantityExpected > 0)

  const [items, setItems] = useState(initialItems)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await receiveStock(
          shipment.id,
          items.map((i: any) => ({
            variantId: i.variantId,
            quantityExpected: i.quantityExpected,
            quantityReceived: i.quantityReceived,
            quantityDamaged: i.quantityDamaged,
            notes: i.notes || undefined,
          }))
        )
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error("Failed to receive stock:", error)
      }
    })
  }

  if (initialItems.length === 0) {
    return (
      <Button size="sm" variant="outline" disabled>
        Fully Received
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PackageCheck className="mr-2 h-4 w-4" />
          Receive Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
            <DialogDescription>
              Verify received quantities against the purchase order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{shipment.shipmentNumber}</Badge>
              {shipment.supplier && <span className="text-sm font-medium">{shipment.supplier.name}</span>}
            </div>

            <div className="border rounded-md divide-y">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-right">Expected</div>
                <div className="col-span-2 text-right">Received</div>
                <div className="col-span-2 text-right text-red-500">Damaged</div>
                <div className="col-span-2">Notes</div>
              </div>
              {items.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center">
                  <div className="col-span-4">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  </div>
                  <div className="col-span-2 text-right text-sm">
                    {item.quantityExpected}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-8 text-right"
                      value={item.quantityReceived}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[idx].quantityReceived = Number(e.target.value)
                        setItems(newItems)
                      }}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-8 text-right text-red-500"
                      value={item.quantityDamaged}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[idx].quantityDamaged = Number(e.target.value)
                        setItems(newItems)
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-8"
                      placeholder="Notes..."
                      value={item.notes}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[idx].notes = e.target.value
                        setItems(newItems)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-900/50">
              <p className="text-xs text-amber-800 dark:text-amber-400">
                <strong>Note:</strong> Receiving stock will automatically update your inventory levels and create stock ledger entries. Damaged items will be recorded but not added to available stock.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Receiving..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
