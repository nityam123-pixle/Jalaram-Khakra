"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { POStats, POStatsData } from "./po-stats"
import { POInsights } from "./po-insights"
import { POFilters } from "./po-filters"
import { POTable } from "./po-table"
import { POMobileCards } from "./po-mobile-cards"
import { PODetailsSheet } from "./po-details-sheet"
import { CreatePODialog } from "@/components/inventory/create-po-dialog"
import { Button } from "@/components/ui/button"
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
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  bulkDeletePurchaseOrders,
  bulkUpdatePurchaseOrderStatus,
} from "@/app/actions/inventory"
import { Download, ClipboardList, Plus, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

interface PurchaseOrdersDashboardProps {
  initialData: any[]
  suppliers: any[]
  catalog: any[]
}

export function PurchaseOrdersDashboard({
  initialData,
  suppliers,
  catalog,
}: PurchaseOrdersDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [supplierFilter, setSupplierFilter] = useState("ALL")

  // Selection & Sheet States
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeSheetPO, setActiveSheetPO] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "bulk"
    id?: string
    ids?: string[]
  } | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Calculate KPI Stats
  const stats: POStatsData = useMemo(() => {
    let totalSpend = 0
    let draftCount = 0
    let inTransitCount = 0
    let receivedCount = 0

    for (const po of initialData) {
      const items = po.items || []
      const calculatedTotal = items.reduce(
        (sum: number, i: any) => sum + ((Number(i.quantityOrdered) || 0) * (Number(i.unitCostPrice) || 0)),
        0
      )
      const amount = po.invoiceAmount ?? calculatedTotal
      totalSpend += amount

      if (po.status === "DRAFT") draftCount++
      else if (po.status === "ORDERED" || po.status === "IN_TRANSIT") inTransitCount++
      else if (po.status === "RECEIVED") receivedCount++
    }

    return {
      totalPOs: initialData.length,
      draftCount,
      inTransitCount,
      receivedCount,
      totalSpend,
      suppliersCount: suppliers.length,
    }
  }, [initialData, suppliers])

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: initialData.length,
      DRAFT: 0,
      ORDERED: 0,
      IN_TRANSIT: 0,
      PARTIALLY_RECEIVED: 0,
      RECEIVED: 0,
      CANCELLED: 0,
    }
    for (const po of initialData) {
      if (counts[po.status] !== undefined) {
        counts[po.status]++
      }
    }
    return counts
  }, [initialData])

  // Filtered and Search POs
  const filteredPOs = useMemo(() => {
    return initialData.filter((po) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchNumber = po.poNumber?.toLowerCase().includes(query)
        const matchSupplier = po.supplier?.name?.toLowerCase().includes(query)
        const matchTransport = po.transportDetails?.toLowerCase().includes(query)
        const matchNotes = po.notes?.toLowerCase().includes(query)
        if (!matchNumber && !matchSupplier && !matchTransport && !matchNotes) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "ALL" && po.status !== statusFilter) {
        return false
      }

      // Supplier filter
      if (supplierFilter !== "ALL" && po.supplierId !== supplierFilter) {
        return false
      }

      return true
    })
  }, [initialData, searchTerm, statusFilter, supplierFilter])

  // Paginated POs
  const totalCount = filteredPOs.length
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1
  const paginatedPOs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredPOs.slice(start, start + itemsPerPage)
  }, [filteredPOs, currentPage, itemsPerPage])

  // Selection Handlers
  const handleSelectPO = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedPOs.map((po) => po.id))
    } else {
      setSelectedIds([])
    }
  }

  // View Details
  const handleViewDetails = (po: any) => {
    setActiveSheetPO(po)
    setIsSheetOpen(true)
  }

  // Single Status Change
  const handleStatusChange = (poId: string, newStatus: any) => {
    startTransition(async () => {
      try {
        await updatePurchaseOrderStatus(poId, newStatus)
        toast.success(`PO status updated to ${newStatus.toLowerCase()}`)
        router.refresh()
      } catch (err) {
        toast.error("Failed to update PO status")
      }
    })
  }

  // Bulk Status Change
  const handleBulkStatusChange = (newStatus: any) => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      try {
        await bulkUpdatePurchaseOrderStatus(selectedIds, newStatus)
        toast.success(`Updated ${selectedIds.length} purchase orders`)
        setSelectedIds([])
        router.refresh()
      } catch (err) {
        toast.error("Failed to update purchase orders")
      }
    })
  }

  // Delete Handlers
  const handleDelete = (poId: string) => {
    setDeleteTarget({ type: "single", id: poId })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setDeleteTarget({ type: "bulk", ids: selectedIds })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        if (deleteTarget.type === "single" && deleteTarget.id) {
          await deletePurchaseOrder(deleteTarget.id)
          toast.success("Purchase order deleted")
        } else if (deleteTarget.type === "bulk" && deleteTarget.ids) {
          await bulkDeletePurchaseOrders(deleteTarget.ids)
          toast.success(`Deleted ${deleteTarget.ids.length} purchase orders`)
          setSelectedIds([])
        }
        setDeleteTarget(null)
        router.refresh()
      } catch (err) {
        toast.error("Failed to delete purchase order")
      }
    })
  }

  // CSV Export
  const handleExportCSV = () => {
    try {
      const headers = [
        "PO Number",
        "Supplier",
        "Supplier City",
        "Status",
        "Items Count",
        "Expected Delivery",
        "Amount (INR)",
        "Created Date",
      ]
      const rows = filteredPOs.map((po) => {
        const items = po.items || []
        const calculatedTotal = items.reduce(
          (sum: number, i: any) => sum + ((Number(i.quantityOrdered) || 0) * (Number(i.unitCostPrice) || 0)),
          0
        )
        const amount = po.invoiceAmount ?? calculatedTotal
        return [
          po.poNumber,
          `"${(po.supplier?.name || "").replace(/"/g, '""')}"`,
          `"${(po.supplier?.city || "").replace(/"/g, '""')}"`,
          po.status,
          items.length,
          po.expectedDelivery ? new Date(po.expectedDelivery).toISOString().slice(0, 10) : "",
          Math.round(amount),
          po.createdAt ? new Date(po.createdAt).toISOString().slice(0, 10) : "",
        ].join(",")
      })

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Purchase orders CSV exported successfully")
    } catch {
      toast.error("Failed to export CSV")
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("ALL")
    setSupplierFilter("ALL")
    setCurrentPage(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter !== "ALL" || supplierFilter !== "ALL"
  )

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Purchase Orders
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage vendor purchase orders, track transport logistics, and audit inventory procurement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredPOs.length === 0}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <CreatePODialog suppliers={suppliers} catalog={catalog} />
        </div>
      </div>

      {/* Stats KPI Color Cards */}
      <POStats stats={stats} />

      {/* Quick Insights Strip */}
      <POInsights stats={stats} pos={initialData} />

      {/* Filters Bar */}
      <POFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        supplierFilter={supplierFilter}
        setSupplierFilter={setSupplierFilter}
        suppliers={suppliers}
        statusCounts={statusCounts}
        onClearFilters={handleClearFilters}
      />

      {/* Desktop Table & Mobile Cards */}
      {paginatedPOs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border/80 p-6">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No purchase orders found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {hasActiveFilters
              ? "No purchase orders match your filter criteria. Try resetting filters."
              : "No purchase orders created yet. Create your first PO to begin tracking incoming stock."}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
                Reset Filters
              </Button>
            ) : (
              <CreatePODialog suppliers={suppliers} catalog={catalog} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:block">
            <POTable
              pos={paginatedPOs}
              selectedPOIds={selectedIds}
              onSelectPO={handleSelectPO}
              onSelectAllPOs={handleSelectAll}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          </div>

          <div className="md:hidden">
            <POMobileCards
              pos={paginatedPOs}
              selectedPOIds={selectedIds}
              onSelectPO={handleSelectPO}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/80 pt-5 mt-4 text-sm">
              <span className="text-xs text-muted-foreground font-medium">
                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalCount}</span> purchase orders
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="text-xs h-8"
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1
                  if (
                    totalPages > 6 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (page === 2 && currentPage > 3) {
                      return (
                        <span key="el-1" className="text-muted-foreground px-1 text-xs select-none">
                          ...
                        </span>
                      )
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return (
                        <span key="el-2" className="text-muted-foreground px-1 text-xs select-none">
                          ...
                        </span>
                      )
                    }
                    return null
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`text-xs h-8 w-8 p-0 ${
                        currentPage === page ? "bg-foreground text-background" : ""
                      }`}
                    >
                      {page}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="text-xs h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PO Details Drawer */}
      <PODetailsSheet
        po={activeSheetPO}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onStatusChange={(poId, newStatus) => {
          setActiveSheetPO((prev: any) => prev ? { ...prev, status: newStatus } : null)
          router.refresh()
        }}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "single"
                ? "This will permanently delete this purchase order and remove any pending linked incoming shipments."
                : `This will permanently delete ${deleteTarget?.ids?.length ?? 0} selected purchase orders and their unreceived shipments.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
