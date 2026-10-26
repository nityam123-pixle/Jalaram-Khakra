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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react"

interface CustomerOption {
  id: string
  shop_name: string
  city: string
}

interface InvoiceToolbarProps {
  statusTab: string
  onStatusTabChange: (tab: string) => void
  statusCounts: {
    all: number
    pending: number
    paid: number
    cancelled: number
  }
  search: string
  onSearchChange: (search: string) => void
  selectedCustomer: string
  onCustomerChange: (customerId: string) => void
  customers: CustomerOption[]
  selectedStatus: string
  onStatusSelectChange: (status: string) => void
  sortDirection: "desc" | "asc"
  onSortDirectionChange: (dir: "desc" | "asc") => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function InvoiceToolbar({
  statusTab,
  onStatusTabChange,
  statusCounts,
  search,
  onSearchChange,
  selectedCustomer,
  onCustomerChange,
  customers,
  selectedStatus,
  onStatusSelectChange,
  sortDirection,
  onSortDirectionChange,
  onClearFilters,
  hasActiveFilters,
}: InvoiceToolbarProps) {
  const tabs = [
    { id: "all", label: "All Invoices", count: statusCounts.all },
    { id: "PENDING", label: "Pending", count: statusCounts.pending },
    { id: "PAID", label: "Paid", count: statusCounts.paid },
    { id: "CANCELLED", label: "Cancelled", count: statusCounts.cancelled },
  ]

  return (
    <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
      {/* Left side: Segmented status tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-zinc-900/80 border border-border/80 rounded-xl overflow-x-auto shrink-0 max-w-full">
        {tabs.map((tab) => {
          const isActive = statusTab.toLowerCase() === tab.id.toLowerCase()
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-background text-foreground font-semibold shadow-xs border border-border/80 dark:bg-zinc-800 dark:border-zinc-700/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive
                    ? "bg-muted text-foreground dark:bg-zinc-700/80"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Right side: Search and dropdown filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search invoice or customer..."
            className="h-9 pl-9 pr-8 text-xs bg-white dark:bg-zinc-900 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Customer Select */}
        <Select value={selectedCustomer} onValueChange={onCustomerChange}>
          <SelectTrigger className="h-9 w-[150px] sm:w-[170px] text-xs bg-background dark:bg-zinc-900 border-border text-foreground">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover border-border">
            <SelectItem value="all" className="text-xs">
              All Customers
            </SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.shop_name} {c.city ? `(${c.city})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Dropdown */}
        <Select value={selectedStatus} onValueChange={onStatusSelectChange}>
          <SelectTrigger className="h-9 w-[130px] text-xs bg-background dark:bg-zinc-900 border-border text-foreground">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">
              All Statuses
            </SelectItem>
            <SelectItem value="PENDING" className="text-xs">
              Pending
            </SelectItem>
            <SelectItem value="PAID" className="text-xs">
              Paid
            </SelectItem>
            <SelectItem value="PARTIAL" className="text-xs">
              Partial
            </SelectItem>
            <SelectItem value="CANCELLED" className="text-xs">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Popover Filter & Sorting */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 border-border bg-background dark:bg-zinc-900 ${
                hasActiveFilters ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              title="More Filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3 bg-popover border-border space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Sort By Date</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant={sortDirection === "desc" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onSortDirectionChange("desc")}
                  className="h-7 text-[11px] gap-1"
                >
                  <ArrowUpDown className="h-3 w-3" /> Newest First
                </Button>
                <Button
                  variant={sortDirection === "asc" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onSortDirectionChange("asc")}
                  className="h-7 text-[11px] gap-1"
                >
                  <ArrowUpDown className="h-3 w-3" /> Oldest First
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="w-full h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Clear Filters indicator */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
