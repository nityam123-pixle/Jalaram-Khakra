"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { OrdersHeader } from "./orders-header"
import { OrdersStats } from "./orders-stats"
import { OrdersInsights } from "./orders-insights"
import { OrdersFilters } from "./orders-filters"
import { OrdersTable } from "./orders-table"
import { OrdersMobileCards } from "./orders-mobile-cards"
import { OrderDetailsSheet } from "./order-details-sheet"
import { OrdersEmptyState } from "./orders-empty-state"
import { toast } from "sonner"
import { getAllOrders, updateOrderStatus, deleteOrder, bulkUpdateOrderStatus, bulkDeleteOrders } from "@/app/actions/order"
import { Button } from "../ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"

interface OrdersDashboardProps {
  initialOrdersData: { data: any[], totalCount: number }
  initialStats: any
  initialCities: string[]
  catalog: any[]
}

export function OrdersDashboard({ initialOrdersData, initialStats, initialCities, catalog }: OrdersDashboardProps) {
  const queryClient = useQueryClient()

  // Safeguard: reset document body pointer-events to prevent stuck Radix UI overlays on navigation
  useEffect(() => {
    document.body.style.pointerEvents = ""
  }, [])

  // Filters State
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [productFilter, setProductFilter] = useState("all")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Sorting State
  const [sortColumn, setSortColumn] = useState<"date" | "total" | null>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // React Query Fetch (Moved down to use all states)
  const { data: serverData = initialOrdersData, isFetching } = useQuery({
    queryKey: ["orders", debouncedSearch, statusFilter, cityFilter, dateFilter, productFilter, currentPage, sortColumn, sortDirection],
    queryFn: () => getAllOrders({
      search: debouncedSearch,
      status: statusFilter,
      city: cityFilter,
      date: dateFilter,
      product: productFilter,
      page: currentPage,
      limit: itemsPerPage,
      sortColumn,
      sortDirection
    }),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 minute
  })

  // Checkbox Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Details sheet state
  const [activeSheetOrder, setActiveSheetOrder] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Deletion Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "single"; id: string } | { type: "bulk"; ids: string[] } | null>(null)

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === "single") {
      deleteMutation.mutate(deleteTarget.id)
    } else {
      bulkDeleteMutation.mutate(deleteTarget.ids)
    }
    setDeleteConfirmOpen(false)
    setDeleteTarget(null)
    // Clear stuck body pointer-events style
    document.body.style.pointerEvents = ""
  }

  // Flatten products from catalog category hierarchy for filtering dropdown
  const productsList = useMemo(() => {
    const list: { id: string; name: string }[] = []
    if (catalog) {
      catalog.forEach((category: any) => {
        category.products?.forEach((product: any) => {
          product.variants?.forEach((variant: any) => {
            list.push({
              id: variant.id,
              name: `${product.name} (${variant.name})`,
            })
          })
        })
      })
    }
    return list
  }, [catalog])

  // Get unique cities directly from the server
  const citiesList = initialCities

  // Handle clearing filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCityFilter("all")
    setDateFilter("")
    setProductFilter("all")
  }

  // Paginated Orders and Metadata
  const paginatedOrders = serverData.data || []
  const totalCount = serverData.totalCount || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, cityFilter, dateFilter, productFilter])

  // Selection handlers
  const handleSelectOrder = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    }
  }

  const handleSelectAllOrders = (selected: boolean) => {
    if (selected) {
      setSelectedIds(paginatedOrders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  // Sorting trigger
  const handleSort = (column: "date" | "total") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  // Row operations
  const handleViewDetails = (order: any) => {
    setActiveSheetOrder(order)
    setIsSheetOpen(true)
  }

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await updateOrderStatus(id, status)
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] })
      const previousOrders = queryClient.getQueryData(["orders"])
      queryClient.setQueriesData({ queryKey: ["orders"] }, (old: any) => {
        if (!old) return old
        if (typeof old === "object" && "data" in old && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((o: any) => o.id === id ? { ...o, status } : o)
          }
        }
        if (Array.isArray(old)) {
          return old.map((o: any) => o.id === id ? { ...o, status } : o)
        }
        return old
      })
      toast.success(`Order #${id.slice(0, 8).toUpperCase()} marked as ${status}`)
      return { previousOrders }
    },
    onError: (err, variables, context) => {
      toast.error("Failed to update status")
      if (context?.previousOrders) {
        queryClient.setQueriesData({ queryKey: ["orders"] }, context.previousOrders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    }
  })

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status })
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteOrder(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] })
      const previousOrders = queryClient.getQueryData(["orders"])
      queryClient.setQueriesData({ queryKey: ["orders"] }, (old: any) => {
        if (!old) return old
        if (typeof old === "object" && "data" in old && Array.isArray(old.data)) {
          return {
            ...old,
            totalCount: Math.max(0, old.totalCount - 1),
            data: old.data.filter((o: any) => o.id !== id)
          }
        }
        if (Array.isArray(old)) {
          return old.filter((o: any) => o.id !== id)
        }
        return old
      })
      setSelectedIds((prev) => prev.filter((x) => x !== id))
      toast.success("Order deleted successfully")
      return { previousOrders }
    },
    onError: (err, id, context) => {
      toast.error("Failed to delete order")
      if (context?.previousOrders) {
        queryClient.setQueriesData({ queryKey: ["orders"] }, context.previousOrders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    }
  })

  const handleDelete = (id: string) => {
    setDeleteTarget({ type: "single", id })
    setDeleteConfirmOpen(true)
  }

  // Bulk actions
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: string }) => {
      await bulkUpdateOrderStatus(ids, status)
    },
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] })
      const previousOrders = queryClient.getQueryData(["orders"])
      queryClient.setQueriesData({ queryKey: ["orders"] }, (old: any) => {
        if (!old) return old
        if (typeof old === "object" && "data" in old && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((o: any) => ids.includes(o.id) ? { ...o, status } : o)
          }
        }
        if (Array.isArray(old)) {
          return old.map((o: any) => ids.includes(o.id) ? { ...o, status } : o)
        }
        return old
      })
      setSelectedIds([])
      toast.success(`Updated status for ${ids.length} orders`)
      return { previousOrders }
    },
    onError: (err, variables, context) => {
      toast.error("Failed to batch update orders")
      if (context?.previousOrders) {
        queryClient.setQueriesData({ queryKey: ["orders"] }, context.previousOrders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    }
  })

  const handleBulkStatusChange = (status: string) => {
    bulkStatusMutation.mutate({ ids: [...selectedIds], status })
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await bulkDeleteOrders(ids)
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] })
      const previousOrders = queryClient.getQueryData(["orders"])
      queryClient.setQueriesData({ queryKey: ["orders"] }, (old: any) => {
        if (!old) return old
        if (typeof old === "object" && "data" in old && Array.isArray(old.data)) {
          return {
            ...old,
            totalCount: Math.max(0, old.totalCount - ids.length),
            data: old.data.filter((o: any) => !ids.includes(o.id))
          }
        }
        if (Array.isArray(old)) {
          return old.filter((o: any) => !ids.includes(o.id))
        }
        return old
      })
      setSelectedIds([])
      toast.success(`Deleted ${ids.length} orders successfully`)
      return { previousOrders }
    },
    onError: (err, variables, context) => {
      toast.error("Failed to batch delete orders")
      if (context?.previousOrders) {
        queryClient.setQueriesData({ queryKey: ["orders"] }, context.previousOrders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    }
  })

  const handleBulkDelete = () => {
    setDeleteTarget({ type: "bulk", ids: [...selectedIds] })
    setDeleteConfirmOpen(true)
  }

  // CSV Exporter
  const handleExportCSV = async () => {
    if (totalCount === 0) return
    toast.loading("Preparing CSV export...")
    try {
      const allData = await getAllOrders({
        search: debouncedSearch,
        status: statusFilter,
        city: cityFilter,
        date: dateFilter,
        product: productFilter,
        page: 1,
        limit: 10000 // Fetch up to 10k orders for export
      })
      const exportOrders = allData.data || []

      const headers = [
        "Order ID",
        "Customer Shop",
        "City",
        "Address",
        "Status",
        "Items Count",
        "Total Weight (kg)",
        "Total Revenue (₹)",
        "Total Cost (₹)",
        "Total Profit (₹)",
        "Created At",
      ]
      const csvRows = [headers.join(",")]
      exportOrders.forEach((o: any) => {
        const items = o.items ?? []
        const totalRevenue = items.reduce((acc: number, i: any) => acc + Number(i.totalRevenue), 0)
        const totalCost = items.reduce((acc: number, i: any) => acc + Number(i.totalCost), 0)
        const totalProfit = items.reduce((acc: number, i: any) => acc + Number(i.totalProfit), 0)
        const weight = Number(o.total_khakhra_kg) || 0

        const row = [
          o.id.toUpperCase(),
          `"${(o.customer?.shop_name || o.shop_name || "").replace(/"/g, '""')}"`,
          `"${(o.city || "").replace(/"/g, '""')}"`,
          `"${(o.address || "").replace(/"/g, '""')}"`,
          o.status || "pending",
          items.length,
          weight.toFixed(2),
          Math.round(totalRevenue),
          Math.round(totalCost),
          Math.round(totalProfit),
          o.created_at ? new Date(o.created_at).toISOString() : "",
        ]
        csvRows.push(row.join(","))
      })

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `jalaram_orders_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.dismiss()
      toast.success("CSV export downloaded successfully")
    } catch (error) {
      toast.dismiss()
      toast.error("Failed to export CSV")
    }
  }

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    cityFilter !== "all" ||
    dateFilter ||
    productFilter !== "all"

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <OrdersHeader
        onExport={handleExportCSV}
        isExportDisabled={totalCount === 0}
      />

      {/* Stats KPI Cards */}
      <OrdersStats stats={initialStats} />

      {/* Quick Insights Strip */}
      <OrdersInsights stats={initialStats} />

      {/* Filters Bar */}
      <OrdersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        cities={citiesList}
        products={productsList}
        onClearFilters={handleClearFilters}
      />

      {/* Desktop vs Mobile layouts */}
      {paginatedOrders.length === 0 ? (
        <OrdersEmptyState
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleClearFilters}
        />
      ) : (
        <div className="space-y-4">
          <div className="hidden md:block">
            <OrdersTable
              orders={paginatedOrders}
              selectedOrderIds={selectedIds}
              onSelectOrder={handleSelectOrder}
              onSelectAllOrders={handleSelectAllOrders}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>
          <div className="md:hidden">
            <OrdersMobileCards
              orders={paginatedOrders}
              selectedOrderIds={selectedIds}
              onSelectOrder={handleSelectOrder}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/80 pt-5 mt-4 text-sm">
              <span className="text-xs text-muted-foreground font-medium">
                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalCount}</span> orders
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
                        currentPage === page ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" : ""
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

      {/* Details drawer sheet */}
      <OrderDetailsSheet
        order={activeSheetOrder}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onStatusChange={handleStatusChange}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "single" 
                ? "This will permanently delete this order and restore its inventory allocation."
                : `This will permanently delete ${deleteTarget?.ids?.length ?? 0} selected orders and restore their inventory allocations.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-in fade-in"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
