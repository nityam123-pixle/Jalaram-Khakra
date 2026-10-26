"use client"

import { Button } from "@/components/ui/button"
import { Plus, RotateCw, Download } from "lucide-react"

interface CustomersHeaderProps {
  onExport: () => void
  isExportDisabled?: boolean
  onRefresh: () => void
  isRefreshing?: boolean
  onAddCustomer: () => void
}

export function CustomersHeader({
  onExport,
  isExportDisabled = false,
  onRefresh,
  isRefreshing = false,
  onAddCustomer,
}: CustomersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Manage your customer relationships and view their order history.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExportDisabled}
          className="gap-2 h-9 rounded-lg"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2 h-9 rounded-lg"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>

        <Button
          size="sm"
          onClick={onAddCustomer}
          className="gap-2 h-9 rounded-lg bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </Button>
      </div>
    </div>
  )
}
