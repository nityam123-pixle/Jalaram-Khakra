"use client"

import { useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { POStatusBadge } from "./po-status-badge"
import {
  Building2,
  Phone,
  Calendar,
  Truck,
  IndianRupee,
  Package,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { updatePurchaseOrderStatus } from "@/app/actions/inventory"
import { toast } from "sonner"

interface PODetailsSheetProps {
  po: any | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (poId: string, newStatus: string) => void
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

function formatDate(date: string | Date | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function PODetailsSheet({
  po,
  isOpen,
  onOpenChange,
  onStatusChange,
}: PODetailsSheetProps) {
  const [isPending, startTransition] = useTransition()

  if (!po) return null

  const items = po.items || []
  const totalUnits = items.reduce(
    (sum: number, i: any) => sum + (Number(i.quantityOrdered) || 0),
    0
  )
  const totalReceived = items.reduce(
    (sum: number, i: any) => sum + (Number(i.quantityReceived) || 0),
    0
  )
  const calculatedTotal = items.reduce(
    (sum: number, i: any) => sum + ((Number(i.quantityOrdered) || 0) * (Number(i.unitCostPrice) || 0)),
    0
  )
  const poAmount = po.invoiceAmount ?? calculatedTotal

  const handleStatusTransition = (status: any) => {
    startTransition(async () => {
      try {
        await updatePurchaseOrderStatus(po.id, status)
        toast.success(`Purchase order marked as ${status.toLowerCase()}`)
        onStatusChange?.(po.id, status)
      } catch (err) {
        toast.error("Failed to update status")
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col h-full bg-background border-l border-border">
        <SheetHeader className="p-6 pb-4 border-b border-border/80 text-left">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase">
              Purchase Order
            </span>
            <POStatusBadge status={po.status} />
          </div>
          <SheetTitle className="text-xl font-bold font-mono tracking-tight text-foreground">
            {po.poNumber}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Created on {formatDate(po.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supplier Info */}
          <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-sm text-foreground">
                  {po.supplier?.name || "Supplier"}
                </span>
              </div>
              {po.supplier?.city && (
                <Badge variant="outline" className="text-[10px]">
                  {po.supplier.city}
                </Badge>
              )}
            </div>
            {po.supplier?.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{po.supplier.phone}</span>
              </p>
            )}
            {po.supplier?.gstNumber && (
              <p className="text-xs text-muted-foreground font-mono">
                GST: {po.supplier.gstNumber}
              </p>
            )}
          </div>

          {/* Logistics & Delivery */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Expected Delivery
              </span>
              <p className="text-sm font-semibold mt-1">
                {formatDate(po.expectedDelivery)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" /> Transport
              </span>
              <p className="text-sm font-semibold mt-1 truncate">
                {po.transportDetails || "Standard Logistics"}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Ordered Items ({items.length})
              </h4>
              <span className="text-xs text-muted-foreground font-medium">
                {totalReceived} of {totalUnits} received
              </span>
            </div>

            <div className="divide-y divide-border/60 border border-border/80 rounded-xl bg-card overflow-hidden">
              {items.map((item: any) => {
                const subtotal = Number(item.quantityOrdered) * Number(item.unitCostPrice)
                const unitLabel = item.variant?.unitType === "KG" ? "kg" : item.variant?.unitType === "BOX" ? "box" : "pkt"
                return (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {item.variant?.product?.name || "Product"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.variant?.name} · {formatCurrency(item.unitCostPrice)} / {unitLabel}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-foreground">
                        {item.quantityOrdered} {unitLabel}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Linked Shipments */}
          {po.shipments && po.shipments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Linked Shipments ({po.shipments.length})
              </h4>
              <div className="space-y-2">
                {po.shipments.map((shp: any) => (
                  <div
                    key={shp.id}
                    className="p-3 rounded-lg border border-border/80 bg-card flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-foreground">
                        {shp.shipmentNumber}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {shp.transportName} · {shp.vehicleNumber || "No vehicle #"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {shp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total Quantity Ordered:</span>
              <span className="font-mono font-semibold text-foreground">{totalUnits} units</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Calculated Amount:</span>
              <span className="font-mono">{formatCurrency(calculatedTotal)}</span>
            </div>
            <Separator className="my-1 bg-border/80" />
            <div className="flex justify-between items-center text-sm font-bold text-foreground">
              <span>Total PO Value:</span>
              <span className="font-mono text-base">{formatCurrency(poAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons footer */}
        <div className="p-4 border-t border-border/80 bg-background flex flex-wrap items-center justify-end gap-2">
          {po.status === "DRAFT" && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusTransition("ORDERED")}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-9"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark as Ordered</span>
            </Button>
          )}

          {(po.status === "DRAFT" || po.status === "ORDERED") && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusTransition("IN_TRANSIT")}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-9"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Mark In Transit</span>
            </Button>
          )}

          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusTransition("CANCELLED")}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs h-9"
            >
              Cancel PO
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
