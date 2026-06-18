"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  IndianRupee,
  Flame,
  Sparkles,
  Activity,
  ShieldCheck,
  Heart,
  Leaf,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

interface ProductPerformanceProps {
  currentOrders: any[]
  priorOrders: any[]
  activeCategory: string | null
  onSelectCategory: (cat: string | null) => void
  categoriesList: string[]
}

// Sparkline helper
function Sparkline({ data, colorClass }: { data: number[]; colorClass: string }) {
  const points = useMemo(() => {
    if (!data || data.length <= 1) return ""
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min === 0 ? 1 : max - min
    const width = 50
    const height = 16
    return data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width
        const y = height - 1 - ((val - min) / range) * (height - 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ")
  }, [data])

  if (!points) return null

  return (
    <svg width="50" height="16" className={`overflow-visible ${colorClass}`}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// Master Category color map helper
export function getCategoryColor(name: string) {
  const n = name.toLowerCase().trim()
  if (n.includes("patra")) {
    return {
      icon: Leaf,
      stroke: "#10b981", // Emerald
      bg: "bg-emerald-500",
      text: "text-emerald-500",
      border: "border-emerald-500/20",
      lightBg: "bg-emerald-500/10",
      darkText: "text-emerald-700 dark:text-emerald-400",
    }
  }
  if (n.includes("premium")) {
    return {
      icon: Layers,
      stroke: "#f43f5e", // Rose
      bg: "bg-rose-500",
      text: "text-rose-500",
      border: "border-rose-500/20",
      lightBg: "bg-rose-500/10",
      darkText: "text-rose-700 dark:text-rose-400",
    }
  }
  if (n.includes("khakhra")) {
    return {
      icon: Activity,
      stroke: "#3b82f6", // Blue
      bg: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500/20",
      lightBg: "bg-blue-500/10",
      darkText: "text-blue-700 dark:text-blue-400",
    }
  }
  if (n.includes("snacks")) {
    return {
      icon: Sparkles,
      stroke: "#f97316", // Orange
      bg: "bg-orange-500",
      text: "text-orange-500",
      border: "border-orange-500/20",
      lightBg: "bg-orange-500/10",
      darkText: "text-orange-700 dark:text-orange-400",
    }
  }
  if (n.includes("bhakarwadi")) {
    return {
      icon: Layers,
      stroke: "#8b5cf6", // Purple
      bg: "bg-purple-500",
      text: "text-purple-500",
      border: "border-purple-500/20",
      lightBg: "bg-purple-500/10",
      darkText: "text-purple-700 dark:text-purple-400",
    }
  }
  if (n.includes("bhakhri")) {
    return {
      icon: Layers,
      stroke: "#f59e0b", // Amber
      bg: "bg-amber-500",
      text: "text-amber-500",
      border: "border-amber-500/20",
      lightBg: "bg-amber-500/10",
      darkText: "text-amber-700 dark:text-amber-400",
    }
  }
  if (n.includes("chikki")) {
    return {
      icon: Heart,
      stroke: "#ec4899", // Pink
      bg: "bg-pink-500",
      text: "text-pink-500",
      border: "border-pink-500/20",
      lightBg: "bg-pink-500/10",
      darkText: "text-pink-700 dark:text-pink-400",
    }
  }
  if (n.includes("farali")) {
    return {
      icon: ShieldCheck,
      stroke: "#06b6d4", // Cyan
      bg: "bg-cyan-500",
      text: "text-cyan-500",
      border: "border-cyan-500/20",
      lightBg: "bg-cyan-500/10",
      darkText: "text-cyan-700 dark:text-cyan-400",
    }
  }
  if (n.includes("fulvadi")) {
    return {
      icon: Flame,
      stroke: "#84cc16", // Lime
      bg: "bg-lime-500",
      text: "text-lime-500",
      border: "border-lime-500/20",
      lightBg: "bg-lime-500/10",
      darkText: "text-lime-700 dark:text-lime-400",
    }
  }
  if (n.includes("mathiya")) {
    return {
      icon: Sparkles,
      stroke: "#6366f1", // Indigo
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      border: "border-indigo-500/20",
      lightBg: "bg-indigo-500/10",
      darkText: "text-indigo-700 dark:text-indigo-400",
    }
  }

  return {
    icon: Activity,
    stroke: "#64748b", // Slate
    bg: "bg-slate-500",
    text: "text-slate-500",
    border: "border-slate-500/20",
    lightBg: "bg-slate-500/10",
    darkText: "text-slate-700 dark:text-slate-400",
  }
}

export function ProductPerformance({
  currentOrders,
  priorOrders,
  activeCategory,
  onSelectCategory,
  categoriesList,
}: ProductPerformanceProps) {
  const categoryStats = useMemo(() => {
    // 1. Initialize maps
    const statsMap: Record<string, { revenue: number; profit: number; units: number; spark: number[] }> = {}
    const priorStatsMap: Record<string, { revenue: number }> = {}

    categoriesList.forEach((cat) => {
      statsMap[cat] = { revenue: 0, profit: 0, units: 0, spark: [] }
      priorStatsMap[cat] = { revenue: 0 }
    })

    // 2. Aggregate current orders
    currentOrders.forEach((o) => {
      ;(o.items ?? []).forEach((item: any) => {
        const cat = item.categoryName || "Other"
        if (!statsMap[cat]) {
          statsMap[cat] = { revenue: 0, profit: 0, units: 0, spark: [] }
        }

        const rev = Number(item.totalRevenue) || 0
        const profit = Number(item.totalProfit) || 0
        const qty = Number(item.quantity) || 0

        statsMap[cat].revenue += rev
        statsMap[cat].profit += profit
        statsMap[cat].units += qty
        statsMap[cat].spark.push(rev)
      })
    })

    // 3. Aggregate prior orders
    priorOrders.forEach((o) => {
      ;(o.items ?? []).forEach((item: any) => {
        const cat = item.categoryName || "Other"
        if (!priorStatsMap[cat]) {
          priorStatsMap[cat] = { revenue: 0 }
        }
        priorStatsMap[cat].revenue += Number(item.totalRevenue) || 0
      })
    })

    const totalRevenue = Object.values(statsMap).reduce((s, c) => s + c.revenue, 0)

    // 4. Transform to list
    return Object.entries(statsMap).map(([name, data]) => {
      const priorRev = priorStatsMap[name]?.revenue || 0
      const trend = priorRev > 0 ? Math.round(((data.revenue - priorRev) / priorRev) * 100) : 0
      const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
      const contribution = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0

      const sparkPoints = data.spark.slice(-8)
      if (sparkPoints.length <= 1) {
        sparkPoints.unshift(0, 0)
      }

      return {
        name,
        revenue: data.revenue,
        profit: data.profit,
        units: data.units,
        margin,
        trend,
        contribution,
        spark: sparkPoints,
      }
    })
  }, [currentOrders, priorOrders, categoriesList])

  const handleCardClick = (catName: string) => {
    if (activeCategory === catName) {
      onSelectCategory(null)
    } else {
      onSelectCategory(catName)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Category Performance Grid
        </h3>
        {activeCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full transition-all"
          >
            Clear Focus ({activeCategory})
          </button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {categoryStats.map((c) => {
          const meta = getCategoryColor(c.name)
          const IconComp = meta.icon
          const isSelected = activeCategory === c.name

          return (
            <Card
              key={c.name}
              onClick={() => handleCardClick(c.name)}
              className={`cursor-pointer transition-all duration-200 shadow-sm rounded-2xl overflow-hidden hover:scale-[1.01] flex flex-col justify-between min-h-[180px] ${
                isSelected
                  ? "border-primary/80 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20"
                  : "border-border/80 bg-card hover:bg-muted/5"
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 ${meta.lightBg} ${meta.text} ${meta.border}`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {Math.round(c.units).toLocaleString()} sold
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Sparkline data={c.spark} colorClass={meta.text} />
                    {c.trend !== 0 && (
                      <span
                        className={`inline-flex items-center text-[10px] font-bold gap-0.5 ${
                          c.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {c.trend > 0 ? (
                          <TrendingUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <TrendingDown className="h-3 w-3 shrink-0" />
                        )}
                        {Math.abs(c.trend)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-2 text-[10px] font-semibold">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold tracking-wider block">Revenue</span>
                    <span className="text-sm font-extrabold text-foreground flex items-center gap-0.5 mt-0.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      {Math.round(c.revenue).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold tracking-wider block">Net Profit</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                      <IndianRupee className="h-3 w-3" />
                      {Math.round(c.profit).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-muted-foreground">
                    {c.margin.toFixed(0)}% Margin • {c.contribution.toFixed(0)}% Share
                  </span>
                  <span className={`flex items-center gap-0.5 ${meta.darkText} transition-all group-hover:translate-x-1`}>
                    <span>View Analytics</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
