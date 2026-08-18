"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { IncomingStats, IncomingStatsData } from "./incoming-stats"
import { IncomingInsights } from "./incoming-insights"
import { IncomingFilters } from "./incoming-filters"
import { IncomingTable } from "./incoming-table"
import { IncomingMobileCards } from "./incoming-mobile-cards"
import { IncomingDetailsSheet } from "./incoming-details-sheet"
import { CreateShipmentDialog } from "@/components/inventory/create-shipment-dialog"
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
  updateShipmentStatus,
  deleteIncomingShipment,
  bulkDeleteIncomingShipments,
  bulkUpdateShipmentStatus,
} from "@/app/actions/inventory"
import { Truck, FileSpreadsheet, Plus } from "lucide-react"
import { toast } from "sonner"

interface IncomingDashboardProps {
  initialData: any[]
  suppliers: any[]
  pos: any[]
}

export function IncomingDashboard({
  initialData,
  suppliers,
  pos,
}: IncomingDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [supplierFilter, setSupplierFilter] = useState("ALL")

  // Selections & Sheet
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeSheetShipment, setActiveSheetShipment] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "bulk"
    id?: string
    ids?: string[]
  } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Active POs for new shipments (Ordered or In Transit or Draft)
  const activePOs = useMemo(() => {
    return pos.filter((po) => po.status !== "RECEIVED" && po.status !== "CANCELLED")
  }, [pos])

  // Calculate KPI Stats
  const stats: IncomingStatsData = useMemo(() => {
    let inTransitCount = 0
    let arrivedCount = 0
    let completedCount = 0
    let overdueCount = 0
    const now = new Date()

    for (const s of initialData) {
      if (s.status === "IN_TRANSIT") inTransitCount++
      else if (s.status === "ARRIVED" || s.status === "RECEIVING") arrivedCount++
      else if (s.status === "COMPLETED") completedCount++

      if (
        s.expectedArrival &&
        new Date(s.expectedArrival) < now &&
        s.status !== "COMPLETED" &&
        s.status !== "CANCELLED"
      ) {
        overdueCount++
      }
    }

    return {
      totalShipments: initialData.length,
      inTransitCount,
      arrivedCount,
      completedCount,
      overdueCount,
      suppliersCount: suppliers.length,
    }
  }, [initialData, suppliers])

  // Status counts for chips
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: initialData.length,
      PENDING: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      RECEIVING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    }
    for (const s of initialData) {
      if (counts[s.status] !== undefined) {
        counts[s.status]++
      }
    }
    return counts
  }, [initialData])

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return initialData.filter((s) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchNumber = s.shipmentNumber?.toLowerCase().includes(query)
        const matchSupplier = s.supplier?.name?.toLowerCase().includes(query)
        const matchTransport = s.transportName?.toLowerCase().includes(query)
        const matchVehicle = s.vehicleNumber?.toLowerCase().includes(query)
        const matchPO = s.purchaseOrder?.poNumber?.toLowerCase().includes(query)
        if (!matchNumber && !matchSupplier && !matchTransport && !matchVehicle && !matchPO) {
          return false
        }
      }

      if (statusFilter !== "ALL" && s.status !== statusFilter) {
        return false
      }

      if (supplierFilter !== "ALL" && s.supplierId !== supplierFilter) {
        return false
      }

      return true
    })
  }, [initialData, searchTerm, statusFilter, supplierFilter])

  // Paginated shipments
  const totalCount = filteredShipments.length
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredShipments.slice(start, start + itemsPerPage)
  }, [filteredShipments, currentPage, itemsPerPage])

  // Select Handlers
  const handleSelectShipment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedShipments.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  // View Details
  const handleViewDetails = (shipment: any) => {
    setActiveSheetShipment(shipment)
    setIsSheetOpen(true)
  }

  // Single Status Change
  const handleStatusChange = (shipmentId: string, newStatus: any) => {
    startTransition(async () => {
      try {
        await updateShipmentStatus(shipmentId, newStatus)
        toast.success(`Shipment marked as ${newStatus.toLowerCase()}`)
        router.refresh()
      } catch (err) {
        toast.error("Failed to update shipment status")
      }
    })
  }

  // Bulk Status Change
  const handleBulkStatusChange = (newStatus: any) => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      try {
        await bulkUpdateShipmentStatus(selectedIds, newStatus)
        toast.success(`Updated ${selectedIds.length} shipments`)
        setSelectedIds([])
        router.refresh()
      } catch (err) {
        toast.error("Failed to update shipments")
      }
    })
  }

  // Delete Handlers
  const handleDelete = (shipmentId: string) => {
    setDeleteTarget({ type: "single", id: shipmentId })
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
          await deleteIncomingShipment(deleteTarget.id)
          toast.success("Shipment deleted")
        } else if (deleteTarget.type === "bulk" && deleteTarget.ids) {
          await bulkDeleteIncomingShipments(deleteTarget.ids)
          toast.success(`Deleted ${deleteTarget.ids.length} shipments`)
          setSelectedIds([])
        }
        setDeleteTarget(null)
        router.refresh()
      } catch (err) {
        toast.error("Failed to delete shipment")
      }
    })
  }

  // CSV Export
  const handleExportCSV = () => {
    try {
      const headers = [
        "Shipment #",
        "Supplier",
        "Transport Name",
        "Vehicle #",
        "Linked PO",
        "Status",
        "Expected Arrival",
        "Actual Arrival",
        "Created Date",
      ]
      const rows = filteredShipments.map((s) => [
        s.shipmentNumber,
        `"${(s.supplier?.name || "").replace(/"/g, '""')}"`,
        `"${(s.transportName || "").replace(/"/g, '""')}"`,
        s.vehicleNumber || "",
        s.purchaseOrder?.poNumber || "Direct",
        s.status,
        s.expectedArrival ? new Date(s.expectedArrival).toISOString().slice(0, 10) : "",
        s.actualArrival ? new Date(s.actualArrival).toISOString().slice(0, 10) : "",
        s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "",
      ].join(","))

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `incoming_shipments_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Incoming shipments CSV exported successfully")
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
            Incoming Stock & Freight
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track transport vehicles, verify delivered shipments, and audit stock intake into inventory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredShipments.length === 0}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <CreateShipmentDialog suppliers={suppliers} pos={activePOs} />
        </div>
      </div>

      {/* Stats KPI Color Cards */}
      <IncomingStats stats={stats} />

      {/* Quick Insights Strip */}
      <IncomingInsights stats={stats} />

      {/* Filters Bar */}
      <IncomingFilters
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
      {paginatedShipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border/80 p-6">
          <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No incoming shipments found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {hasActiveFilters
              ? "No shipments match your filter criteria. Try resetting filters."
              : "No incoming shipments recorded yet. Create a shipment or mark a PO as ordered."}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
                Reset Filters
              </Button>
            ) : (
              <CreateShipmentDialog suppliers={suppliers} pos={activePOs} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:block">
            <IncomingTable
              shipments={paginatedShipments}
              selectedShipmentIds={selectedIds}
              onSelectShipment={handleSelectShipment}
              onSelectAllShipments={handleSelectAll}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          </div>

          <div className="md:hidden">
            <IncomingMobileCards
              shipments={paginatedShipments}
              selectedShipmentIds={selectedIds}
              onSelectShipment={handleSelectShipment}
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
                of <span className="font-semibold text-foreground">{totalCount}</span> shipments
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

      {/* Shipment Details Drawer */}
      <IncomingDetailsSheet
        shipment={activeSheetShipment}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onStatusChange={(shipmentId, newStatus) => {
          setActiveSheetShipment((prev: any) => prev ? { ...prev, status: newStatus } : null)
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
                ? "This will permanently delete this incoming shipment and its intake logs."
                : `This will permanently delete ${deleteTarget?.ids?.length ?? 0} selected shipments and their logs.`}
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
