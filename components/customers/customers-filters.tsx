"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"
import { DatePickerFilter } from "@/components/ui/date-picker-filter"

interface CustomersFiltersProps {
  searchTerm: string
  setSearchTerm: (s: string) => void
  statusFilter: string
  setStatusFilter: (s: string) => void
  cityFilter: string
  setCityFilter: (s: string) => void
  segmentFilter: string
  setSegmentFilter: (s: string) => void
  fromDate: string
  setFromDate: (s: string) => void
  toDate: string
  setToDate: (s: string) => void
  cities: string[]
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function CustomersFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  cityFilter,
  setCityFilter,
  segmentFilter,
  setSegmentFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  cities,
  onClearFilters,
  hasActiveFilters,
}: CustomersFiltersProps) {
  return (
    <div className="flex flex-col gap-3.5 p-4 bg-card rounded-2xl border border-border/80 shadow-xs">
      {/* Top Search Bar & Clear Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by customer name, city, phone, or Customer ID (#C123)..."
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

      {/* Second Row: Status, City, Customer Segment, From Date, To Date */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-center">
        {/* Status Dropdown */}
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background dark:bg-zinc-900 border-border text-foreground text-xs h-10 w-full rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">🟢 Active</SelectItem>
              <SelectItem value="dormant">⚪ Dormant</SelectItem>
              <SelectItem value="high value">🟠 High Value</SelectItem>
              <SelectItem value="new">🔵 New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City Dropdown */}
        <div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="bg-background dark:bg-zinc-900 border-border text-foreground text-xs h-10 w-full truncate rounded-xl">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="capitalize text-xs">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Customer Segment Dropdown */}
        <div>
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="bg-background dark:bg-zinc-900 border-border text-foreground text-xs h-10 w-full truncate rounded-xl">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="repeat">Repeat Customers (&gt;1 order)</SelectItem>
              <SelectItem value="single">Single Order Customers</SelectItem>
              <SelectItem value="high_value">High Value (&gt;₹50,000)</SelectItem>
              <SelectItem value="zero_order">No Orders Yet</SelectItem>
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
