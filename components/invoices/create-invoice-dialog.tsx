"use client"

import { useState, useEffect, useTransition } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, RotateCw, Receipt, CheckCircle2 } from "lucide-react"
import { getEligibleOrdersForInvoice, generateInvoiceForOrder } from "@/app/actions/invoice"
import { toast } from "sonner"

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceCreated: (newInvoice: any) => void
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onInvoiceCreated,
}: CreateInvoiceDialogProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      loadOrders(search)
    }
  }, [open])

  const loadOrders = async (query?: string) => {
    setIsLoading(true)
    try {
      const data = await getEligibleOrdersForInvoice(query)
      setOrders(data)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load eligible orders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    loadOrders(val)
  }

  const handleGenerate = (orderId: string) => {
    setGeneratingId(orderId)
    startTransition(async () => {
      try {
        const newInvoice = await generateInvoiceForOrder(orderId)
        toast.success(`Invoice ${newInvoice.invoiceNumber} created successfully!`)
        onInvoiceCreated(newInvoice)
        onOpenChange(false)
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || "Failed to generate invoice")
      } finally {
        setGeneratingId(null)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Create Invoice from Order
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select an un-invoiced customer order to generate a new sequential invoice and PDF statement.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by customer, city, or order ID..."
            className="pl-9 text-xs h-9"
          />
        </div>

        {/* Orders List */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-border/40 border border-border/80 rounded-lg">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <RotateCw className="h-5 w-5 animate-spin" />
              <p className="text-xs">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-1.5 text-muted-foreground text-center px-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/80 mb-1" />
              <p className="text-xs font-medium text-foreground">All orders invoiced</p>
              <p className="text-[11px]">
                No pending uninvoiced orders found matching your search.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isGenerating = generatingId === order.id
              return (
                <div
                  key={order.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {order.customer?.shop_name || order.shop_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {order.city} • Order #{order.id.slice(0, 8)} •{" "}
                      {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy") : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-semibold text-xs text-foreground">
                      ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleGenerate(order.id)}
                      disabled={isGenerating}
                      className="h-7 text-xs px-2.5 bg-foreground text-background hover:bg-foreground/90"
                    >
                      {isGenerating ? (
                        <RotateCw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Generate
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
