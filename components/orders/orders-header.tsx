"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, RotateCw, Download } from "lucide-react"
import { useRouter } from "next/navigation"

interface OrdersHeaderProps {
  onExport: () => void
  isExportDisabled: boolean
}

export function OrdersHeader({ onExport, isExportDisabled }: OrdersHeaderProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Create, manage and track customer orders across all cities.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExportDisabled}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>

        <Button size="sm" className="gap-2" asChild>
          <a href="/orders/new">
            <Plus className="h-4 w-4" />
            <span>Create Order</span>
          </a>
        </Button>
      </div>
    </div>
  )
}
