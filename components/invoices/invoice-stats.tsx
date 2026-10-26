"use client"

import { Card, CardContent } from "@/components/ui/card"
import { IndianRupee, Clock3, Percent, Banknote } from "lucide-react"

export interface InvoiceStatsData {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  cancelledInvoices?: number
  outstandingAmount: number
  collectedThisMonth: number
  collectedAmount?: number
  collectionRate: number
  averageInvoiceValue?: number
  growthPercentage?: number | null
}

interface InvoiceStatsProps {
  stats: InvoiceStatsData
  periodLabel?: string
}

function MiniBarSparkline({ color = "amber" }: { color?: "amber" | "emerald" }) {
  const barClass = color === "amber" 
    ? "bg-amber-500/60 dark:bg-amber-400/70" 
    : "bg-emerald-500/60 dark:bg-emerald-400/70"
  
  // Varying heights matching the screenshot aesthetic
  const heights = [35, 60, 45, 80, 50, 95, 70]

  return (
    <div className="flex items-end gap-1 h-6 self-end" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${barClass} transition-all duration-300`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

export function InvoiceStats({ stats, periodLabel = "This Month" }: InvoiceStatsProps) {
  const collectedVal = stats.collectedAmount ?? stats.collectedThisMonth ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Outstanding Balance */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Outstanding Balance
              </p>
              <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-foreground font-mono mt-0.5">
                ₹{Math.round(stats.outstandingAmount).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-medium">
              {stats.pendingInvoices} pending {stats.pendingInvoices === 1 ? "invoice" : "invoices"}
            </span>
            <MiniBarSparkline color="amber" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Collected */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Banknote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Collected {periodLabel}
                </p>
                <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-foreground font-mono mt-0.5">
                  ₹{Math.round(collectedVal).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            {stats.growthPercentage !== undefined && stats.growthPercentage !== null && (
              <span
                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                  stats.growthPercentage >= 0
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20"
                }`}
              >
                {stats.growthPercentage >= 0 ? `↗ +${stats.growthPercentage}%` : `↘ ${stats.growthPercentage}%`}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-medium">
              {stats.paidInvoices} invoices paid
            </span>
            <MiniBarSparkline color="emerald" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Pending Invoices */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <Clock3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pending Invoices
              </p>
              <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-foreground font-mono mt-0.5">
                {stats.pendingInvoices}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-medium">
              Total value ₹{Math.round(stats.outstandingAmount).toLocaleString("en-IN")}
            </span>
            <MiniBarSparkline color="amber" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Collection Rate */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Percent className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Collection Rate
                </p>
                <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-foreground font-mono mt-0.5">
                  {stats.collectionRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground font-medium">
              {stats.paidInvoices} of {stats.totalInvoices} invoices
            </span>
            <MiniBarSparkline color="emerald" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
