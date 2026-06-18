"use client"

import { Button } from "@/components/ui/button"
import { PackageSearch, X } from "lucide-react"

interface OrdersEmptyStateProps {
  onResetFilters?: () => void
  hasActiveFilters: boolean
}

export function OrdersEmptyState({ onResetFilters, hasActiveFilters }: OrdersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[350px] border border-dashed border-border/85 rounded-2xl bg-card/50 shadow-sm">
      <div className="p-4 rounded-full bg-muted/60 text-muted-foreground mb-4">
        <PackageSearch className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">No orders found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {hasActiveFilters
          ? "No orders match your selected filters. Try clearing some filters or searching for something else."
          : "Get started by creating your first customer order."}
      </p>
      <div className="mt-5 flex items-center gap-3">
        {hasActiveFilters && onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="gap-2">
            <X className="h-4 w-4" />
            <span>Reset Filters</span>
          </Button>
        )}
        <Button size="sm" asChild>
          <a href="/orders/new">Create Order</a>
        </Button>
      </div>
    </div>
  )
}
