"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, RotateCw, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

export type DateFilterType = "all" | "today" | "7d" | "30d" | "90d" | "custom"

interface DashboardHeaderProps {
  dateFilter: DateFilterType
  setDateFilter: (filter: DateFilterType) => void
  startDate: string
  setStartDate: (d: string) => void
  endDate: string
  setJaneDate: (d: string) => void // Actually endDate
  onExport: () => void
  isExportDisabled: boolean
}

export function DashboardHeader({
  dateFilter,
  setDateFilter,
  startDate,
  setStartDate,
  endDate,
  setJaneDate,
  onExport,
  isExportDisabled,
}: DashboardHeaderProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  const filters: { value: DateFilterType; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "custom", label: "Custom Range" },
  ]

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor sales, revenue, customers and business performance.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Date Filters Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/60">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={dateFilter === f.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDateFilter(f.value)}
              className={`text-xs h-7 px-3 rounded-md ${
                dateFilter === f.value
                  ? "bg-background shadow-sm font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-3 duration-200">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-[130px] text-xs bg-background border-border scheme-dark"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setJaneDate(e.target.value)}
              className="h-8 w-[130px] text-xs bg-background border-border scheme-dark"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExportDisabled}
            className="gap-2 h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2 h-8 text-xs"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
