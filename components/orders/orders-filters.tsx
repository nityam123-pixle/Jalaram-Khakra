"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"
import { DatePickerFilter } from "@/components/ui/date-picker-filter"

interface OrdersFiltersProps {
  searchTerm: string
  setSearchTerm: (s: string) => void
  statusFilter: string
  setStatusFilter: (s: string) => void
  cityFilter: string
  setCityFilter: (s: string) => void
  fromDate: string
  setFromDate: (s: string) => void
  toDate: string
  setToDate: (s: string) => void
  productFilter: string
  setProductFilter: (s: string) => void
  cities: string[]
  products: { id: string; name: string }[]
  onClearFilters: () => void
  totalCount?: number
}

export function OrdersFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  cityFilter,
  setCityFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  productFilter,
  setProductFilter,
  cities,
  products,
  onClearFilters,
  totalCount
}: OrdersFiltersProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== "all" ||
    cityFilter !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    productFilter !== "all"

  return (
    <div className="flex flex-col gap-3.5 p-4 bg-card rounded-2xl border border-border/80 shadow-xs">
      {/* Top Search Bar & Quick Indicators */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Global Multi-Token / Order ID Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by customer, city, item, or Order ID (#32d92dd0)..."
            className="pl-10 pr-9 bg-white dark:bg-zinc-900 border-border text-foreground placeholder:text-muted-foreground text-sm h-10 rounded-xl focus-visible:ring-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Clear Filters Button if any active */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-1.5 h-10 px-3 text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>

      {/* Filter Selects & Date Duration Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-center">
        {/* Status Select */}
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background dark:bg-zinc-900 border-border text-foreground text-xs h-10 w-full rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">🟡 Pending</SelectItem>
              <SelectItem value="processing">🔵 Processing</SelectItem>
              <SelectItem value="completed">🟢 Completed</SelectItem>
              <SelectItem value="delivered">🟣 Delivered</SelectItem>
              <SelectItem value="cancelled">🔴 Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City Select */}
        <div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="bg-background dark:bg-zinc-900 border-border text-foreground text-xs h-10 w-full truncate rounded-xl">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="capitalize text-xs">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Select */}
        <div>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="bg-background dark:bg-zinc-900 border-border text-foreground text-xs h-10 w-full truncate rounded-xl">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Date Filter */}
        <DatePickerFilter
          label="FROM"
          value={fromDate}
          onChange={(val) => {
            setFromDate(val)
            if (val && toDate && val > toDate) {
              setToDate("")
            }
          }}
          maxDate={toDate || undefined}
        />

        {/* To Date Filter */}
        <DatePickerFilter
          label="TO"
          value={toDate}
          onChange={(val) => {
            setToDate(val)
            if (val && fromDate && val < fromDate) {
              setFromDate("")
            }
          }}
          minDate={fromDate || undefined}
        />
      </div>
    </div>
  )
}
