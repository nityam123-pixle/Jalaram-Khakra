"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Clock, Truck } from "lucide-react"
import { POStatsData } from "./po-stats"

interface POInsightsProps {
  stats: POStatsData
  pos: any[]
}

export function POInsights({ stats, pos }: POInsightsProps) {
  // Check for overdue POs
  const overduePOs = pos.filter((po) => {
    if (po.status === "RECEIVED" || po.status === "CANCELLED" || !po.expectedDelivery) return false
    return new Date(po.expectedDelivery) < new Date()
  })

  const fulfillmentRate = stats.totalPOs > 0 
    ? Math.round((stats.receivedCount / stats.totalPOs) * 100) 
    : 0

  return (
    <Card className="border border-border/80 bg-muted/20 dark:bg-card/50 shadow-none rounded-xl">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Supply Chain Flow</span>
              <span className="text-muted-foreground ml-1.5 hidden md:inline">
                {stats.inTransitCount} shipments currently en route across {stats.suppliersCount} vendors
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Fulfilled: <strong className="text-foreground">{fulfillmentRate}%</strong></span>
            </div>

            {overduePOs.length > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Overdue: <strong>{overduePOs.length} POs</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                <span>All deliveries on schedule</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
