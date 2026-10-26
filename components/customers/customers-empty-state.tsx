"use client"

import { Button } from "@/components/ui/button"
import { Users, X, Plus } from "lucide-react"

interface CustomersEmptyStateProps {
  onResetFilters?: () => void
  hasActiveFilters: boolean
  onAddCustomer: () => void
}

export function CustomersEmptyState({
  onResetFilters,
  hasActiveFilters,
  onAddCustomer,
}: CustomersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[350px] border border-dashed border-border/85 rounded-2xl bg-card/50 shadow-sm">
      <div className="p-4 rounded-full bg-muted/60 text-muted-foreground mb-4">
        <Users className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">No customers found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {hasActiveFilters
          ? "No customers match your selected filters. Try clearing some filters or searching for something else."
          : "Get started by registering your first customer."}
      </p>
      <div className="mt-5 flex items-center gap-3">
        {hasActiveFilters && onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="gap-2">
            <X className="h-4 w-4" />
            <span>Reset Filters</span>
          </Button>
        )}
        <Button
          size="sm"
          onClick={onAddCustomer}
          className="gap-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </Button>
      </div>
    </div>
  )
}
