"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Printer,
  Download,
  Share2,
  MoreHorizontal,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { InvoiceItem } from "./invoice-table"
import { getUnifiedOrderItems } from "@/lib/order-utils"

interface InvoiceDetailPanelProps {
  invoice: InvoiceItem | null
  onStatusChange: (id: string, newStatus: "PAID" | "PENDING" | "PARTIAL" | "CANCELLED") => Promise<void>
}

export function InvoiceDetailPanel({ invoice, onStatusChange }: InvoiceDetailPanelProps) {
  const [copied, setCopied] = useState(false)

  if (!invoice) {
    return (
      <div className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No Invoice Selected</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          Click on any invoice row in the list to view its real-time financial details, line items, and payment info.
        </p>
      </div>
    )
  }

  const handlePrint = () => {
    if (invoice.pdfUrl) {
      const printWindow = window.open(invoice.pdfUrl, "_blank")
      if (printWindow) {
        printWindow.onload = () => printWindow.print()
      }
    } else {
      window.print()
    }
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice ${invoice.invoiceNumber} for ${invoice.customer?.shop_name || "Customer"}`,
          url,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Invoice link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/25">
            Paid
          </span>
        )
      case "PENDING":
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/25">
            Pending
          </span>
        )
      case "CANCELLED":
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full text-rose-700 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/25">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full text-blue-700 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/25">
            {status}
          </span>
        )
    }
  }

  // Derive complete, real items from order using getUnifiedOrderItems (never fabricate data)
  const orderItems = getUnifiedOrderItems(invoice.order)

  return (
    <div className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 space-y-6 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
                {invoice.invoiceNumber}
              </h2>
              {statusBadge(invoice.paymentStatus)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Issued on {format(new Date(invoice.createdAt || invoice.invoiceDate), "dd MMM yyyy, hh:mm a")}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 px-2.5 text-xs gap-1.5 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-foreground"
              title="Print Invoice"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Print</span>
            </Button>

            {invoice.pdfUrl ? (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-2.5 text-xs gap-1.5 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-foreground"
                title="Download PDF"
              >
                <a href={invoice.pdfUrl} download={`${invoice.invoiceNumber}.pdf`}>
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Download PDF</span>
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 px-2.5 text-xs gap-1.5 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-foreground"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>PDF</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2.5 text-xs gap-1.5 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-foreground"
              title="Share Invoice"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span>Share</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-muted-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                <DropdownMenuItem
                  onClick={() => onStatusChange(invoice.id, "PAID")}
                  disabled={invoice.paymentStatus === "PAID"}
                  className="text-xs cursor-pointer gap-2 text-emerald-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(invoice.id, "PENDING")}
                  disabled={invoice.paymentStatus === "PENDING"}
                  className="text-xs cursor-pointer gap-2 text-amber-400"
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 2-Column Section: Customer & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Customer Column */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Customer
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">
                {invoice.customer?.shop_name || "Unknown Customer"}
              </p>
              {invoice.customer?.city && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span>{invoice.customer.city}</span>
                </p>
              )}
              {invoice.customer?.phone && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="font-mono">{invoice.customer.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Payment & Invoice Info Column */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Payment & Invoice Info
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs">
              <span className="text-muted-foreground">Status</span>
              <div className="text-right sm:text-left">
                {statusBadge(invoice.paymentStatus)}
              </div>

              <span className="text-muted-foreground">Invoice Date</span>
              <span className="font-medium text-foreground text-right sm:text-left">
                {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
              </span>

              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium text-foreground text-right sm:text-left">
                {invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMM yyyy") : "Upon Receipt"}
              </span>

              <span className="text-muted-foreground">Linked Order</span>
              <span className="font-mono font-medium text-foreground text-[11px] truncate text-right sm:text-left">
                {invoice.orderId ? `#${invoice.orderId.slice(0, 8).toUpperCase()}` : "Direct Invoice"}
              </span>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Items ({orderItems.length})
            </p>
          </div>
          <div className="border border-border/80 rounded-lg overflow-hidden bg-muted/10">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    <th className="py-2 px-3 text-left w-8">#</th>
                    <th className="py-2 px-3 text-left">Product</th>
                    <th className="py-2 px-3 text-left">Variant</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground italic">
                        No individual line items recorded for this invoice.
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {item.variantName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.quantity} {item.unitType === "KG" ? "kg" : item.unitType === "BOX" ? "box" : "pkt"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ₹{Math.round(item.unitPrice).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                          ₹{Math.round(item.totalPrice).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotal / Discount / Total */}
            <div className="p-3 border-t border-border/80 bg-muted/20 space-y-1.5 flex flex-col items-end text-xs">
              <div className="flex justify-between w-48 text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">
                  ₹{Number(invoice.subtotal).toLocaleString("en-IN")}
                </span>
              </div>
              {Number(invoice.tax || 0) > 0 && (
                <div className="flex justify-between w-48 text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-mono text-foreground">
                    ₹{Number(invoice.tax).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between w-48 pt-1.5 border-t border-border/80 font-bold text-sm text-foreground">
                <span>Total</span>
                <span className="font-mono text-base text-foreground">
                  ₹{Number(invoice.total).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section - ONLY rendered if real notes exist in DB */}
        {Boolean((invoice.order as any)?.notes) && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Notes
            </p>
            <p className="text-xs text-muted-foreground bg-muted/20 border border-border/60 rounded-lg p-2.5 leading-relaxed">
              {(invoice.order as any).notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
