"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { POStatusBadge } from "./po-status-badge"
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
  IndianRupee,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface POMobileCardsProps {
  pos: any[]
  selectedPOIds: string[]
  onSelectPO: (id: string, checked: boolean) => void
  onViewDetails: (po: any) => void
  onStatusChange: (poId: string, status: any) => void
  onDelete: (poId: string) => void
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

export function POMobileCards({
  pos,
  selectedPOIds,
  onSelectPO,
  onViewDetails,
  onStatusChange,
  onDelete,
}: POMobileCardsProps) {
  return (
    <div className="space-y-3">
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

        return (
          <Card
            key={po.id}
            className={`border transition-all overflow-hidden rounded-xl ${
              isSelected
                ? "border-primary/50 bg-primary/[0.02]"
                : "border-border/80 bg-card hover:border-border"
            }`}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: Select + PO # + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectPO(po.id, Boolean(checked))}
                    aria-label={`Select ${po.poNumber}`}
                  />
                  <div>
                    <button
                      onClick={() => onViewDetails(po)}
                      className="font-mono font-bold text-sm text-foreground hover:underline text-left block"
                    >
                      {po.poNumber}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(po.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <POStatusBadge status={po.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => onViewDetails(po)} className="gap-2">
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </DropdownMenuItem>
                      {po.status === "DRAFT" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(po.id, "ORDERED")}
                          className="gap-2 text-blue-600"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Mark Ordered
                        </DropdownMenuItem>
                      )}
                      {(po.status === "DRAFT" || po.status === "ORDERED") && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(po.id, "IN_TRANSIT")}
                          className="gap-2 text-amber-600"
                        >
                          <Truck className="h-3.5 w-3.5" /> Mark In Transit
                        </DropdownMenuItem>
                      )}
                      {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(po.id, "CANCELLED")}
                          className="gap-2 text-rose-600"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel PO
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(po.id)}
                        className="gap-2 text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete PO
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Supplier & Details */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[160px]">{po.supplier?.name || "Supplier"}</span>
                </div>
                <div className="font-mono font-bold text-foreground">
                  {formatCurrency(amount)}
                </div>
              </div>

              {/* Items & Delivery */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{totalUnits} units</span>
                  <span>({items.length} types)</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Exp: <strong className="text-foreground">{formatDate(po.expectedDelivery)}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
