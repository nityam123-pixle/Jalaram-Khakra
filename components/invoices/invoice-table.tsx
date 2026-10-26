"use client"

import { useState } from "react"
import { format } from "date-fns"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MoreHorizontal,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Receipt,
} from "lucide-react"

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  orderId?: string | null
  customerId?: string | null
  invoiceDate: string | Date
  dueDate?: string | Date | null
  subtotal: number
  tax: number
  total: number
  paymentStatus: "PAID" | "PENDING" | "PARTIAL" | "CANCELLED"
  pdfUrl?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  customer?: {
    id: string
    shop_name: string
    city: string
    address?: string | null
    phone?: string | null
  } | null
  order?: {
    id: string
    status: string
    created_at?: string | Date | null
    notes?: string | null
    total_amount?: any
    items?: Array<{
      id: string
      productName: string
      categoryName?: string
      variantName: string
      quantity: number
      unitSellingPrice: number
      totalRevenue: number
    }>
    khakhra_items?: Array<any>
    wants_patra?: boolean | null
    patra_packets?: number | null
    patra_price_per_packet?: any
    wants_bhakarwadi?: boolean | null
    bhakarwadi_packets?: number | null
    bhakarwadi_price_per_packet?: any
    wants_fulvadi?: boolean | null
    fulvadi_packets?: number | null
    fulvadi_price_per_packet?: any
    wants_chikki?: boolean | null
    chikki_packets?: number | null
    chikki_price_per_packet?: any
  } | null
}

interface InvoiceTableProps {
  invoices: InvoiceItem[]
  totalCount: number
  currentPage: number
  pageSize?: number
  onPageChange: (page: number) => void
  selectedInvoice: InvoiceItem | null
  onSelectInvoice: (invoice: InvoiceItem) => void
  sortDirection: "desc" | "asc"
  onToggleSort: () => void
  onStatusChange: (id: string, newStatus: "PAID" | "PENDING" | "PARTIAL" | "CANCELLED") => Promise<void>
  onDeleteInvoice: (id: string) => Promise<void>
  onResetFilters?: () => void
  isLoading?: boolean
}

