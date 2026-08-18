"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, SlidersHorizontal, Building2 } from "lucide-react"

interface POFiltersProps {
  searchTerm: string
  setSearchTerm: (val: string) => void
  statusFilter: string
  setStatusFilter: (val: string) => void
  supplierFilter: string
  setSupplierFilter: (val: string) => void
  suppliers: Array<{ id: string; name: string }>
  statusCounts: Record<string, number>
  onClearFilters: () => void
}

export function POFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  supplierFilter,
  setSupplierFilter,
  suppliers,
  statusCounts,
  onClearFilters,
}: POFiltersProps) {
  const hasActiveFilters = Boolean(
    searchTerm || statusFilter !== "ALL" || supplierFilter !== "ALL"
  )

  const statusOptions = [
    { value: "ALL", label: "All POs", count: statusCounts.ALL || 0 },
    { value: "DRAFT", label: "Draft", count: statusCounts.DRAFT || 0 },
    { value: "ORDERED", label: "Ordered", count: statusCounts.ORDERED || 0 },
    { value: "IN_TRANSIT", label: "In Transit", count: statusCounts.IN_TRANSIT || 0 },
    { value: "PARTIALLY_RECEIVED", label: "Partial", count: statusCounts.PARTIALLY_RECEIVED || 0 },
    { value: "RECEIVED", label: "Received", count: statusCounts.RECEIVED || 0 },
    { value: "CANCELLED", label: "Cancelled", count: statusCounts.CANCELLED || 0 },
  ]

  return (
    <div className="space-y-3">
      {/* Primary search and supplier selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO #, supplier name, transport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 bg-card border-border h-9 rounded-lg text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-card border-border rounded-lg text-xs font-medium">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Suppliers</SelectItem>
              {suppliers.map((sup) => (
                <SelectItem key={sup.id} value={sup.id}>
                  {sup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
