"use client"

import { useTransition } from "react"
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { POStatusBadge } from "./po-status-badge"
import {
  Eye,
  MoreHorizontal,
  CheckCircle,
  Truck,
  XCircle,
  Trash2,
  Package,
  Calendar,
  AlertTriangle,
  Building2,
  IndianRupee,
  X,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

interface POTableProps {
  pos: any[]
  selectedPOIds: string[]
  onSelectPO: (id: string, checked: boolean) => void
  onSelectAllPOs: (checked: boolean) => void
  onViewDetails: (po: any) => void
  onStatusChange: (poId: string, status: any) => void
  onDelete: (poId: string) => void
  onBulkStatusChange: (status: any) => void
  onBulkDelete: () => void
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

export function POTable({
  pos,
  selectedPOIds,
  onSelectPO,
  onSelectAllPOs,
  onViewDetails,
  onStatusChange,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
}: POTableProps) {
  const isAllSelected = pos.length > 0 && selectedPOIds.length === pos.length

  return (
    <div className="relative">
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/80">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => onSelectAllPOs(Boolean(checked))}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                PO Number
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Supplier
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Items & Volume
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Expected Delivery
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider text-right">
                PO Amount
              </TableHead>
              <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="w-[50px] pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pos.map((po) => {
              const isSelected = selectedPOIds.includes(po.id)
              const items = po.items || []
              const totalUnits = items.reduce(
                (sum: number, i: any) => sum + (Number(i.quantityOrdered) || 0),
                0
              )
              const calculatedTotal = items.reduce(
                (sum: number, i: any) => sum + ((Number(i.quantityOrdered) || 0) * (Number(i.unitCostPrice) || 0)),
                0
              )
              const amount = po.invoiceAmount ?? calculatedTotal
              const isOverdue =
                po.expectedDelivery &&
                new Date(po.expectedDelivery) < new Date() &&
                po.status !== "RECEIVED" &&
                po.status !== "CANCELLED"

              return (
                <TableRow
                  key={po.id}
                  data-state={isSelected ? "selected" : undefined}
                  className="hover:bg-muted/30 border-b border-border/60 transition-colors text-xs"
                >
                  <TableCell className="pl-4 py-3.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectPO(po.id, Boolean(checked))}
                      aria-label={`Select ${po.poNumber}`}
                      className="translate-y-[2px]"
                    />
                  </TableCell>

                  <TableCell className="py-3.5 font-medium">
                    <button
                      onClick={() => onViewDetails(po)}
                      className="font-mono font-bold text-foreground hover:underline text-left"
                    >
                      {po.poNumber}
                    </button>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(po.createdAt)}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {po.supplier?.name || "Unknown Supplier"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {po.supplier?.city || "No city"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border/60 text-left transition-colors">
                          <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-mono font-semibold">{totalUnits} units</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({items.length} types)
                          </span>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="w-[300px] p-3">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Line Items Preview
                          </p>
                          <div className="divide-y divide-border/60 max-h-[200px] overflow-y-auto">
                            {items.map((i: any) => {
                              const unit = i.variant?.unitType ?? "PACKET"
                              const unitLabel = unit === "KG" ? "kg" : unit === "BOX" ? "box" : "pkt"
                              return (
                                <div key={i.id} className="py-1.5 text-[11px] flex items-center justify-between gap-2">
                                  <div className="truncate">
                                    <p className="font-semibold text-foreground truncate">
                                      {i.variant?.product?.name || "Product"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {i.variant?.name}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-medium">
                                      {i.quantityOrdered} {unitLabel}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground"}>
                        {formatDate(po.expectedDelivery)}
                      </span>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1 py-0">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-bold text-foreground">
                    <div className="flex items-center justify-end gap-0.5 font-mono">
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <POStatusBadge status={po.status} />
                  </TableCell>

                  <TableCell className="py-3.5 pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem onClick={() => onViewDetails(po)} className="gap-2 cursor-pointer">
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </DropdownMenuItem>

                        {po.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(po.id, "ORDERED")}
                            className="gap-2 text-blue-600 dark:text-blue-400 cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Mark as Ordered</span>
                          </DropdownMenuItem>
                        )}

                        {(po.status === "DRAFT" || po.status === "ORDERED") && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(po.id, "IN_TRANSIT")}
                            className="gap-2 text-amber-600 dark:text-amber-400 cursor-pointer"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Mark In Transit</span>
                          </DropdownMenuItem>
                        )}

                        {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(po.id, "CANCELLED")}
                            className="gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel PO</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => onDelete(po.id)}
                          className="gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete PO</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedPOIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 dark:bg-card/95 border border-border/80 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 max-w-[95vw]">
          <div className="text-xs font-bold text-foreground px-2 border-r border-border shrink-0">
            {selectedPOIds.length} selected
          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange("ORDERED")}
              className="text-xs text-blue-600 dark:text-blue-400 gap-1.5 h-8 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark Ordered</span>
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
              onClick={() => onBulkStatusChange("CANCELLED")}
              className="text-xs text-slate-600 dark:text-slate-400 gap-1.5 h-8 hover:bg-slate-50 dark:hover:bg-slate-950/20"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cancel</span>
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
              onClick={() => onSelectAllPOs(false)}
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
