"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getPurchaseOrders } from "@/app/actions/inventory"
import { CreatePODialog } from "@/components/inventory/create-po-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, Package, MoreHorizontal, Eye, Truck, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton-layouts"

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", color: "text-slate-500", badge: "secondary" },
  ORDERED: { label: "Ordered", color: "text-blue-500", badge: "default" },
  IN_TRANSIT: { label: "In Transit", color: "text-amber-500", badge: "outline" },
  PARTIALLY_RECEIVED: { label: "Partial", color: "text-orange-500", badge: "outline" },
  RECEIVED: { label: "Received", color: "text-emerald-500", badge: "default" },
  CANCELLED: { label: "Cancelled", color: "text-red-500", badge: "destructive" },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | string | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(date))
}

export function PurchaseOrdersClient({ 
  initialData, 
  suppliers, 
  catalog 
}: { 
  initialData: any[],
  suppliers: any[],
  catalog: any[]
}) {
  const [filterStatus, setFilterStatus] = useState("ALL")

  const { data: pos = initialData, isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => getPurchaseOrders(),
    initialData,
    staleTime: 60 * 1000,
  })

  if (isLoading && !pos.length) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <PageHeaderSkeleton />
        <div className="mt-8">
          <TableSkeleton columns={7} rows={10} />
        </div>
      </div>
    )
  }

  const filteredPOs = pos.filter((po: any) => {
    if (filterStatus === "ALL") return true
    return po.status === filterStatus
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming stock orders from your suppliers
          </p>
        </div>
        <CreatePODialog suppliers={suppliers} catalog={catalog} />
      </div>

      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="ALL">All Orders</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="ORDERED">Ordered</TabsTrigger>
          <TabsTrigger value="IN_TRANSIT">In Transit</TabsTrigger>
          <TabsTrigger value="RECEIVED">Received</TabsTrigger>
        </TabsList>
        
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mb-2 opacity-50" />
                      <p>No purchase orders found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPOs.map((po: any) => {
                  const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT
                  const itemCount = po.items.reduce((sum: number, i: any) => sum + i.quantityOrdered, 0)
                  const estimatedValue = po.invoiceAmount ?? po.items.reduce((sum: number, i: any) => sum + (i.unitCostPrice * i.quantityOrdered), 0)
                  
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{po.supplier.name}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(po.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{itemCount} units</span>
                          <span className="text-muted-foreground text-xs">({po.items.length} types)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(po.expectedDelivery)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(estimatedValue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.badge}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {po.status === "DRAFT" && (
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Ordered
                              </DropdownMenuItem>
                            )}
                            {po.status === "ORDERED" && (
                              <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" /> Mark In Transit
                              </DropdownMenuItem>
                            )}
                            {(po.status === "DRAFT" || po.status === "ORDERED") && (
                              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                <XCircle className="mr-2 h-4 w-4" /> Cancel PO
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
    </div>
  )
}
