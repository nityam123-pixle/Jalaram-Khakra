"use client"

import { useState, useMemo } from "react"
import { DashboardHeader, DateFilterType } from "./dashboard-header"
import { DashboardKPIs } from "./dashboard-kpis"
import { BusinessHealth } from "./business-health"
import { ExecutiveProfitCenter } from "./executive-profit-center"
import { RevenueCommandCenter } from "./revenue-command-center"
import { TopPerformers } from "./top-performers"
import { RecentOrders } from "./recent-orders"
import { ActivityFeed } from "./activity-feed"
import { ProductPerformance } from "./product-performance"
import { CityPerformance } from "./city-performance"
import { QuickActions } from "./quick-actions"
import { OrderDetailsSheet } from "@/components/orders/order-details-sheet"
import { updateOrderStatus } from "@/app/actions/order"
import { toast } from "sonner"

interface DashboardCoordinatorProps {
  initialOrders: any[]
  catalog: any[]
  customers: any[]
}

export function DashboardCoordinator({
  initialOrders,
  catalog,
  customers,
}: DashboardCoordinatorProps) {
  // Main Date Range states
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all")
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })

  // Category Focus state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null)

  // Details Sheet states
  const [activeSheetOrder, setActiveSheetOrder] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // 1. Resolve date boundaries and filter orders into current vs prior periods
  const { currentPeriodOrders, priorPeriodOrders } = useMemo(() => {
    const now = new Date()
    let startLimit = new Date()
    let priorLimit = new Date()

    const getStartOfToday = () => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }

    if (dateFilter === "all") {
      startLimit = new Date(0)
      priorLimit = new Date(0)
    } else if (dateFilter === "today") {
      startLimit = getStartOfToday()
      priorLimit = new Date(startLimit.getTime() - 24 * 60 * 60 * 1000)
    } else if (dateFilter === "7d") {
      startLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      priorLimit = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    } else if (dateFilter === "30d") {
      startLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      priorLimit = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    } else if (dateFilter === "90d") {
      startLimit = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      priorLimit = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    } else if (dateFilter === "custom") {
      startLimit = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const endVal = endDate ? new Date(endDate) : now
      const duration = endVal.getTime() - startLimit.getTime()
      priorLimit = new Date(startLimit.getTime() - duration)
    }

    const startLimitTime = startLimit.getTime()
    const endLimitTime = dateFilter === "custom" && endDate ? new Date(endDate).getTime() : now.getTime()
    const priorLimitTime = priorLimit.getTime()

    const current = initialOrders.filter((o) => {
      if (!o.created_at) return false
      const t = new Date(o.created_at).getTime()
      return t >= startLimitTime && t <= endLimitTime
    })

    const prior = initialOrders.filter((o) => {
      if (!o.created_at) return false
      const t = new Date(o.created_at).getTime()
      return t >= priorLimitTime && t < startLimitTime
    })

    return {
      currentPeriodOrders: current,
      priorPeriodOrders: prior,
    }
  }, [initialOrders, dateFilter, startDate, endDate])

  // 2. Further filter current & prior orders if a category focus is selected
  const { currentFilteredOrders, priorFilteredOrders } = useMemo(() => {
    if (!activeCategoryFilter) {
      return {
        currentFilteredOrders: currentPeriodOrders,
        priorFilteredOrders: priorPeriodOrders,
      }
    }

    const filterFn = (o: any) => {
      const items = o.items ?? []
      const filteredItems = items.filter((i: any) => i.categoryName === activeCategoryFilter)
      if (filteredItems.length === 0) return null
      return {
        ...o,
        items: filteredItems,
      }
    }

    return {
      currentFilteredOrders: currentPeriodOrders.map(filterFn).filter(Boolean) as any[],
      priorFilteredOrders: priorPeriodOrders.map(filterFn).filter(Boolean) as any[],
    }
  }, [currentPeriodOrders, priorPeriodOrders, activeCategoryFilter])

  // Calculate prior customers count (active prior to start of current range)
  const priorCustomersCount = useMemo(() => {
    const now = new Date()
    let startLimit = new Date()
    if (dateFilter === "today") {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      startLimit = d
    } else if (dateFilter === "7d") {
      startLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (dateFilter === "30d") {
      startLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (dateFilter === "90d") {
      startLimit = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else if (dateFilter === "custom" && startDate) {
      startLimit = new Date(startDate)
    }
    const limit = startLimit.getTime()
    return customers.filter((c) => c.created_at && new Date(c.created_at).getTime() < limit).length
  }, [customers, dateFilter, startDate])

  // Exporter for CSV download of active selection
  const handleExportCSV = () => {
    if (currentFilteredOrders.length === 0) return
    const headers = [
      "Order ID",
      "Customer Shop",
      "City",
      "Address",
      "Status",
      "Items Count",
      "Total Revenue (₹)",
      "Created At",
    ]
    const csvRows = [headers.join(",")]
    currentFilteredOrders.forEach((o) => {
      const items = o.items ?? []
      const totalRevenue = items.reduce((acc: number, i: any) => acc + Number(i.totalRevenue), 0)
      const row = [
        o.id.toUpperCase(),
        `"${(o.customer?.shop_name || o.shop_name || "").replace(/"/g, '""')}"`,
        `"${(o.city || "").replace(/"/g, '""')}"`,
        `"${(o.address || "").replace(/"/g, '""')}"`,
        o.status || "pending",
        items.length,
        Math.round(totalRevenue),
        o.created_at ? new Date(o.created_at).toISOString() : "",
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `dashboard_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Dashboard CSV export completed")
  }

  // Row operations inside recent orders
  const handleViewDetails = (order: any) => {
    setActiveSheetOrder(order)
    setIsSheetOpen(true)
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status)
      toast.success(`Order status updated to ${status}`)
    } catch (e) {
      toast.error("Failed to update order status")
    }
  }

  const handleDelete = () => {
    toast.info("Order deletion is locked on the Executive Dashboard. Access All Orders list to execute removals.")
  }

  const categoriesList = useMemo(() => {
    return catalog.map((c: any) => c.name)
  }, [catalog])

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header with date filters */}
      <DashboardHeader
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setJaneDate={setEndDate}
        onExport={handleExportCSV}
        isExportDisabled={currentFilteredOrders.length === 0}
      />

      {/* KPI Cards */}
      <DashboardKPIs
        currentOrders={currentFilteredOrders}
        priorOrders={priorFilteredOrders}
        totalCustomers={customers.length}
        priorCustomersCount={priorCustomersCount}
      />

      {/* Dynamic Category focus selectors */}
      <ProductPerformance
        currentOrders={currentPeriodOrders}
        priorOrders={priorPeriodOrders}
        activeCategory={activeCategoryFilter}
        onSelectCategory={setActiveCategoryFilter}
        categoriesList={categoriesList}
      />

      {/* Executive Profit center (DO NOT REMOVE CATEGORY profit breakdown) */}
      <ExecutiveProfitCenter
        currentOrders={currentFilteredOrders}
        priorOrders={priorFilteredOrders}
        customers={customers}
      />

      {/* Business Vitals circular indicator & insights */}
      <BusinessHealth
        currentOrders={currentFilteredOrders}
        priorOrders={priorFilteredOrders}
        customers={customers}
        catalog={catalog}
      />

      {/* Revenue timeline Area Chart */}
      <RevenueCommandCenter orders={currentFilteredOrders} />

      {/* Performers lists (Cities & Products side by side) */}
      <TopPerformers
        currentOrders={currentFilteredOrders}
        priorOrders={priorFilteredOrders}
      />

      {/* Geographical leaderboards progress lists */}
      <CityPerformance
        currentOrders={currentFilteredOrders}
        priorOrders={priorFilteredOrders}
      />

      {/* Operations logs (Recent Orders & Live timelines) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RecentOrders
            orders={currentFilteredOrders.slice(0, 6)}
            onViewDetails={handleViewDetails}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </div>
        <div className="lg:col-span-5">
          <ActivityFeed
            orders={currentFilteredOrders}
            customers={customers}
            catalog={catalog}
          />
        </div>
      </div>

      {/* Operational workflows shortcuts */}
      <QuickActions onExport={handleExportCSV} />

      {/* Unified details sheet drawer */}
      <OrderDetailsSheet
        order={activeSheetOrder}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
