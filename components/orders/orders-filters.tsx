"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"

interface OrdersFiltersProps {
  searchTerm: string
  setSearchTerm: (s: string) => void
  statusFilter: string
  setStatusFilter: (s: string) => void
  cityFilter: string
  setCityFilter: (s: string) => void
  dateFilter: string
  setDateFilter: (s: string) => void
  productFilter: string
  setProductFilter: (s: string) => void
  cities: string[]
  products: { id: string; name: string }[]
  onClearFilters: () => void
}

export function OrdersFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  cityFilter,
  setCityFilter,
  dateFilter,
  setDateFilter,
  productFilter,
  setProductFilter,
  cities,
  products,
  onClearFilters
}: OrdersFiltersProps) {
  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    cityFilter !== "all" ||
    dateFilter ||
    productFilter !== "all"

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-xl border border-border/80 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders by customer or ID..."
            className="pl-9 bg-background border-border text-sm h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Selects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:flex lg:items-center">
          {/* Status Select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background border-border text-sm h-9 w-full lg:w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* City Select */}
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="bg-background border-border text-sm h-9 w-full lg:w-[140px] truncate">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="capitalize">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Product Select */}
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="bg-background border-border text-sm h-9 w-full lg:w-[160px] truncate">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Picker Input */}
          <div className="relative w-full lg:w-[150px]">
            <Input
              type="date"
              className="bg-background border-border text-sm h-9 pr-2 w-full scheme-dark"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-2 h-9 text-muted-foreground hover:text-foreground hover:bg-muted font-normal self-end lg:self-center"
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </Button>
        )}
      </div>
    </div>
  )
}
