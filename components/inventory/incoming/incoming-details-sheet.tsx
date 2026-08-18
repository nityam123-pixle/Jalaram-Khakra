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
import { IncomingStatusBadge } from "./incoming-status-badge"
import { ReceiveStockDialog } from "@/components/inventory/receive-stock-dialog"
import {
  Building2,
  Calendar,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { updateShipmentStatus } from "@/app/actions/inventory"
import { toast } from "sonner"

interface IncomingDetailsSheetProps {
  shipment: any | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (shipmentId: string, newStatus: string) => void
}

function formatDate(date: string | Date | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function IncomingDetailsSheet({
  shipment,
  isOpen,
  onOpenChange,
  onStatusChange,
}: IncomingDetailsSheetProps) {
  const [isPending, startTransition] = useTransition()

  if (!shipment) return null

  const items = shipment.purchaseOrder?.items || []
  const logs = shipment.receivingLogs || []

  const handleStatusTransition = (status: any) => {
    startTransition(async () => {
      try {
        await updateShipmentStatus(shipment.id, status)
        toast.success(`Shipment marked as ${status.toLowerCase()}`)
        onStatusChange?.(shipment.id, status)
      } catch (err) {
        toast.error("Failed to update shipment status")
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col h-full bg-background border-l border-border">
        <SheetHeader className="p-6 pb-4 border-b border-border/80 text-left">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase">
              Freight Shipment
            </span>
            <IncomingStatusBadge status={shipment.status} />
          </div>
          <SheetTitle className="text-xl font-bold font-mono tracking-tight text-foreground">
            {shipment.shipmentNumber}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Created on {formatDate(shipment.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supplier & Transport */}
          <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-sm text-foreground">
                  {shipment.supplier?.name || "Supplier"}
                </span>
              </div>
              {shipment.supplier?.city && (
                <Badge variant="outline" className="text-[10px]">
                  {shipment.supplier.city}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Transport</span>
                <p className="font-medium mt-0.5">{shipment.transportName || "Standard Transport"}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Vehicle #</span>
                <p className="font-medium font-mono mt-0.5">{shipment.vehicleNumber || "Not recorded"}</p>
              </div>
            </div>
          </div>

          {/* Linked PO */}
          {shipment.purchaseOrder && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Linked Purchase Order
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {shipment.purchaseOrder.poNumber}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Contains {items.length} items from supplier {shipment.supplier?.name}
              </p>
            </div>
          )}

          {/* Dates & Logistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Expected Arrival
              </span>
              <p className="text-sm font-semibold mt-1">
                {formatDate(shipment.expectedArrival)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Actual Arrival
              </span>
              <p className="text-sm font-semibold mt-1">
                {formatDate(shipment.actualArrival)}
              </p>
            </div>
          </div>

          {/* PO Items to Receive */}
          {items.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Manifest Items ({items.length})
              </h4>
              <div className="divide-y divide-border/60 border border-border/80 rounded-xl bg-card overflow-hidden">
                {items.map((item: any) => {
                  const unit = item.variant?.unitType === "KG" ? "kg" : item.variant?.unitType === "BOX" ? "box" : "pkt"
                  return (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {item.variant?.product?.name || "Product"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.variant?.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-foreground">
                          {item.quantityOrdered} {unit}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Received: {item.quantityReceived || 0}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Receiving Logs */}
          {logs.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Intake Audit Trail ({logs.length})
              </h4>
              <div className="space-y-2">
                {logs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-lg border border-border/80 bg-card text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {log.variant?.product?.name} ({log.variant?.name})
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{log.quantityReceived}
                      </span>
                    </div>
                    {log.quantityDamaged > 0 && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Damaged: {log.quantityDamaged}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Received at {formatDate(log.receivedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons footer */}
        <div className="p-4 border-t border-border/80 bg-background flex flex-wrap items-center justify-end gap-2">
          {(shipment.status === "PENDING" || shipment.status === "IN_TRANSIT") && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusTransition("ARRIVED")}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-9"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark as Arrived</span>
            </Button>
          )}

          {(shipment.status === "ARRIVED" || shipment.status === "RECEIVING" || shipment.status === "IN_TRANSIT") && shipment.purchaseOrder && (
            <ReceiveStockDialog shipment={shipment} />
          )}

          {shipment.status !== "COMPLETED" && shipment.status !== "CANCELLED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusTransition("CANCELLED")}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs h-9"
            >
              Cancel Shipment
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
