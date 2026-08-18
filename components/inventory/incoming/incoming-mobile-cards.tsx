"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IncomingStatusBadge } from "./incoming-status-badge"
import { ReceiveStockDialog } from "@/components/inventory/receive-stock-dialog"
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  Trash2,
  Package,
  Calendar,
  Building2,
  MapPin,
  AlertTriangle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface IncomingMobileCardsProps {
  shipments: any[]
  selectedShipmentIds: string[]
  onSelectShipment: (id: string, checked: boolean) => void
  onViewDetails: (shipment: any) => void
  onStatusChange: (shipmentId: string, status: any) => void
  onDelete: (shipmentId: string) => void
}

function formatDate(date: string | Date | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function IncomingMobileCards({
  shipments,
  selectedShipmentIds,
  onSelectShipment,
  onViewDetails,
  onStatusChange,
  onDelete,
}: IncomingMobileCardsProps) {
  return (
    <div className="space-y-3">
      {shipments.map((shipment) => {
        const isSelected = selectedShipmentIds.includes(shipment.id)
        const items = shipment.purchaseOrder?.items || []
        const isOverdue =
          shipment.expectedArrival &&
          new Date(shipment.expectedArrival) < new Date() &&
          shipment.status !== "COMPLETED" &&
          shipment.status !== "CANCELLED"

        return (
          <Card
            key={shipment.id}
            className={`border transition-all overflow-hidden rounded-xl ${
              isSelected
                ? "border-primary/50 bg-primary/[0.02]"
                : "border-border/80 bg-card hover:border-border"
            }`}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: Checkbox + Shipment # + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectShipment(shipment.id, Boolean(checked))}
                    aria-label={`Select ${shipment.shipmentNumber}`}
                  />
                  <div>
                    <button
                      onClick={() => onViewDetails(shipment)}
                      className="font-mono font-bold text-sm text-foreground hover:underline text-left block"
                    >
                      {shipment.shipmentNumber}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(shipment.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <IncomingStatusBadge status={shipment.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => onViewDetails(shipment)} className="gap-2">
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </DropdownMenuItem>
                      {shipment.status === "PENDING" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(shipment.id, "IN_TRANSIT")}
                          className="gap-2 text-amber-600"
                        >
                          <Truck className="h-3.5 w-3.5" /> Mark In Transit
                        </DropdownMenuItem>
                      )}
                      {(shipment.status === "PENDING" || shipment.status === "IN_TRANSIT") && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(shipment.id, "ARRIVED")}
                          className="gap-2 text-blue-600"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Mark Arrived
                        </DropdownMenuItem>
                      )}
                      {shipment.status !== "COMPLETED" && shipment.status !== "CANCELLED" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(shipment.id, "CANCELLED")}
                          className="gap-2 text-rose-600"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel Shipment
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(shipment.id)}
                        className="gap-2 text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Shipment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Supplier & Transport Info */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[160px]">{shipment.supplier?.name || "Supplier"}</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Truck className="h-3 w-3" />
                  <span>{shipment.vehicleNumber || shipment.transportName || "-"}</span>
                </div>
              </div>

              {/* PO & Expected Arrival */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-lg">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>PO:</span>
                  <strong className="font-mono text-foreground">{shipment.purchaseOrder?.poNumber || "Direct"}</strong>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground justify-end">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className={isOverdue ? "text-rose-600 font-semibold" : ""}>
                    {formatDate(shipment.expectedArrival)}
                  </span>
                </div>
              </div>

              {/* Action buttons on card */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {(shipment.status === "PENDING" || shipment.status === "IN_TRANSIT") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(shipment.id, "ARRIVED")}
                    className="h-8 px-2.5 text-xs text-blue-600 dark:text-blue-400 gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Mark Arrived</span>
                  </Button>
                )}

                {(shipment.status === "ARRIVED" || shipment.status === "RECEIVING" || shipment.status === "IN_TRANSIT") && shipment.purchaseOrder && (
                  <ReceiveStockDialog shipment={shipment} />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
