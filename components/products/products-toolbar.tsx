"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, AlignJustify, LayoutGrid, X } from "lucide-react"

interface ProductsToolbarProps {
  categories: Array<{ id: string; name: string }>
  selectedCategory: string
  onCategoryChange: (value: string) => void

  products: Array<{ id: string; name: string }>
  selectedProduct: string
  onProductChange: (value: string) => void

  variantOptions: string[]
  selectedVariant: string
  onVariantChange: (value: string) => void

  selectedHealth: string
  onHealthChange: (value: string) => void

  sortBy: string
  onSortChange: (value: string) => void

  viewMode: "table" | "grid"
  onViewModeChange: (mode: "table" | "grid") => void

  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function ProductsToolbar({
  categories,
  selectedCategory,
  onCategoryChange,
  products,
  selectedProduct,
  onProductChange,
  variantOptions,
  selectedVariant,
  onVariantChange,
  selectedHealth,
  onHealthChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
}: ProductsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
      {/* Left side: Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9 min-w-[130px] sm:w-[150px] text-xs bg-card dark:bg-zinc-900 border-border text-foreground rounded-lg">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover border-border">
            <SelectItem value="all" className="text-xs">
              All Categories
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 2. Product Filter */}
        <Select value={selectedProduct} onValueChange={onProductChange}>
          <SelectTrigger className="h-9 min-w-[130px] sm:w-[160px] text-xs bg-card dark:bg-zinc-900 border-border text-foreground rounded-lg">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover border-border">
            <SelectItem value="all" className="text-xs">
              All Products
            </SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 3. Variant Filter */}
        <Select value={selectedVariant} onValueChange={onVariantChange}>
          <SelectTrigger className="h-9 min-w-[120px] sm:w-[140px] text-xs bg-card dark:bg-zinc-900 border-border text-foreground rounded-lg">
            <SelectValue placeholder="All Variants" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover border-border">
            <SelectItem value="all" className="text-xs">
              All Variants
            </SelectItem>
            {variantOptions.map((v) => (
              <SelectItem key={v} value={v} className="text-xs">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 4. Price Health Filter */}
        <Select value={selectedHealth} onValueChange={onHealthChange}>
          <SelectTrigger className="h-9 min-w-[130px] sm:w-[150px] text-xs bg-card dark:bg-zinc-900 border-border text-foreground rounded-lg">
            <SelectValue placeholder="All Price Health" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-xs">
              All Price Health
            </SelectItem>
            <SelectItem value="Good" className="text-xs text-emerald-600 dark:text-emerald-400">
              Good (≥20%)
            </SelectItem>
            <SelectItem value="Low" className="text-xs text-amber-600 dark:text-amber-400">
              Low (5–20%)
            </SelectItem>
            <SelectItem value="Issue" className="text-xs text-rose-600 dark:text-rose-400">
              Issues (&lt;5%)
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 5. Sort Selector */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 min-w-[140px] sm:w-[160px] text-xs bg-card dark:bg-zinc-900 border-border text-foreground rounded-lg gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="name_asc" className="text-xs">
              Name (A–Z)
            </SelectItem>
            <SelectItem value="name_desc" className="text-xs">
              Name (Z–A)
            </SelectItem>
            <SelectItem value="cost_asc" className="text-xs">
              Cost: Low to High
            </SelectItem>
            <SelectItem value="cost_desc" className="text-xs">
              Cost: High to Low
            </SelectItem>
            <SelectItem value="minSell_asc" className="text-xs">
              Min Sell: Low to High
            </SelectItem>
            <SelectItem value="minSell_desc" className="text-xs">
              Min Sell: High to Low
            </SelectItem>
            <SelectItem value="maxSell_asc" className="text-xs">
              Max Sell: Low to High
            </SelectItem>
            <SelectItem value="maxSell_desc" className="text-xs">
              Max Sell: High to Low
            </SelectItem>
            <SelectItem value="profit_desc" className="text-xs">
              Highest Profit
            </SelectItem>
            <SelectItem value="margin_desc" className="text-xs">
              Highest Margin
            </SelectItem>
            <SelectItem value="margin_asc" className="text-xs">
              Lowest Margin
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Indicator Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Right side: List / Grid toggle */}
      <div className="flex items-center self-end sm:self-auto p-1 bg-muted/60 dark:bg-zinc-900 border border-border/80 rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange("table")}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            viewMode === "table"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Table view"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("grid")}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            viewMode === "grid"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
