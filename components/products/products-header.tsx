"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, RotateCw, Plus } from "lucide-react"

interface ProductsHeaderProps {
  search: string
  onSearchChange: (value: string) => void
  onExport: () => void
  onRefresh: () => void
  onAddProduct: () => void
  isRefreshing?: boolean
  isExporting?: boolean
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export function ProductsHeader({
  search,
  onSearchChange,
  onExport,
  onRefresh,
  onAddProduct,
  isRefreshing = false,
  isExporting = false,
  searchInputRef,
}: ProductsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-1">
      {/* Page Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-foreground font-sans">
          Products &amp; Pricing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage product variants, costs and selling prices across your catalogue.
        </p>
      </div>

      {/* Top-Right Action Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Bar with ⌘K Badge */}
        <div className="relative min-w-[240px] sm:min-w-[280px] lg:min-w-[310px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, variants, or SKU..."
            className="h-9 pl-9 pr-12 text-xs bg-background dark:bg-zinc-900 border-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="h-9 px-3.5 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-xs font-medium gap-2 text-foreground"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Export CSV</span>
        </Button>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 px-3.5 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-xs font-medium gap-2 text-foreground"
        >
          <RotateCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>

        {/* + Add Product Primary Action */}
        <Button
          size="sm"
          onClick={onAddProduct}
          className="h-9 px-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold text-xs shadow-xs gap-1.5 transition-colors rounded-lg"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Product</span>
        </Button>
      </div>
    </div>
  )
}
