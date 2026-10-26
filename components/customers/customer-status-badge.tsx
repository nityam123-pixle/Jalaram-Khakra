"use client"

import { Badge } from "@/components/ui/badge"

interface CustomerStatusBadgeProps {
  status: string
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const s = status?.trim() || "Active"

  let badgeStyle = ""

  switch (s) {
    case "Active":
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
      break
    case "High Value":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
      break
    case "Dormant":
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      break
    case "New":
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
      break
    default:
      badgeStyle = "bg-muted text-muted-foreground border-border"
  }

  return (
    <Badge
      variant="outline"
      className={`font-medium text-xs px-2.5 py-0.5 rounded-full inline-flex items-center justify-center border shadow-none ${badgeStyle}`}
    >
      <span>{s}</span>
    </Badge>
  )
}
