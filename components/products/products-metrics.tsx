"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, Layers, LayoutGrid, ArrowRight } from "lucide-react"

interface ProductsMetricsProps {
  stats: {
    totalProducts: number
    totalVariants: number
    totalCategories: number
    healthCounts: {
      good: number
      low: number
      issues: number
    }
  }
  onSelectHealthFilter?: (status: "all" | "Good" | "Low" | "Issue") => void
}

export function ProductsMetrics({ stats, onSelectHealthFilter }: ProductsMetricsProps) {
  const { totalProducts, totalVariants, totalCategories, healthCounts } = stats
  const totalHealth = healthCounts.good + healthCounts.low + healthCounts.issues || 1

  const goodPct = (healthCounts.good / totalHealth) * 100
  const lowPct = (healthCounts.low / totalHealth) * 100
  const issuesPct = (healthCounts.issues / totalHealth) * 100

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
      {/* Panel A — Total Products (col-span 3) */}
      <Card className="lg:col-span-3 border-border/80 bg-card rounded-xl shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Products
            </span>
            <div className="p-2 rounded-lg bg-muted/60 dark:bg-zinc-800/80 border border-border/60 text-muted-foreground">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-foreground font-sans leading-none">
              {totalProducts}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Panel B — Total Variants (col-span 3) */}
      <Card className="lg:col-span-3 border-border/80 bg-card rounded-xl shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Variants
            </span>
            <div className="p-2 rounded-lg bg-muted/60 dark:bg-zinc-800/80 border border-border/60 text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-foreground font-sans leading-none">
              {totalVariants}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Panel C — Categories (col-span 2) */}
      <Card className="lg:col-span-2 border-border/80 bg-card rounded-xl shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </span>
            <div className="p-2 rounded-lg bg-muted/60 dark:bg-zinc-800/80 border border-border/60 text-muted-foreground">
              <LayoutGrid className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-foreground font-sans leading-none">
              {totalCategories}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Panel D — Price Health (col-span 4, wider panel) */}
      <Card className="lg:col-span-4 border-border/80 bg-card rounded-xl shadow-2xs hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Price Health
            </span>
            <button
              type="button"
              onClick={() => onSelectHealthFilter?.("all")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="View all price health"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Segmented Horizontal Progress Bar */}
          <div className="mt-3">
            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden flex items-center">
              <div
                style={{ width: `${goodPct}%` }}
                className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                title={`Good (≥20%): ${healthCounts.good}`}
              />
              <div
                style={{ width: `${lowPct}%` }}
                className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-500"
                title={`Low (5–20%): ${healthCounts.low}`}
              />
              <div
                style={{ width: `${issuesPct}%` }}
                className="h-full bg-rose-500 transition-all duration-500 rounded-r-full"
                title={`Issues (<5%): ${healthCounts.issues}`}
              />
            </div>
          </div>

          {/* 3 Status Figure Breakdown */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onSelectHealthFilter?.("Good")}
              className="flex items-baseline gap-1.5 text-left group transition-transform active:scale-95"
            >
              <span className="text-base font-bold text-foreground font-sans leading-none">
                {healthCounts.good}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Good (≥20%)
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectHealthFilter?.("Low")}
              className="flex items-baseline gap-1.5 text-left group transition-transform active:scale-95"
            >
              <span className="text-base font-bold text-foreground font-sans leading-none">
                {healthCounts.low}
              </span>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Low (5–20%)
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectHealthFilter?.("Issue")}
              className="flex items-baseline gap-1.5 text-left group transition-transform active:scale-95"
            >
              <span className="text-base font-bold text-foreground font-sans leading-none">
                {healthCounts.issues}
              </span>
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                Issues (&lt;5%)
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
