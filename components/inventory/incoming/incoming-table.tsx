"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IncomingStatusBadge } from "./incoming-status-badge"
import { ReceiveStockDialog } from "@/components/inventory/receive-stock-dialog"
import {
  Eye,
  MoreHorizontal,
  CheckCircle,
  Truck,
  XCircle,
  Trash2,
  Package,
  Calendar,
  AlertCircle,
  Building2,
  X,
  MapPin,
} from "lucide-react"

interface IncomingTableProps {
  shipments: any[]
  selectedShipmentIds: string[]
  onSelectShipment: (id: string, checked: boolean) => void
  onSelectAllShipments: (checked: boolean) => void
  onViewDetails: (shipment: any) => void
  onStatusChange: (shipmentId: string, status: any) => void
  onDelete: (shipmentId: string) => void
  onBulkStatusChange: (status: any) => void
  onBulkDelete: () => void
}

function formatDate(date: string | Date | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function IncomingTable({
  shipments,
  selectedShipmentIds,
  onSelectShipment,
  onSelectAllShipments,
  onViewDetails,
  onStatusChange,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
}: IncomingTableProps) {
  const isAllSelected = shipments.length > 0 && selectedShipmentIds.length === shipments.length

  return (
    <div className="relative">
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/80">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => onSelectAllShipments(Boolean(checked))}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Shipment #
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Supplier & Transport
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Linked PO
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Expected Arrival
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-right pr-4 font-semibold text-xs text-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              const isSelected = selectedShipmentIds.includes(shipment.id)
              const items = shipment.purchaseOrder?.items || []
              const isOverdue =
                shipment.expectedArrival &&
                new Date(shipment.expectedArrival) < new Date() &&
                shipment.status !== "COMPLETED" &&
                shipment.status !== "CANCELLED"

              return (
                <TableRow
                  key={shipment.id}
                  data-state={isSelected ? "selected" : undefined}
                  className="hover:bg-muted/30 border-b border-border/60 transition-colors text-xs"
                >
                  <TableCell className="pl-4 py-3.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectShipment(shipment.id, Boolean(checked))}
                      aria-label={`Select ${shipment.shipmentNumber}`}
                      className="translate-y-[2px]"
                    />
                  </TableCell>

                  <TableCell className="py-3.5 font-medium">
                    <button
                      onClick={() => onViewDetails(shipment)}
                      className="font-mono font-bold text-foreground hover:underline text-left"
                    >
                      {shipment.shipmentNumber}
                    </button>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(shipment.createdAt)}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {shipment.supplier?.name || "Supplier"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Truck className="h-3 w-3" />
                        <span>{shipment.transportName || "Standard Transport"}</span>
                        {shipment.vehicleNumber && (
                          <span className="font-mono">({shipment.vehicleNumber})</span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    {shipment.purchaseOrder ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {shipment.purchaseOrder.poNumber}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          ({items.length} items)
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">Direct Freight</span>
                    )}
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground"}>
                        {formatDate(shipment.expectedArrival)}
                      </span>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1 py-0">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <IncomingStatusBadge status={shipment.status} />
                  </TableCell>

                  <TableCell className="py-3.5 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {(shipment.status === "PENDING" || shipment.status === "IN_TRANSIT") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStatusChange(shipment.id, "ARRIVED")}
                          className="h-7 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          Mark Arrived
                        </Button>
                      )}

                      {(shipment.status === "ARRIVED" || shipment.status === "RECEIVING" || shipment.status === "IN_TRANSIT") && shipment.purchaseOrder && (
                        <ReceiveStockDialog shipment={shipment} />
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem onClick={() => onViewDetails(shipment)} className="gap-2 cursor-pointer">
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Details</span>
                          </DropdownMenuItem>

                          {shipment.status === "PENDING" && (
                            <DropdownMenuItem
                              onClick={() => onStatusChange(shipment.id, "IN_TRANSIT")}
                              className="gap-2 text-amber-600 cursor-pointer"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Mark In Transit</span>
                            </DropdownMenuItem>
                          )}

                          {shipment.status !== "COMPLETED" && shipment.status !== "CANCELLED" && (
                            <DropdownMenuItem
                              onClick={() => onStatusChange(shipment.id, "CANCELLED")}
                              className="gap-2 text-rose-600 cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Cancel Shipment</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onDelete(shipment.id)}
                            className="gap-2 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Shipment</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedShipmentIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 dark:bg-card/95 border border-border/80 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 max-w-[95vw]">
          <div className="text-xs font-bold text-foreground px-2 border-r border-border shrink-0">
            {selectedShipmentIds.length} selected
          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange("ARRIVED")}
              className="text-xs text-blue-600 dark:text-blue-400 gap-1.5 h-8 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark Arrived</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange("IN_TRANSIT")}
              className="text-xs text-amber-600 dark:text-amber-400 gap-1.5 h-8 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              <Truck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark In Transit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              className="text-xs text-rose-600 dark:text-rose-400 gap-1.5 h-8 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAllShipments(false)}
              className="text-xs text-muted-foreground gap-1 h-8 shrink-0 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
