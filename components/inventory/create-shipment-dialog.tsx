"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createShipment } from "@/app/actions/inventory"
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
import { Plus } from "lucide-react"

export function CreateShipmentDialog({ suppliers, pos }: { suppliers: any[], pos: any[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [selectedPO, setSelectedPO] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await createShipment({
          purchaseOrderId: formData.get("purchaseOrderId") as string || undefined,
          supplierId: formData.get("supplierId") as string || undefined,
          transportName: formData.get("transportName") as string || undefined,
          vehicleNumber: formData.get("vehicleNumber") as string || undefined,
          expectedArrival: formData.get("expectedArrival") as string || undefined,
          notes: formData.get("notes") as string || undefined,
        })
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error("Failed to create shipment:", error)
      }
    })
  }

  // Pre-fill supplier if PO selected
  const po = pos.find(p => p.id === selectedPO)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Incoming Shipment</DialogTitle>
            <DialogDescription>
              Track stock in transit from your suppliers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchaseOrderId" className="text-right text-xs">Link to PO</Label>
              <select
                id="purchaseOrderId"
                name="purchaseOrderId"
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedPO}
                onChange={(e) => setSelectedPO(e.target.value)}
              >
                <option value="">None (Standalone)</option>
                {pos.map(p => (
                  <option key={p.id} value={p.id}>{p.poNumber} - {p.supplier.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierId" className="text-right text-xs">Supplier</Label>
              <select
                id="supplierId"
                name="supplierId"
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={!!selectedPO}
                defaultValue={po?.supplierId || ""}
              >
                <option value="">Select supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transportName" className="text-right text-xs">Transport</Label>
              <Input id="transportName" name="transportName" className="col-span-3 h-9" placeholder="e.g. VRL Logistics" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleNumber" className="text-right text-xs">Vehicle No.</Label>
              <Input id="vehicleNumber" name="vehicleNumber" className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expectedArrival" className="text-right text-xs">Expected</Label>
              <Input id="expectedArrival" name="expectedArrival" type="date" className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right text-xs">Notes</Label>
              <Input id="notes" name="notes" className="col-span-3 h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Shipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
