"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, RotateCw, Plus, Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DateRangePreset {
  id: string
  label: string
  startDate?: string
  endDate?: string
}

export const DATE_PRESETS: DateRangePreset[] = [
  {
    id: "oct_2026",
    label: "01 Oct 2026 – 31 Oct 2026",
    startDate: "2026-10-01T00:00:00.000Z",
    endDate: "2026-10-31T23:59:59.999Z",
  },
  {
    id: "all_time",
    label: "All Time",
    startDate: undefined,
    endDate: undefined,
  },
  {
    id: "last_30_days",
    label: "Last 30 Days",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  },
  {
    id: "sep_2026",
    label: "01 Sep 2026 – 30 Sep 2026",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-09-30T23:59:59.999Z",
  },
  {
    id: "year_2026",
    label: "Year 2026",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.999Z",
  },
]

interface InvoiceHeaderProps {
  selectedPreset: DateRangePreset
  onPresetChange: (preset: DateRangePreset) => void
  onExport: () => void
  onRefresh: () => void
  onCreateInvoice: () => void
  isRefreshing?: boolean
  isExporting?: boolean
}

export function InvoiceHeader({
  selectedPreset,
  onPresetChange,
  onExport,
  onRefresh,
  onCreateInvoice,
  isRefreshing = false,
  isExporting = false,
}: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Billing Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage invoices, payments, and generate monthly statements.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date Range Preset Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-xs font-medium text-foreground gap-2"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{selectedPreset.label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            {DATE_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id
              return (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => onPresetChange(preset)}
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className={isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {preset.label}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="h-9 px-3 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-xs font-medium gap-2"
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
          className="h-9 px-3 border-border bg-background dark:bg-zinc-900 hover:bg-muted text-xs font-medium gap-2"
        >
          <RotateCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>

        {/* Primary Create Invoice */}
        <Button
          size="sm"
          onClick={onCreateInvoice}
          className="h-9 px-3.5 bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs shadow-xs gap-1.5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Create Invoice</span>
        </Button>
      </div>
    </div>
  )
}
