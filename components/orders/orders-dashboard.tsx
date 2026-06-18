"use client"

import { useState, useMemo, useEffect } from "react"
import { OrdersHeader } from "./orders-header"
import { OrdersStats } from "./orders-stats"
import { OrdersInsights } from "./orders-insights"
import { OrdersFilters } from "./orders-filters"
import { OrdersTable } from "./orders-table"
import { OrdersMobileCards } from "./orders-mobile-cards"
import { OrderDetailsSheet } from "./order-details-sheet"
import { OrdersEmptyState } from "./orders-empty-state"
import { toast } from "sonner"
import { updateOrderStatus, deleteOrder, bulkUpdateOrderStatus, bulkDeleteOrders } from "@/app/actions/order"
import { Button } from "../ui/button"

interface OrdersDashboardProps {
  initialOrders: any[]
  catalog: any[]
}

export function OrdersDashboard({ initialOrders, catalog }: OrdersDashboardProps) {
  // Main local state for orders
  const [orders, setOrders] = useState(initialOrders)

  // Sync state if initialOrders updates from server router.refresh()
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // Filters State
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [productFilter, setProductFilter] = useState("all")

  // Checkbox Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Details sheet state
  const [activeSheetOrder, setActiveSheetOrder] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Sorting State
  const [sortColumn, setSortColumn] = useState<"date" | "total" | null>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  // Get unique cities dynamically
  const citiesList = useMemo(() => {
    const set = new Set<string>()
    orders.forEach((o) => {
      if (o.city) {
        set.add(o.city.trim().toLowerCase())
      }
    })
    return Array.from(set).sort()
  }, [orders])

  // Handle clearing filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCityFilter("all")
    setDateFilter("")
    setProductFilter("all")
  }

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search search term
      const shopName = (order.customer?.shop_name || order.shop_name || "").toLowerCase()
      const city = (order.city || "").toLowerCase()
      const shortId = order.id.slice(0, 8).toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        shopName.includes(searchLower) ||
        city.includes(searchLower) ||
        shortId.includes(searchLower)

      // 2. Status filter
      const matchesStatus =
        statusFilter === "all" ||
        order.status?.toLowerCase() === statusFilter.toLowerCase()

      // 3. City filter
      const matchesCity =
        cityFilter === "all" ||
        order.city?.toLowerCase() === cityFilter.toLowerCase()

      // 4. Date filter
      let matchesDate = true
      if (dateFilter) {
        const orderDate = new Date(order.created_at).toISOString().split("T")[0]
        matchesDate = orderDate === dateFilter
      }

      // 5. Product filter
      let matchesProduct = true
      if (productFilter !== "all") {
        matchesProduct = (order.items ?? []).some(
          (item: any) => item.variantId === productFilter
        )
      }

      return matchesSearch && matchesStatus && matchesCity && matchesDate && matchesProduct
    })
  }, [orders, searchTerm, statusFilter, cityFilter, dateFilter, productFilter])

  // Sort Orders
  const sortedOrders = useMemo(() => {
    const items = [...filteredOrders]
    if (sortColumn === "total") {
      items.sort((a, b) => {
        const aRevenue = (a.items ?? []).reduce((acc: number, i: any) => acc + Number(i.totalRevenue), 0)
        const bRevenue = (b.items ?? []).reduce((acc: number, i: any) => acc + Number(i.totalRevenue), 0)
        return sortDirection === "asc" ? aRevenue - bRevenue : bRevenue - aRevenue
      })
    } else if (sortColumn === "date") {
      items.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime
      })
    }
    return items
  }, [filteredOrders, sortColumn, sortDirection])

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, cityFilter, dateFilter, productFilter])

  // Pagination bounds
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedOrders.slice(start, start + itemsPerPage)
  }, [sortedOrders, currentPage])

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

  const handleStatusChange = async (id: string, status: string) => {
    const previousOrders = [...orders]
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    )
    try {
      await updateOrderStatus(id, status)
      toast.success(`Order #${id.slice(0, 8).toUpperCase()} marked as ${status}`)
    } catch (e) {
      setOrders(previousOrders)
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return
    const previousOrders = [...orders]
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    try {
      await deleteOrder(id)
      toast.success("Order deleted successfully")
    } catch (e) {
      setOrders(previousOrders)
      toast.error("Failed to delete order")
    }
  }

  // Bulk actions
  const handleBulkStatusChange = async (status: string) => {
    const previousOrders = [...orders]
    const idsToUpdate = [...selectedIds]
    setOrders((prev) =>
      prev.map((o) => (idsToUpdate.includes(o.id) ? { ...o, status } : o))
    )
    setSelectedIds([])
    try {
      await bulkUpdateOrderStatus(idsToUpdate, status)
      toast.success(`Updated status for ${idsToUpdate.length} orders`)
    } catch (e) {
      setOrders(previousOrders)
      toast.error("Failed to batch update orders")
    }
  }

  const handleBulkDelete = async () => {
    const idsToDelete = [...selectedIds]
    if (!confirm(`Are you sure you want to delete ${idsToDelete.length} orders?`)) return
    const previousOrders = [...orders]
    setOrders((prev) => prev.filter((o) => !idsToDelete.includes(o.id)))
    setSelectedIds([])
    try {
      await bulkDeleteOrders(idsToDelete)
      toast.success(`Deleted ${idsToDelete.length} orders successfully`)
    } catch (e) {
      setOrders(previousOrders)
      toast.error("Failed to batch delete orders")
    }
  }

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return
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
    filteredOrders.forEach((o) => {
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
    toast.success("CSV export downloaded successfully")
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
        isExportDisabled={filteredOrders.length === 0}
      />

      {/* Stats KPI Cards */}
      <OrdersStats orders={filteredOrders} />

      {/* Quick Insights Strip */}
      <OrdersInsights orders={filteredOrders} />

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
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filteredOrders.length}</span> orders
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
    </div>
  )
}
