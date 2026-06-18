"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getStockLedger } from "@/app/actions/inventory"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, ArrowDown, Package, AlertTriangle, Box, RotateCcw } from "lucide-react"
import { PageHeaderSkeleton, ActivityFeedSkeleton } from "@/components/ui/skeleton-layouts"

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  RECEIVED_FROM_SUPPLIER: { label: "Received from Supplier", icon: <ArrowUp className="h-4 w-4" />, color: "text-emerald-500", bg: "bg-emerald-100/50 dark:bg-emerald-500/10" },
  RETURN_RECEIVED: { label: "Customer Return", icon: <RotateCcw className="h-4 w-4" />, color: "text-purple-500", bg: "bg-purple-100/50 dark:bg-purple-500/10" },
  SOLD_THROUGH_ORDER: { label: "Order Fulfillment", icon: <ArrowDown className="h-4 w-4" />, color: "text-blue-500", bg: "bg-blue-100/50 dark:bg-blue-500/10" },
  RETURN_SENT: { label: "Return to Supplier", icon: <ArrowDown className="h-4 w-4" />, color: "text-orange-500", bg: "bg-orange-100/50 dark:bg-orange-500/10" },
  DAMAGED: { label: "Damaged/Loss", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-100/50 dark:bg-red-500/10" },
  MANUAL_ADJUSTMENT: { label: "Manual Adjustment", icon: <Box className="h-4 w-4" />, color: "text-amber-500", bg: "bg-amber-100/50 dark:bg-amber-500/10" },
  OPENING_STOCK: { label: "Opening Stock", icon: <Package className="h-4 w-4" />, color: "text-slate-500", bg: "bg-slate-100/50 dark:bg-slate-500/10" },
}

function formatDateHeader(date: Date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date)
}

function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true
  }).format(new Date(date))
}

export function MovementsTimelineClient({ initialData }: { initialData: any[] }) {
  const [filter, setFilter] = useState("ALL")

  const { data: ledger = initialData, isLoading } = useQuery({
    queryKey: ["stockMovements"],
    queryFn: async () => {
      const result = await getStockLedger({ pageSize: 150 })
      return result.entries
    },
    initialData,
    staleTime: 60 * 1000,
  })

  if (isLoading && !ledger.length) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl">
        <PageHeaderSkeleton />
        <div className="mt-8">
          <ActivityFeedSkeleton count={8} />
        </div>
      </div>
    )
  }

  const filteredLedger = ledger.filter((entry: any) => {
    if (filter === "ALL") return true
    if (filter === "IN") return entry.quantity > 0
    if (filter === "OUT") return entry.quantity < 0
    if (filter === "ADJUSTMENTS") return entry.action === "MANUAL_ADJUSTMENT" || entry.action === "DAMAGED"
    return true
  })

  // Group by date string
  const grouped = filteredLedger.reduce((acc: any, entry: any) => {
    const dateKey = new Date(entry.createdAt).toDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(entry)
    return acc
  }, {} as Record<string, typeof ledger>)

  const sortedDateKeys = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-sm text-muted-foreground">
            Timeline view of all inventory activity
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="IN">Stock In</TabsTrigger>
          <TabsTrigger value="OUT">Stock Out</TabsTrigger>
          <TabsTrigger value="ADJUSTMENTS">Adjustments</TabsTrigger>
        </TabsList>

        <div className="space-y-8">
          {sortedDateKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No movements found for this filter</p>
            </div>
          ) : (
            sortedDateKeys.map(dateKey => {
              const entries = grouped[dateKey]
              return (
                <div key={dateKey} className="relative">
                  <h3 className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {formatDateHeader(new Date(dateKey))}
                  </h3>
                  
                  <div className="mt-4 space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {entries.map((entry: any) => {
                      const cfg = ACTION_CONFIG[entry.action] || { label: entry.action, icon: <Box className="h-4 w-4"/>, color: "text-slate-500", bg: "bg-slate-100" }
                      const isPositive = entry.quantity > 0

                      return (
                        <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          {/* Icon Marker */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          
                          {/* Card Content */}
                          <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={`text-[10px] font-medium border-transparent ${cfg.bg} ${cfg.color}`}>
                                      {cfg.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{formatTime(entry.createdAt)}</span>
                                  </div>
                                  <p className="font-semibold">{entry.variant.product.name}</p>
                                  <p className="text-sm text-muted-foreground">{entry.variant.name}</p>
                                </div>
                                <div className={`text-xl font-bold flex shrink-0 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {isPositive ? '+' : ''}{entry.quantity}
                                </div>
                              </div>
                              
                              <Separator className="my-3" />
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex gap-4">
                                  <span>Before: <strong className="text-foreground">{entry.stockBefore}</strong></span>
                                  <span>After: <strong className="text-foreground">{entry.stockAfter}</strong></span>
                                </div>
                                {entry.referenceId && (
                                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">Ref: {entry.referenceId.slice(0,8)}</span>
                                )}
                              </div>
                              {entry.notes && (
                                <p className="mt-2 text-xs italic text-muted-foreground border-l-2 pl-2">"{entry.notes}"</p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Tabs>
    </div>
  )
}
