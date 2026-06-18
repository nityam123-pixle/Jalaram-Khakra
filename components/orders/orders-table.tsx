"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "./order-status-badge"
import { OrderActionsMenu } from "./order-actions-menu"
import {
  MapPin,
  Package,
  IndianRupee,
  CheckCircle,
  Clock,
  RotateCcw,
  Trash2,
  X,
  ArrowUpDown,
} from "lucide-react"

interface OrdersTableProps {
  orders: any[]
  selectedOrderIds: string[]
  onSelectOrder: (id: string, selected: boolean) => void
  onSelectAllOrders: (selected: boolean) => void
  onViewDetails: (order: any) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  onBulkStatusChange: (status: string) => void
  onBulkDelete: () => void
  sortColumn: "date" | "total" | null
  sortDirection: "asc" | "desc"
  onSort: (column: "date" | "total") => void
}

export function OrdersTable({
  orders,
  selectedOrderIds,
  onSelectOrder,
  onSelectAllOrders,
  onViewDetails,
  onStatusChange,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
  sortColumn,
  sortDirection,
  onSort,
}: OrdersTableProps) {
  const allSelected = orders.length > 0 && selectedOrderIds.length === orders.length

  const handleSelectAllChange = (checked: boolean) => {
    onSelectAllOrders(checked)
  }

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    })
  }

  return (
    <div className="relative">
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[45px] py-4 pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAllChange}
                  aria-label="Select all orders"
                />
              </TableHead>
              <TableHead className="py-4">Order ID & Date</TableHead>
              <TableHead className="py-4">Customer & City</TableHead>
              <TableHead className="py-4">Items Summary</TableHead>
              <TableHead className="py-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort("total")}
                  className="-mr-2 gap-1 text-xs hover:bg-transparent font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  <span>Total Amount</span>
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="py-4 text-right">Profit & Margin</TableHead>
              <TableHead className="py-4">Status</TableHead>
              <TableHead className="w-[50px] py-4 pr-4 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {orders.map((order) => {
              const isSelected = selectedOrderIds.includes(order.id)
              const items = order.items ?? []
              const totalItemsCount = items.length
              const totalWeight = Number(order.total_khakhra_kg) || 0
              
              // Sum prices from orderItems
              const totalRevenue = items.reduce((acc: number, i: any) => acc + Number(i.totalRevenue), 0)
              const totalCost = items.reduce((acc: number, i: any) => acc + Number(i.totalCost), 0)
              const totalProfit = items.reduce((acc: number, i: any) => acc + Number(i.totalProfit), 0)
              const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

              return (
                <TableRow
                  key={order.id}
                  className={`hover:bg-muted/10 transition-colors duration-150 ${
                    isSelected ? "bg-muted/20" : ""
                  }`}
                >
                  <TableCell className="py-3.5 pl-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectOrder(order.id, !!checked)}
                      aria-label={`Select order ${order.id}`}
                    />
                  </TableCell>
                  
                  <TableCell className="py-3.5 font-medium">
                    <div className="flex flex-col">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="text-sm font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors duration-150"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </button>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        {formatShortDate(order.created_at)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <div className="flex flex-col max-w-[220px]">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {order.customer?.shop_name || order.shop_name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                        <span className="text-[11px] text-muted-foreground truncate capitalize">
                          {order.city}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    {/* Aggregate badges: KG + Packets + Boxes */}
                    {(() => {
                      const kgTotal = items.reduce((acc: number, i: any) => {
                        if (i.variant?.unitType === 'KG') return acc + Number(i.quantity)
                        return acc
                      }, 0)
                      const packetTotal = items.reduce((acc: number, i: any) => {
                        if (i.variant?.unitType === 'PACKET') return acc + Number(i.quantity)
                        return acc
                      }, 0)
                      const boxTotal = items.reduce((acc: number, i: any) => {
                        if (i.variant?.unitType === 'BOX') return acc + Number(i.quantity)
                        return acc
                      }, 0)
                      // Fallback for old orders without variant relation
                      const fallbackWeight = totalWeight

                      return (
                        <HoverCard openDelay={100} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="flex flex-wrap items-center gap-1 cursor-help">
                              <Package className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                              <span className="text-xs font-medium text-foreground">
                                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                              </span>
                              {kgTotal > 0 && (
                                <span className="text-[10px] bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded px-1.5 py-0.5 font-medium">
                                  {kgTotal % 1 === 0 ? kgTotal : kgTotal.toFixed(1)}kg
                                </span>
                              )}
                              {!kgTotal && fallbackWeight > 0 && (
                                <span className="text-[10px] bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded px-1.5 py-0.5 font-medium">
                                  {fallbackWeight.toFixed(1)}kg
                                </span>
                              )}
                              {packetTotal > 0 && (
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded px-1.5 py-0.5 font-medium">
                                  {packetTotal} pkt
                                </span>
                              )}
                              {boxTotal > 0 && (
                                <span className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 rounded px-1.5 py-0.5 font-medium">
                                  {boxTotal} box
                                </span>
                              )}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent side="top" className="w-[300px] p-3">
                            {items.length === 0 ? (
                              <p className="text-xs italic text-muted-foreground">No items in order</p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Line Items</p>
                                <div className="divide-y divide-border/60 max-h-[200px] overflow-y-auto">
                                  {items.map((i: any) => {
                                    const unit = i.variant?.unitType ?? 'PACKET'
                                    const unitLabel = unit === 'KG' ? 'kg' : unit === 'BOX' ? 'box' : 'pkt'
                                    const subtotal = Number(i.totalRevenue || 0)
                                    return (
                                      <div key={i.id} className="py-1.5 text-[11px]">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-semibold text-foreground truncate">
                                            {i.productName}
                                          </span>
                                          <span className="shrink-0 font-medium">
                                            ₹{Math.round(subtotal).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-muted-foreground truncate">{i.variantName}</span>
                                          <span className="shrink-0 text-muted-foreground">·</span>
                                          <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 shrink-0">
                                            {i.categoryName}
                                          </Badge>
                                          <span className="shrink-0 ml-auto font-medium text-foreground">
                                            {unit === 'KG'
                                              ? `${Number(i.quantity) % 1 === 0 ? Number(i.quantity) : Number(i.quantity).toFixed(1)}${unitLabel}`
                                              : `${Number(i.quantity)}${unitLabel}`
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </HoverCardContent>
                        </HoverCard>
                      )
                    })()}
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-bold text-foreground">
                    <div className="flex items-center justify-end gap-0.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round(totalRevenue).toLocaleString("en-IN")}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <IndianRupee className="h-2.5 w-2.5" />
                        <span>{Math.round(totalProfit).toLocaleString("en-IN")}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {marginPercent.toFixed(1)}% margin
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <OrderStatusBadge status={order.status} />
                  </TableCell>

                  <TableCell className="py-3.5 pr-4 text-right">
                    <OrderActionsMenu
                      order={order}
                      onViewDetails={onViewDetails}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Actions popover */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/95 dark:bg-card/95 border border-border/80 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 max-w-[95vw]">
          <div className="text-xs font-bold text-foreground px-2 border-r border-border shrink-0">
            {selectedOrderIds.length} selected
          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange("completed")}
              className="text-xs text-emerald-600 dark:text-emerald-400 gap-1.5 h-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Complete</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange("processing")}
              className="text-xs text-blue-600 dark:text-blue-400 gap-1.5 h-8 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Process</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange("pending")}
              className="text-xs text-amber-600 dark:text-amber-400 gap-1.5 h-8 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Pending</span>
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
              onClick={() => onSelectAllOrders(false)}
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