export function InvoiceTable({
  invoices,
  totalCount,
  currentPage,
  pageSize = 10,
  onPageChange,
  selectedInvoice,
  onSelectInvoice,
  sortDirection,
  onToggleSort,
  onStatusChange,
  onDeleteInvoice,
  onResetFilters,
  isLoading = false,
}: InvoiceTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceItem | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(invoices.map((inv) => inv.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handlePrint = (pdfUrl?: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, "_blank")
      if (printWindow) {
        printWindow.onload = () => printWindow.print()
      }
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/25">
            Paid
          </span>
        )
      case "PENDING":
        return (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/25">
            Pending
          </span>
        )
      case "CANCELLED":
        return (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full text-rose-700 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/25">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full text-blue-700 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/25">
            {status}
          </span>
        )
    }
  }

  // Calculate page buttons to show (e.g. 1, 2, 3, 4, 5 ... 20)
  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisible = 5

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) buttons.push(i)
        buttons.push("ellipsis")
        buttons.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        buttons.push(1)
        buttons.push("ellipsis")
        for (let i = totalPages - 4; i <= totalPages; i++) buttons.push(i)
      } else {
        buttons.push(1)
        buttons.push("ellipsis")
        buttons.push(currentPage - 1)
        buttons.push(currentPage)
        buttons.push(currentPage + 1)
        buttons.push("ellipsis")
        buttons.push(totalPages)
      }
    }

    return buttons
  }

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col justify-between h-full">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b border-border/80 border-l-4 border-l-transparent hover:bg-transparent">
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={
                    invoices.length > 0 && selectedIds.length === invoices.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="translate-y-0.5"
                />
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Invoice No.
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <button
                  type="button"
                  onClick={onToggleSort}
                  className="flex items-center gap-1 hover:text-foreground transition-colors group"
                >
                  <span>Date</span>
                  {sortDirection === "desc" ? (
                    <ArrowDown className="h-3 w-3 text-foreground" />
                  ) : (
                    <ArrowUp className="h-3 w-3 text-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Customer
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Amount
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="w-10 text-right pr-3">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            {invoices.map((invoice) => {
              const isSelected = selectedInvoice?.id === invoice.id
              const isChecked = selectedIds.includes(invoice.id)

              return (
                <TableRow
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice)}
                  className={`border-b border-border/40 border-l-4 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "border-l-zinc-950 dark:border-l-zinc-200 bg-zinc-200/90 dark:bg-zinc-800/90 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700/80"
                      : "border-l-transparent hover:bg-muted/50"
                  }`}
                >
                  {/* Checkbox */}
                  <TableCell
                    className="w-10 px-3"
                    onClick={(e) => handleSelectRow(invoice.id, e)}
                  >
                    <Checkbox
                      checked={isChecked}
                      aria-label={`Select invoice ${invoice.invoiceNumber}`}
                      className="translate-y-0.5"
                    />
                  </TableCell>

                  {/* Invoice No. */}
                  <TableCell className={`font-mono text-xs whitespace-nowrap ${isSelected ? "font-bold text-foreground" : "font-semibold text-foreground/90"}`}>
                    <span className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-200 shrink-0" />
                      )}
                      <span>{invoice.invoiceNumber}</span>
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                  </TableCell>

                  {/* Customer (Name + City) */}
                  <TableCell className="py-2.5">
                    <div className={`text-xs truncate max-w-[170px] sm:max-w-[200px] ${isSelected ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                      {invoice.customer?.shop_name || "Unknown Customer"}
                    </div>
                    {invoice.customer?.city && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                        <span className="truncate max-w-[150px]">
                          {invoice.customer.city}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className={`font-mono text-xs whitespace-nowrap ${isSelected ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                    ₹{Number(invoice.total).toLocaleString("en-IN")}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap">
                    {statusBadge(invoice.paymentStatus)}
                  </TableCell>

                  {/* Actions Menu */}
                  <TableCell className="text-right pr-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                        <DropdownMenuItem
                          onClick={() => onSelectInvoice(invoice)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </DropdownMenuItem>

                        {invoice.pdfUrl && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => handlePrint(invoice.pdfUrl, e)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-xs cursor-pointer gap-2">
                              <a
                                href={invoice.pdfUrl}
                                download={`${invoice.invoiceNumber}.pdf`}
                              >
                                <Download className="h-3.5 w-3.5" /> Download PDF
                              </a>
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => onStatusChange(invoice.id, "PAID")}
                          disabled={invoice.paymentStatus === "PAID"}
                          className="text-xs cursor-pointer gap-2 text-emerald-400 focus:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(invoice.id, "PENDING")}
                          disabled={invoice.paymentStatus === "PENDING"}
                          className="text-xs cursor-pointer gap-2 text-amber-400 focus:text-amber-300"
                        >
                          <Clock className="h-3.5 w-3.5" /> Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(invoice.id, "CANCELLED")}
                          disabled={invoice.paymentStatus === "CANCELLED"}
                          className="text-xs cursor-pointer gap-2 text-muted-foreground"
                        >
                          <Ban className="h-3.5 w-3.5" /> Mark as Cancelled
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setInvoiceToDelete(invoice)}
                          className="text-xs cursor-pointer gap-2 text-rose-500 focus:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Empty State */}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                    <Receipt className="h-8 w-8 stroke-[1.5] text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">
                      No invoices found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No invoices match your current search, status, or date range filters.
                    </p>
                    {onResetFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="mt-2 text-xs"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer matching screenshot */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/80 bg-muted/20 text-xs text-muted-foreground">
        <div>
          {totalCount > 0 ? (
            <span>
              Showing <span className="font-medium text-foreground">{startRecord}–{endRecord}</span> of{" "}
              <span className="font-medium text-foreground">{totalCount}</span> invoices
            </span>
          ) : (
            <span>No records to display</span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            {/* Previous */}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-7 w-7 border-border/80"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Page Buttons */}
            {renderPaginationButtons().map((btn, idx) => {
              if (btn === "ellipsis") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">
                    ...
                  </span>
                )
              }

              const pageNum = btn as number
              const isCurrent = pageNum === currentPage

              return (
                <Button
                  key={pageNum}
                  variant={isCurrent ? "default" : "outline"}
                  size="icon"
                  disabled={isLoading}
                  onClick={() => onPageChange(pageNum)}
                  className={`h-7 w-7 text-xs font-mono font-medium ${
                    isCurrent
                      ? "bg-foreground text-background hover:bg-foreground/90 border-transparent shadow-xs"
                      : "border-border/80 hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </Button>
              )
            })}

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-7 w-7 border-border/80"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!invoiceToDelete}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
      >
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete invoice{" "}
              <span className="font-mono font-semibold text-foreground">
                {invoiceToDelete?.invoiceNumber}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (invoiceToDelete) {
                  await onDeleteInvoice(invoiceToDelete.id)
                  setInvoiceToDelete(null)
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
