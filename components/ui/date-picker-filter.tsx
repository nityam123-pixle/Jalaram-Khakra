"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerFilterProps {
  label: "FROM" | "TO" | string
  value?: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
  className?: string
  placeholder?: string
}

function parseDateString(dateStr?: string): Date | undefined {
  if (!dateStr || dateStr.trim() === "") return undefined
  
  // Format is typically YYYY-MM-DD
  const parts = dateStr.slice(0, 10).split("-")
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day)
    }
  }

  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

export function DatePickerFilter({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  className,
  placeholder = "dd/mm/yyyy",
}: DatePickerFilterProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDateObj = React.useMemo(() => parseDateString(value), [value])
  const minDateObj = React.useMemo(() => parseDateString(minDate), [minDate])
  const maxDateObj = React.useMemo(() => parseDateString(maxDate), [maxDate])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd")
      onChange(formatted)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

      if (minDateObj) {
        const minTime = new Date(
          minDateObj.getFullYear(),
          minDateObj.getMonth(),
          minDateObj.getDate()
        ).getTime()
        if (targetTime < minTime) return true
      }

      if (maxDateObj) {
        const maxTime = new Date(
          maxDateObj.getFullYear(),
          maxDateObj.getMonth(),
          maxDateObj.getDate()
        ).getTime()
        if (targetTime > maxTime) return true
      }

      return false
    },
    [minDateObj, maxDateObj]
  )

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${label} date: ${selectedDateObj ? format(selectedDateObj, "dd/MM/yyyy") : placeholder}`}
            className={cn(
              "flex items-center justify-between gap-2 h-10 px-3 w-full rounded-xl border border-border bg-background dark:bg-zinc-900 text-foreground text-xs text-left transition-colors hover:border-border hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer select-none",
              open && "border-ring/60 ring-1 ring-ring/30",
              className
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                {label}:
              </span>
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span
                className={cn(
                  "text-xs font-mono truncate",
                  selectedDateObj ? "text-foreground font-medium" : "text-muted-foreground/70"
                )}
              >
                {selectedDateObj ? format(selectedDateObj, "dd/MM/yyyy") : placeholder}
              </span>
            </div>

            {selectedDateObj && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange("")
                  }
                }}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/60 transition-colors shrink-0 cursor-pointer"
                aria-label={`Clear ${label} date`}
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-auto p-0 z-50 bg-popover border-border/80 shadow-lg rounded-xl"
        >
          <Calendar
            mode="single"
            selected={selectedDateObj}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            initialFocus
          />
          {selectedDateObj && (
            <div className="p-2 border-t border-border/60 flex justify-between items-center text-xs bg-muted/20">
              <span className="text-muted-foreground font-mono text-[11px] px-2">
                Selected: {format(selectedDateObj, "dd/MM/yyyy")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
                className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
