"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { VariantWorkspaceItem } from "@/app/actions/products"
import { formatCurrency, formatProfitRange } from "@/lib/pricing-utils"

interface ProductsGridProps {
  variants: VariantWorkspaceItem[]
  selectedVariant: VariantWorkspaceItem | null
  onSelectVariant: (variant: VariantWorkspaceItem) => void
}

export function ProductsGrid({
  variants,
  selectedVariant,
  onSelectVariant,
}: ProductsGridProps) {
  if (variants.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground text-xs bg-card border border-border/80 rounded-xl">
        No products or variants found matching your filters.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
      {variants.map((v) => {
        const isSelected = selectedVariant?.id === v.id
        const cost = v.pricing?.costPrice ?? 0
        const minSell = v.pricing?.minSellingPrice ?? 0
        const maxSell = v.pricing?.maxSellingPrice ?? 0

        return (
          <Card
            key={v.id}
            onClick={() => onSelectVariant(v)}
            className={`cursor-pointer transition-all border rounded-xl overflow-hidden shadow-2xs ${
              isSelected
                ? "border-foreground/40 bg-muted/50 dark:bg-zinc-850 shadow-xs"
                : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
            }`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
              {/* Header: Product & Variant + Pack Size */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-tight">
                    {v.product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.name} · {v.product.category.name}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 dark:bg-zinc-800 border border-border/80 text-foreground shrink-0">
                  {v.packSize}
                </span>
              </div>

              {/* Price Grid */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Cost</span>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{formatCurrency(cost)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Min Sell</span>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{formatCurrency(minSell)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Max Sell</span>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{formatCurrency(maxSell)}</p>
                </div>
              </div>

              {/* Footer: Profit & Status */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Profit Range</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatProfitRange(v.profitMin, v.profitMax)}
                  </span>
                </div>

                <div className="text-right">
                  {v.healthStatus === "Good" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Good
                    </span>
                  )}
                  {v.healthStatus === "Low" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Low
                    </span>
                  )}
                  {v.healthStatus === "Issue" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Issue
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
