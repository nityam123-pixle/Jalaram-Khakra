"use client"

import { Badge } from "@/components/ui/badge"

interface OrderStatusBadgeProps {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const s = status?.toLowerCase() || "pending"

  let bg = ""
  let text = ""
  let label = ""

  switch (s) {
    case "completed":
    case "delivered":
      bg = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
      text = "text-emerald-700 dark:text-emerald-400"
      label = s === "completed" ? "Completed" : "Delivered"
      break
    case "pending":
      bg = "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
      text = "text-amber-700 dark:text-amber-400"
      label = "Pending"
      break
    case "processing":
      bg = "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
      text = "text-blue-700 dark:text-blue-400"
      label = "Processing"
      break
    case "cancelled":
      bg = "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
      text = "text-rose-700 dark:text-rose-400"
      label = "Cancelled"
      break
    default:
      bg = "bg-muted border-border"
      text = "text-muted-foreground"
      label = status
  }

  return (
    <Badge variant="outline" className={`font-medium text-xs px-2.5 py-0.5 rounded-full ${bg} ${text}`}>
      {label}
    </Badge>
  )
}
