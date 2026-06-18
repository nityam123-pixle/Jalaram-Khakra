"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, FileText, Edit2, CheckCircle, Trash2, MessageCircle, Eye } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

interface OrderActionsMenuProps {
  order: any
  onViewDetails: (order: any) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}

export function OrderActionsMenu({
  order,
  onViewDetails,
  onStatusChange,
  onDelete
}: OrderActionsMenuProps) {
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true)
    try {
      const { generateInvoiceForOrder } = await import('@/app/actions/invoice')
      const inv = await generateInvoiceForOrder(order.id)
      if (inv?.pdfUrl) {
        window.open(inv.pdfUrl, '_blank')
      }
      toast.success("Invoice generated successfully!")
    } catch (e: any) {
      toast.error(e.message || "Failed to generate invoice")
    } finally {
      setGeneratingInvoice(false)
    }
  }

  const handleWhatsAppShare = () => {
    const total = (order.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
    const itemsText = (order.items ?? [])
      .map((i: any) => `${i.productName} (${i.variantName}) x ${i.quantity}`)
      .join(", ")
    const text = `Hi ${order.customer?.shop_name || order.shop_name}, your order totaling ₹${total} containing: ${itemsText} is being processed. Thanks, Jalaram Khakra.`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank")
  }

  const normalizedStatus = order.status?.toLowerCase() || "pending"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px] bg-card border border-border/80">
        <DropdownMenuItem onClick={() => onViewDetails(order)} className="gap-2 text-xs cursor-pointer">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span>View Details</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer">
          <a href={`/orders/${order.id}/edit`}>
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Edit Order</span>
          </a>
        </DropdownMenuItem>

        {order.invoice?.pdfUrl ? (
          <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer">
            <a href={order.invoice.pdfUrl} download={`${order.invoice.invoiceNumber}.pdf`}>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Download Invoice</span>
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleGenerateInvoice(); }} disabled={generatingInvoice} className="gap-2 text-xs cursor-pointer">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{generatingInvoice ? "Generating..." : "Generate Invoice"}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2 text-xs cursor-pointer">
          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Share WhatsApp</span>
        </DropdownMenuItem>

        {normalizedStatus !== "completed" && normalizedStatus !== "delivered" && (
          <>
            <DropdownMenuSeparator className="border-border" />
            <DropdownMenuItem
              onClick={() => onStatusChange(order.id, "completed")}
              className="gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mark Complete</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="border-border" />
        <DropdownMenuItem
          onClick={() => onDelete(order.id)}
          className="gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
