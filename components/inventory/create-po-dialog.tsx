"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createPurchaseOrder } from "@/app/actions/inventory"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

export function CreatePODialog({ suppliers, catalog }: { suppliers: any[], catalog: any[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  const [items, setItems] = useState([{ variantId: "", quantityOrdered: 1, unitCostPrice: 0 }])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await createPurchaseOrder({
          supplierId: formData.get("supplierId") as string,
          expectedDelivery: formData.get("expectedDelivery") as string || undefined,
          notes: formData.get("notes") as string || undefined,
          items: items.filter(i => i.variantId).map(i => ({
            variantId: i.variantId,
            quantityOrdered: Number(i.quantityOrdered),
            unitCostPrice: Number(i.unitCostPrice)
          }))
        })
        setOpen(false)
        setItems([{ variantId: "", quantityOrdered: 1, unitCostPrice: 0 }])
        router.refresh()
      } catch (error) {
        console.error("Failed to create PO:", error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New PO
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a draft or placed purchase order to track incoming inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplierId">Supplier *</Label>
                <select 
                  id="supplierId" 
                  name="supplierId" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <Input id="expectedDelivery" name="expectedDelivery" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Any instructions for supplier" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setItems([...items, { variantId: "", quantityOrdered: 1, unitCostPrice: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start border border-border p-3 rounded-md bg-muted/20">
                    <div className="grid gap-3 flex-1">
                      <div>
                        <Label className="text-xs mb-1 block">Product</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={item.variantId}
                          onChange={(e) => {
                            const newItems = [...items]
                            newItems[idx].variantId = e.target.value
                            setItems(newItems)
                          }}
                          required
                        >
                          <option value="">Select product...</option>
                          {catalog.map(cat => (
                            <optgroup key={cat.id} label={cat.name}>
                              {cat.products.map((p: any) => 
                                p.variants.map((v: any) => (
                                  <option key={v.id} value={v.id}>
                                    {p.name} - {v.name}
                                  </option>
                                ))
                              )}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1 block">Quantity</Label>
                          <Input 
                            type="number" 
                            min="0.1" 
                            step="any"
                            value={item.quantityOrdered}
                            onChange={(e) => {
                              const newItems = [...items]
                              newItems[idx].quantityOrdered = Number(e.target.value)
                              setItems(newItems)
                            }}
                            required
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Unit Price (₹)</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            step="any"
                            value={item.unitCostPrice}
                            onChange={(e) => {
                              const newItems = [...items]
                              newItems[idx].unitCostPrice = Number(e.target.value)
                              setItems(newItems)
                            }}
                            required
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500 mt-5 shrink-0"
                      onClick={() => {
                        if (items.length > 1) {
                          setItems(items.filter((_, i) => i !== idx))
                        }
                      }}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create PO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
