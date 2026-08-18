"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Clock, Truck, MapPin } from "lucide-react"
import { IncomingStatsData } from "./incoming-stats"

interface IncomingInsightsProps {
  stats: IncomingStatsData
}

export function IncomingInsights({ stats }: IncomingInsightsProps) {
  const completionRate = stats.totalShipments > 0
    ? Math.round((stats.completedCount / stats.totalShipments) * 100)
    : 0

  return (
    <Card className="border border-border/80 bg-muted/20 dark:bg-card/50 shadow-none rounded-xl">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Inbound Freight Pulse</span>
              <span className="text-muted-foreground ml-1.5 hidden md:inline">
                {stats.arrivedCount} shipments at receiving bay ready for verification
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Intake Complete: <strong className="text-foreground">{completionRate}%</strong></span>
            </div>

            {stats.overdueCount > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Delayed: <strong>{stats.overdueCount} shipments</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                <span>All shipments arriving on time</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
