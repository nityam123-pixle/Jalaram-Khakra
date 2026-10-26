"use client"

import { useState, useMemo, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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

import { CustomersHeader } from "./customers-header"
import { CustomersStats } from "./customers-stats"
import { CustomersInsights } from "./customers-insights"
import { CustomersFilters } from "./customers-filters"
import { CustomersTable } from "./customers-table"
import { CustomersMobileCards } from "./customers-mobile-cards"
import { CustomersEmptyState } from "./customers-empty-state"
import { CustomerProfileSheet } from "./customer-profile-sheet"
import { CustomerDialog } from "./customer-dialog"
import { deleteCustomer, bulkDeleteCustomers } from "@/app/actions/customers"

interface CustomersDashboardProps {
  initialCustomers: any[]
  initialStats: {
    totalCustomers: number
    activeCustomers: number
    activePct?: number
    repeatCustomers: number
    repeatPct?: number
    topCity?: string
    topCustomer?: string
    avgOrderValue?: number
    customersThisMonth?: number
    newCustomers?: number
  }
}

export function CustomersDashboard({
  initialCustomers,
  initialStats,
}: CustomersDashboardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Reset pointer events on body to prevent Radix UI locking
  useEffect(() => {
    document.body.style.pointerEvents = ""
  }, [])

  // Customers data state
  const [customers, setCustomers] = useState<any[]>(initialCustomers)
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    setCustomers(initialCustomers)
    setStats(initialStats)
  }, [initialCustomers, initialStats])

  // Filters State
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [segmentFilter, setSegmentFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // Snappy search debounce (150ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 150)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Sorting State
  const [sortColumn, setSortColumn] = useState<string>("lifetimeRevenue")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination State (8 items per page to match screenshot exactly: "Showing 1–8 of 150 customers")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal / Sheet States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedEditCustomer, setSelectedEditCustomer] = useState<any | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileCustomer, setProfileCustomer] = useState<any | null>(null)

  // Delete Alert Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "single"; customer: any } | { type: "bulk"; ids: string[] } | null
  >(null)

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Compute unique cities list
  const citiesList = useMemo(() => {
    const set = new Set<string>()
    customers.forEach((c) => {
      const city = c.city?.trim()
      if (city) set.add(city)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [customers])

  // Check if any filter is active
  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== "all" ||
    cityFilter !== "all" ||
    segmentFilter !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate)

  // Reset filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setStatusFilter("all")
    setCityFilter("all")
    setSegmentFilter("all")
    setFromDate("")
    setToDate("")
    setCurrentPage(1)
  }

  // Filter and Sort Customers
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers]

    // 1. Text Search (name, city, phone, ID)
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      result = result.filter((c) => {
        const nameMatch = c.shop_name?.toLowerCase().includes(q)
        const cityMatch = c.city?.toLowerCase().includes(q)
        const phoneMatch = c.phone?.toLowerCase().includes(q)
        const idMatch =
          c.id?.toLowerCase().includes(q) ||
          `#c${c.id?.slice(0, 8)}`.toLowerCase().includes(q)
        return nameMatch || cityMatch || phoneMatch || idMatch
      })
    }

    // 2. Status Filter
    if (statusFilter !== "all") {
      result = result.filter(
        (c) => c.status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    // 3. City Filter
    if (cityFilter !== "all") {
      result = result.filter(
        (c) => c.city?.trim().toLowerCase() === cityFilter.trim().toLowerCase()
      )
    }

    // 4. Customer Segment Filter
    if (segmentFilter !== "all") {
      if (segmentFilter === "repeat") {
        result = result.filter((c) => c.totalOrders > 1)
      } else if (segmentFilter === "single") {
        result = result.filter((c) => c.totalOrders === 1)
      } else if (segmentFilter === "high_value") {
        result = result.filter((c) => c.lifetimeRevenue >= 50000)
      } else if (segmentFilter === "zero_order") {
        result = result.filter((c) => c.totalOrders === 0)
      }
    }

    // 5. From Date Filter (based on last order or created date)
    if (fromDate) {
      const fromTime = new Date(fromDate).getTime()
      result = result.filter((c) => {
        const orderTime = c.lastOrderDate ? new Date(c.lastOrderDate).getTime() : 0
        const createTime = c.createdAt ? new Date(c.createdAt).getTime() : 0
        return orderTime >= fromTime || createTime >= fromTime
      })
    }

    // 6. To Date Filter
    if (toDate) {
      const toTime = new Date(`${toDate}T23:59:59.999Z`).getTime()
      result = result.filter((c) => {
        const orderTime = c.lastOrderDate ? new Date(c.lastOrderDate).getTime() : 0
        const createTime = c.createdAt ? new Date(c.createdAt).getTime() : 0
        return (orderTime > 0 && orderTime <= toTime) || (createTime > 0 && createTime <= toTime)
      })
    }

    // 7. Sorting
    result.sort((a, b) => {
      let aVal = a[sortColumn]
      let bVal = b[sortColumn]

      if (sortColumn === "lifetimeRevenue" || sortColumn === "totalOrders") {
        aVal = Number(aVal || 0)
        bVal = Number(bVal || 0)
      } else if (sortColumn === "lastOrderDate") {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      } else if (sortColumn === "shop_name") {
        aVal = String(aVal || "").toLowerCase()
        bVal = String(bVal || "").toLowerCase()
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [
    customers,
    debouncedSearch,
    statusFilter,
    cityFilter,
    segmentFilter,
    fromDate,
    toDate,
    sortColumn,
    sortDirection,
  ])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, cityFilter, segmentFilter, fromDate, toDate])

  // Total and Paginated Slice
  const totalCount = filteredAndSortedCustomers.length
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCustomers.slice(start, start + itemsPerPage)
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage])

  // Sort Handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  // Row Selection Handlers
  const handleSelectCustomer = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleSelectAllCustomers = (selected: boolean) => {
    if (selected) {
      const pageIds = paginatedCustomers.map((c) => c.id)
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])))
    } else {
      const pageIds = new Set(paginatedCustomers.map((c) => c.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
    }
  }

  // Actions Handlers
  const handleViewProfile = (customer: any) => {
    setProfileCustomer(customer)
    setIsProfileOpen(true)
  }

  const handleEditCustomer = (customer: any) => {
    setSelectedEditCustomer(customer)
    setIsEditOpen(true)
  }

  const handleDeletePrompt = (customer: any) => {
    setDeleteTarget({ type: "single", customer })
    setDeleteConfirmOpen(true)
  }

  const handleBulkDeletePrompt = () => {
    if (selectedIds.length === 0) return
    setDeleteTarget({ type: "bulk", ids: selectedIds })
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteConfirmOpen(false)
    setDeleteTarget(null)

    try {
      if (target.type === "single") {
        await deleteCustomer(target.customer.id)
        toast.success(`Customer "${target.customer.shop_name}" deleted`)
        setCustomers((prev) => prev.filter((c) => c.id !== target.customer.id))
        setSelectedIds((prev) => prev.filter((id) => id !== target.customer.id))
      } else {
        await bulkDeleteCustomers(target.ids)
        toast.success(`${target.ids.length} customers deleted`)
        const deletedSet = new Set(target.ids)
        setCustomers((prev) => prev.filter((c) => !deletedSet.has(c.id)))
        setSelectedIds([])
      }
      startTransition(() => {
        router.refresh()
      })
    } catch {
      toast.error("Failed to delete customer(s)")
    }
  }

  // Refresh Handler
  const handleRefresh = () => {
    setIsRefreshing(true)
    startTransition(() => {
      router.refresh()
    })
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Customers list refreshed")
    }, 600)
  }

  // CSV Export Handler
  const handleExportCSV = (recordsToExport = filteredAndSortedCustomers) => {
    try {
      if (recordsToExport.length === 0) {
        toast.error("No customers to export")
        return
      }

      const headers = [
        "Customer ID",
        "Shop Name",
        "City",
        "Phone",
        "Address",
        "Total Orders",
        "Lifetime Revenue",
        "Status",
        "Last Order Date",
        "Customer Since",
      ]

      const csvRows = [headers.join(",")]

      recordsToExport.forEach((c) => {
        const row = [
          `"${c.id}"`,
          `"${(c.shop_name || "").replace(/"/g, '""')}"`,
          `"${(c.city || "").replace(/"/g, '""')}"`,
          `"${(c.phone || "").replace(/"/g, '""')}"`,
          `"${(c.address || "").replace(/"/g, '""')}"`,
          c.totalOrders,
          Math.round(c.lifetimeRevenue || 0),
          `"${c.status || "Active"}"`,
          c.lastOrderDate ? `"${new Date(c.lastOrderDate).toISOString().slice(0, 10)}"` : '""',
          c.createdAt ? `"${new Date(c.createdAt).toISOString().slice(0, 10)}"` : '""',
        ]
        csvRows.push(row.join(","))
      })

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute(
        "download",
        `jalaram_customers_${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("CSV export downloaded successfully")
    } catch {
      toast.error("Failed to export CSV")
    }
  }

  const handleBulkExport = () => {
    const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id))
    handleExportCSV(selectedCustomers)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <CustomersHeader
        onExport={() => handleExportCSV()}
        isExportDisabled={totalCount === 0}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onAddCustomer={() => setIsAddOpen(true)}
      />

      {/* Row 1: Primary Summary Cards */}
      <CustomersStats stats={stats} />

      {/* Row 2: Secondary Metric Cards (Top City, Top Customer, Avg Order Value, etc.) */}
      <CustomersInsights stats={stats} />

      {/* Single Bordered Filter Container */}
      <CustomersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        segmentFilter={segmentFilter}
        setSegmentFilter={setSegmentFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        cities={citiesList}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table vs Empty State vs Mobile Cards */}
      {paginatedCustomers.length === 0 ? (
        <CustomersEmptyState
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleClearFilters}
          onAddCustomer={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <CustomersTable
              customers={paginatedCustomers}
              selectedCustomerIds={selectedIds}
              onSelectCustomer={handleSelectCustomer}
              onSelectAllCustomers={handleSelectAllCustomers}
              onViewProfile={handleViewProfile}
              onEdit={handleEditCustomer}
              onDelete={handleDeletePrompt}
              onBulkDelete={handleBulkDeletePrompt}
              onBulkExport={handleBulkExport}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <CustomersMobileCards
              customers={paginatedCustomers}
              selectedCustomerIds={selectedIds}
              onSelectCustomer={handleSelectCustomer}
              onViewProfile={handleViewProfile}
              onEdit={handleEditCustomer}
              onDelete={handleDeletePrompt}
            />
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/80 pt-5 mt-4 text-sm gap-4">
              <span className="text-xs text-muted-foreground font-medium">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                –
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{totalCount}</span>{" "}
                customers
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="text-xs h-8 px-2.5 rounded-lg"
                  aria-label="Previous Page"
                >
                  &lt;
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1
                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (page === 2 && currentPage > 3) {
                      return (
                        <span key="ellipsis-1" className="text-muted-foreground px-1 text-xs select-none">
                          ...
                        </span>
                      )
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return (
                        <span key="ellipsis-2" className="text-muted-foreground px-1 text-xs select-none">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  const isActive = currentPage === page
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`text-xs h-8 w-8 p-0 rounded-lg font-medium ${
                        isActive
                          ? "bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black border-transparent"
                          : "border-border hover:bg-muted text-foreground"
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
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="text-xs h-8 px-2.5 rounded-lg"
                  aria-label="Next Page"
                >
                  &gt;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Profile Sheet */}
      <CustomerProfileSheet
        customer={profileCustomer}
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />

      {/* Add / Edit Customer Dialog */}
      <CustomerDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        customer={null}
        onSuccess={() => {
          startTransition(() => {
            router.refresh()
          })
        }}
      />

      <CustomerDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        customer={selectedEditCustomer}
        onSuccess={() => {
          startTransition(() => {
            router.refresh()
          })
        }}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "single"
                ? `This will remove "${deleteTarget.customer?.shop_name}" from active customers. Historical order records will remain preserved.`
                : `This will remove ${deleteTarget?.ids?.length ?? 0} selected customers from active customers. Historical order records will remain preserved.`}
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
