"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Flame, ShieldAlert, Sparkles, Trophy, Lightbulb, Bell, AlertTriangle } from "lucide-react"

interface BusinessHealthProps {
  currentOrders: any[]
  priorOrders: any[]
  customers: any[]
  catalog?: any[]
}

function CircularProgress({ value, max }: { value: number; max: number }) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          className="stroke-muted"
          strokeWidth="7"
          fill="transparent"
        />
        {/* Foreground circle */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500 ease-in-out"
          strokeWidth="7"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground">{value}</span>
        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Health</span>
      </div>
    </div>
  )
}

export function BusinessHealth({ currentOrders, priorOrders, customers, catalog = [] }: BusinessHealthProps) {
  const analytics = useMemo(() => {
    // 1. Calculations for health metrics
    let currentRevenue = 0
    let currentCost = 0
    let completedCount = 0
    let cancelledCount = 0
    const currentCustomerFreq: Record<string, number> = {}

    currentOrders.forEach((o) => {
      const s = o.status?.toLowerCase() || "pending"
      if (s === "completed" || s === "delivered") completedCount++
      if (s === "cancelled") cancelledCount++

      const items = o.items ?? []
      items.forEach((item: any) => {
        currentRevenue += Number(item.totalRevenue) || 0
        currentCost += Number(item.totalCost) || 0
      })
      const custId = o.customerId || o.shop_name
      if (custId) {
        currentCustomerFreq[custId] = (currentCustomerFreq[custId] || 0) + 1
      }
    })

    const currentOrdersCount = currentOrders.length
    const currentProfit = currentRevenue - currentCost
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0

    let priorRevenue = 0
    let priorCost = 0
    let priorOrdersCount = priorOrders.length
    priorOrders.forEach((o) => {
      const items = o.items ?? []
      items.forEach((item: any) => {
        priorRevenue += Number(item.totalRevenue) || 0
        priorCost += Number(item.totalCost) || 0
      })
    })
    const priorProfit = priorRevenue - priorCost
    const priorMargin = priorRevenue > 0 ? (priorProfit / priorRevenue) * 100 : 0

    // Vitals subscores (out of 100)
    // 1. Revenue Health (Growth Trend)
    const revGrowthTrend = priorRevenue > 0 ? ((currentRevenue - priorRevenue) / priorRevenue) * 100 : 0
    const revenueScore = Math.min(Math.max(Math.round(50 + revGrowthTrend * 2), 10), 100)

    // 2. Profit Health (Profit Margin score)
    const profitScore = Math.min(Math.round(currentMargin * 3.5), 100)

    // 3. Order Volume Health (Order counts vs prior)
    const volumeTrend = priorOrdersCount > 0 ? ((currentOrdersCount - priorOrdersCount) / priorOrdersCount) * 100 : 0
    const volumeScore = Math.min(Math.max(Math.round(50 + volumeTrend * 2), 10), 100)

    // 4. Customer Retention Rate (Repeat Rate)
    const currentRepeatCust = Object.values(currentCustomerFreq).filter((cnt) => cnt >= 2).length
    const currentTotalCustCount = Object.keys(currentCustomerFreq).length
    const currentRepeatRate = currentTotalCustCount > 0 ? (currentRepeatCust / currentTotalCustCount) * 100 : 0
    const retentionScore = currentTotalCustCount > 0 ? Math.round(currentRepeatRate) : 80

    // 5. Product Diversity Score (Active categories ordered vs total catalog)
    const activeCats = new Set<string>()
    currentOrders.forEach((o) => {
      ;(o.items ?? []).forEach((i: any) => {
        if (i.categoryName) activeCats.add(i.categoryName.trim())
      })
    })
    const totalCatsCount = catalog.length > 0 ? catalog.length : 10
    const diversityScore = Math.min(Math.round((activeCats.size / totalCatsCount) * 100), 100)

    // 6. City Coverage Score (Cities ordered in vs total customer base cities)
    const activeCities = new Set<string>()
    currentOrders.forEach((o) => {
      if (o.city) activeCities.add(o.city.trim().toLowerCase())
    })
    const totalCustomerCities = new Set(
      customers.map((c) => c.city?.trim().toLowerCase()).filter(Boolean)
    )
    const cityCoverageScore =
      totalCustomerCities.size > 0
        ? Math.min(Math.round((activeCities.size / totalCustomerCities.size) * 100), 100)
        : 100

    // Overall Score (average of all 6)
    const overallScore = Math.round(
      (revenueScore + profitScore + volumeScore + retentionScore + diversityScore + cityCoverageScore) / 6
    )

    // 2. Dynamic Priority-Sorted Alerts
    const alerts: { priority: number; text: string; icon: any; colorClass: string }[] = []

    // Danger: Dormant Shop Owners
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dormantCustomers = customers.filter((c) => {
      if (!c.lastOrderAt) return true
      return new Date(c.lastOrderAt) < thirtyDaysAgo
    })
    if (dormantCustomers.length > 0) {
      alerts.push({
        priority: 1,
        text: `Critical Customer Attention: ${dormantCustomers.length} shop owners have not ordered in the last 30 days. Re-engage them now.`,
        icon: ShieldAlert,
        colorClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      })
    }

    // Danger: Decreasing Profit Margin
    if (priorMargin > 0 && currentMargin < priorMargin - 2) {
      alerts.push({
        priority: 1,
        text: `Critical Profit Margin Drop: Gross margin decreased by ${(priorMargin - currentMargin).toFixed(1)}% compared to the prior period. Verify ingredient/shipping costs.`,
        icon: ShieldAlert,
        colorClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      })
    }

    // Warning: Low category profitability
    const categoryRevenue: Record<string, number> = {}
    currentOrders.forEach((o) => {
      ;(o.items ?? []).forEach((i: any) => {
        if (i.categoryName) {
          categoryRevenue[i.categoryName] = (categoryRevenue[i.categoryName] || 0) + Number(i.totalRevenue)
        }
      })
    })

    const lowMarginCat = Object.entries(categoryRevenue)
      .map(([cat, rev]) => {
        const catCost = currentOrders.reduce(
          (acc, o) =>
            acc +
            (o.items ?? [])
              .filter((i: any) => i.categoryName === cat)
              .reduce((s, i: any) => s + (Number(i.totalCost) || 0), 0),
          0
        )
        const margin = rev > 0 ? ((rev - catCost) / rev) * 100 : 0
        return { name: cat, margin, revenue: rev }
      })
      .find((c) => c.margin < 10 && c.revenue > 1000)

    if (lowMarginCat) {
      alerts.push({
        priority: 2,
        text: `Warning: ${lowMarginCat.name} margin is very low at ${lowMarginCat.margin.toFixed(1)}%. Review and update variant costings.`,
        icon: AlertTriangle,
        colorClass: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
      })
    }

    // Success: Sales Champion Category
    let topCat = "N/A"
    let topCatRev = 0
    Object.entries(categoryRevenue).forEach(([cat, rev]) => {
      if (rev > topCatRev) {
        topCatRev = rev
        topCat = cat
      }
    })
    if (topCatRev > 0) {
      const topCatPercent = currentRevenue > 0 ? (topCatRev / currentRevenue) * 100 : 0
      alerts.push({
        priority: 3,
        text: `Sales Champion: ${topCat} category is performing exceptionally well, driving ${topCatPercent.toFixed(0)}% of your gross sales.`,
        icon: Flame,
        colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      })
    }

    // Success: AOV Increase
    const currentAOV = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0
    const priorAOV = priorOrdersCount > 0 ? priorRevenue / priorOrdersCount : 0
    if (currentAOV > priorAOV + 50) {
      alerts.push({
        priority: 3,
        text: `Favorable Order Value: Average Order Value rose to ₹${Math.round(currentAOV)} (up from ₹${Math.round(priorAOV)}). Bulking and premium purchases are increasing.`,
        icon: Trophy,
        colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      })
    }

    // Info: Geographic Star
    const cityRevenue: Record<string, number> = {}
    currentOrders.forEach((o) => {
      if (o.city) {
        const rev = (o.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0)
        cityRevenue[o.city] = (cityRevenue[o.city] || 0) + rev
      }
    })
    let topCity = "N/A"
    let maxCityRev = 0
    Object.entries(cityRevenue).forEach(([city, rev]) => {
      if (rev > maxCityRev) {
        maxCityRev = rev
        topCity = city
      }
    })
    if (maxCityRev > 0) {
      alerts.push({
        priority: 4,
        text: `Geographic Star: Shop owners in ${topCity.charAt(0).toUpperCase() + topCity.slice(1)} are leading sales this period. Consider local promotions.`,
        icon: Lightbulb,
        colorClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      })
    }

    const sortedAlerts = [...alerts].sort((a, b) => a.priority - b.priority).slice(0, 6)

    return {
      revenueScore,
      profitScore,
      volumeScore,
      retentionScore,
      diversityScore,
      cityCoverageScore,
      overallScore,
      alerts: sortedAlerts,
    }
  }, [currentOrders, priorOrders, customers, catalog])

  const subScores = [
    { label: "Revenue Health", val: analytics.revenueScore, gradient: "from-emerald-500 to-teal-400" },
    { label: "Profit Health", val: analytics.profitScore, gradient: "from-indigo-500 to-purple-400" },
    { label: "Order Volume Health", val: analytics.volumeScore, gradient: "from-blue-500 to-cyan-400" },
    { label: "Customer Retention", val: analytics.retentionScore, gradient: "from-orange-500 to-amber-400" },
    { label: "Product Diversity", val: analytics.diversityScore, gradient: "from-pink-500 to-rose-400" },
    { label: "City Coverage", val: analytics.cityCoverageScore, gradient: "from-fuchsia-500 to-violet-400" },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
      {/* Business Health Score */}
      <Card className="lg:col-span-5 border border-border/80 bg-card rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Business Health Score</CardTitle>
          <CardDescription>Overall performance index across key vitals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <CircularProgress value={analytics.overallScore} max={100} />
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-foreground">
                {analytics.overallScore >= 80
                  ? "Excellent Vitals"
                  : analytics.overallScore >= 60
                  ? "Healthy Standing"
                  : "Needs Attention"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculated dynamically from live sales velocity, margins, and customer retention.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {subScores.map((score, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">{score.label}</span>
                  <span className="text-foreground">{score.val}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden shadow-xs">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${score.gradient} transition-all duration-500`}
                    style={{ width: `${score.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Insights */}
      <Card className="lg:col-span-7 border border-border/80 bg-card rounded-2xl shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-foreground">Insights & Vitals Alert</CardTitle>
            <CardDescription>Automatic business intelligence and anomalies</CardDescription>
          </div>
          <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto max-h-[440px] pr-1">
          {analytics.alerts.map((alert, i) => {
            const IconComp = alert.icon
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed font-medium transition-all hover:scale-[1.005] ${alert.colorClass}`}
              >
                <div className="p-1 rounded-lg bg-background shrink-0 shadow-sm">
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="flex-1 text-foreground dark:text-slate-100 font-semibold">{alert.text}</div>
              </div>
            )
          })}
          {analytics.alerts.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No active warnings or alerts. All vitals are running stable.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
