"use client"

import { useState, useTransition, useEffect, useMemo, useRef } from "react"
import { InvoiceHeader, DATE_PRESETS, DateRangePreset } from "./invoice-header"
import { InvoiceStats, InvoiceStatsData } from "./invoice-stats"
import { InvoiceToolbar } from "./invoice-toolbar"
import { InvoiceTable, InvoiceItem } from "./invoice-table"
import { InvoiceDetailPanel } from "./invoice-detail-panel"
import { CreateInvoiceDialog } from "./create-invoice-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  getInvoices,
  getInvoiceStats,
  updateInvoiceStatus,
  deleteInvoice,
} from "@/app/actions/invoice"
import { toast } from "sonner"

interface InvoicesCommandCenterProps {
  initialInvoices: {
    data: any[]
    totalCount: number
  }
  initialStats: InvoiceStatsData
  customersList: Array<{ id: string; shop_name: string; city: string }>
}

export function InvoicesCommandCenter({
  initialInvoices,
  initialStats,
  customersList,
}: InvoicesCommandCenterProps) {
  // State
  const [invoicesData, setInvoicesData] = useState(initialInvoices)
  const [stats, setStats] = useState(initialStats)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(
    initialInvoices.data[0] || null
  )

  // Filters State
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(DATE_PRESETS[0]) // Oct 2026 default
  const [statusTab, setStatusTab] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")
  const [currentPage, setCurrentPage] = useState<number>(1)

  // UI States
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isFirstMount = useRef(true)

  // Debounce search input (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 200)
    return () => clearTimeout(timer)
  }, [search])

  // Effective status combines tab and dropdown
  const effectiveStatus = useMemo(() => {
    if (statusTab !== "all") return statusTab
    return selectedStatus
  }, [statusTab, selectedStatus])

  // Data loader
  const fetchData = async (
    page = currentPage,
    currentSearch = debouncedSearch,
    status = effectiveStatus,
    customer = selectedCustomer,
    preset = selectedPreset,
    sort = sortDirection
  ) => {
    try {
      const [newInvoices, newStats] = await Promise.all([
        getInvoices({
          page,
          limit: 10,
          search: currentSearch || undefined,
          status: status !== "all" ? status : undefined,
          customerId: customer !== "all" ? customer : undefined,
          startDate: preset.startDate,
          endDate: preset.endDate,
          sortDirection: sort,
        }),
        getInvoiceStats({
          startDate: preset.startDate,
          endDate: preset.endDate,
          customerId: customer !== "all" ? customer : undefined,
        }),
      ])

      setInvoicesData(newInvoices)
      setStats(newStats)

      // Ensure a selected invoice exists
      if (newInvoices.data.length > 0) {
        setSelectedInvoice((prev) => {
          if (!prev) return newInvoices.data[0]
          const found = newInvoices.data.find((inv: any) => inv.id === prev.id)
          return found || newInvoices.data[0]
        })
      } else {
        setSelectedInvoice(null)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch invoices")
    }
  }

  // Trigger data fetch when filters change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    startTransition(() => {
      fetchData(currentPage, debouncedSearch, effectiveStatus, selectedCustomer, selectedPreset, sortDirection)
    })
  }, [currentPage, debouncedSearch, effectiveStatus, selectedCustomer, selectedPreset, sortDirection])

  // Handlers
  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset)
    setCurrentPage(1)
  }

  const handleStatusTabChange = (tab: string) => {
    setStatusTab(tab)
    setSelectedStatus(tab)
    setCurrentPage(1)
  }

  const handleStatusSelectChange = (status: string) => {
    setSelectedStatus(status)
    setStatusTab(status === "all" ? "all" : status)
    setCurrentPage(1)
  }

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId)
    setCurrentPage(1)
  }

  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatusTab("all")
    setSelectedStatus("all")
    setSelectedCustomer("all")
    setSelectedPreset(DATE_PRESETS[0])
    setCurrentPage(1)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Invoices refreshed")
    }, 400)
  }

  const handleSelectInvoice = (invoice: InvoiceItem) => {
    setSelectedInvoice(invoice)
    // On mobile viewports, open detail sheet
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDetailOpen(true)
    }
  }

  const handleStatusChange = async (
    id: string,
    newStatus: "PAID" | "PENDING" | "PARTIAL" | "CANCELLED"
  ) => {
    try {
      await updateInvoiceStatus(id, newStatus)
      toast.success(`Invoice status updated to ${newStatus}`)
      fetchData()
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice(id)
      toast.success("Invoice deleted successfully")
      fetchData()
    } catch {
      toast.error("Failed to delete invoice")
    }
  }

  const handleInvoiceCreated = (newInvoice: any) => {
    fetchData()
    setSelectedInvoice(newInvoice)
  }

  // Export CSV
  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ["Invoice No", "Date", "Customer", "City", "Amount", "Status"]
      const rows = invoicesData.data.map((inv: any) => [
        `"${inv.invoiceNumber}"`,
        `"${new Date(inv.invoiceDate).toLocaleDateString("en-IN")}"`,
        `"${(inv.customer?.shop_name || "").replace(/"/g, '""')}"`,
        `"${(inv.customer?.city || "").replace(/"/g, '""')}"`,
        Number(inv.total || 0),
        `"${inv.paymentStatus}"`,
      ])

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Exported CSV successfully")
    } catch {
      toast.error("Failed to export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const hasActiveFilters =
    Boolean(search) ||
    statusTab !== "all" ||
    selectedStatus !== "all" ||
    selectedCustomer !== "all" ||
    selectedPreset.id !== DATE_PRESETS[0].id

  const periodLabel = useMemo(() => {
    if (selectedPreset.id === "all_time") return "All Time"
    if (selectedPreset.id === "oct_2026") return "This Month"
    if (selectedPreset.id === "sep_2026") return "Sep 2026"
    if (selectedPreset.id === "year_2026") return "Year 2026"
    if (selectedPreset.id === "last_30_days") return "Last 30 Days"
    return selectedPreset.label
  }, [selectedPreset])

  const statusCounts = {
    all: stats.totalInvoices,
    pending: stats.pendingInvoices,
    paid: stats.paidInvoices,
    cancelled: stats.cancelledInvoices || 0,
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header */}
      <InvoiceHeader
        selectedPreset={selectedPreset}
        onPresetChange={handlePresetChange}
        onExport={handleExportCSV}
        onRefresh={handleRefresh}
        onCreateInvoice={() => setIsCreateOpen(true)}
        isRefreshing={isRefreshing}
        isExporting={isExporting}
      />

      {/* 2. 4 KPI Financial Overview Cards */}
      <InvoiceStats stats={stats} periodLabel={periodLabel} />

      {/* 3. Filter and Search Toolbar */}
      <InvoiceToolbar
        statusTab={statusTab}
        onStatusTabChange={handleStatusTabChange}
        statusCounts={statusCounts}
        search={search}
        onSearchChange={setSearch}
        selectedCustomer={selectedCustomer}
        onCustomerChange={handleCustomerChange}
        customers={customersList}
        selectedStatus={selectedStatus}
        onStatusSelectChange={handleStatusSelectChange}
        sortDirection={sortDirection}
        onSortDirectionChange={(dir) => {
          setSortDirection(dir)
          setCurrentPage(1)
        }}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Primary Split-View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Panel: Invoices Table (~58% on wide desktop) */}
        <div className="lg:col-span-7 xl:col-span-7 w-full">
          <InvoiceTable
            invoices={invoicesData.data}
            totalCount={invoicesData.totalCount}
            currentPage={currentPage}
            pageSize={10}
            onPageChange={setCurrentPage}
            selectedInvoice={selectedInvoice}
            onSelectInvoice={handleSelectInvoice}
            sortDirection={sortDirection}
            onToggleSort={handleToggleSort}
            onStatusChange={handleStatusChange}
            onDeleteInvoice={handleDeleteInvoice}
            onResetFilters={handleClearFilters}
            isLoading={isPending}
          />
        </div>

        {/* Right Panel: Live Invoice Details (~42% on wide desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-20">
          <InvoiceDetailPanel
            invoice={selectedInvoice}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {/* Mobile / Tablet Detail Sheet */}
      <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-4 overflow-y-auto bg-card border-border">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-base font-bold font-mono">
              Invoice Details
            </SheetTitle>
          </SheetHeader>
          <InvoiceDetailPanel
            invoice={selectedInvoice}
            onStatusChange={handleStatusChange}
          />
        </SheetContent>
      </Sheet>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  )
}
