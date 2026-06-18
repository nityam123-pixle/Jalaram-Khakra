"use client"

import { useQuery } from "@tanstack/react-query"
import { getStockLedger } from "@/app/actions/inventory"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookMarked, ArrowUp, ArrowDown, Package, ShieldCheck } from "lucide-react"
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton-layouts"

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  RECEIVED_FROM_SUPPLIER: {
    label: "Stock In (Supplier)",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  SOLD_THROUGH_ORDER: {
    label: "Order Fulfillment",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  DAMAGED: {
    label: "Damaged Stock",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  MANUAL_ADJUSTMENT: {
    label: "Manual Adjustment",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  RETURN_RECEIVED: {
    label: "Customer Return",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  RETURN_SENT: {
    label: "Return to Supplier",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  OPENING_STOCK: {
    label: "Opening Stock",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800",
    icon: <Package className="h-3.5 w-3.5" />,
  },
}

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  }).format(new Date(date))
}

export function StockLedgerClient({ initialData }: { initialData: any[] }) {
  const { data: ledger = initialData, isLoading } = useQuery({
    queryKey: ["stockLedger"],
    queryFn: async () => {
      const result = await getStockLedger({ pageSize: 100 })
      return result.entries
    },
    initialData,
    staleTime: 60 * 1000,
  })

  if (isLoading && !ledger.length) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <div className="mt-8">
          <TableSkeleton columns={6} rows={10} />
        </div>
      </div>
    )
  }

  const stockIn = ledger.filter((l: any) => l.quantity > 0).reduce((sum: number, l: any) => sum + l.quantity, 0)
  const stockOut = ledger.filter((l: any) => l.quantity < 0).reduce((sum: number, l: any) => sum + Math.abs(l.quantity), 0)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Stock Ledger</h1>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Immutable audit trail of all inventory movements
          </p>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex flex-col items-end border-r pr-3">
            <span className="text-muted-foreground text-xs">Stock In</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{stockIn}</span>
          </div>
          <div className="flex flex-col items-start pl-1">
            <span className="text-muted-foreground text-xs">Stock Out</span>
            <span className="font-semibold text-red-600 dark:text-red-400">-{stockOut}</span>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[180px]">Date & Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right text-muted-foreground font-normal text-xs">Balance</TableHead>
              <TableHead className="w-[150px]">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <BookMarked className="h-8 w-8 mb-2 opacity-50" />
                    <p>No ledger entries found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ledger.map((entry: any) => {
                const cfg = ACTION_CONFIG[entry.action] || { 
                  label: entry.action, 
                  color: "text-slate-600", 
                  bg: "bg-slate-100", 
                  icon: <Package className="h-3 w-3" /> 
                }
                const isPositive = entry.quantity > 0

                return (
                  <TableRow key={entry.id} className="text-sm">
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.variant.product.name}</span>
                        <span className="text-xs text-muted-foreground">{entry.variant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${cfg.bg} ${cfg.color} text-[11px] font-medium`}>
                        {cfg.icon}
                        {cfg.label}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isPositive ? '+' : ''}{entry.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {entry.stockAfter}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {entry.referenceId && (
                          <span className="text-xs font-mono">{entry.referenceId.slice(0, 8)}</span>
                        )}
                        {entry.notes && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={entry.notes}>
                            {entry.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
