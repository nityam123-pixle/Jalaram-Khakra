"use client"

import { Badge } from "@/components/ui/badge"

interface OrderStatusBadgeProps {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const s = status?.toLowerCase() || "pending"

  let dotColor = ""
  let badgeStyle = ""
  let label = ""

  switch (s) {
    case "completed":
    case "delivered":
      dotColor = "bg-emerald-500"
      badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      label = s === "completed" ? "Completed" : "Delivered"
      break
    case "pending":
      dotColor = "bg-amber-500"
      badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      label = "Pending"
      break
    case "processing":
      dotColor = "bg-blue-500"
      badgeStyle = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      label = "Processing"
      break
    case "cancelled":
      dotColor = "bg-rose-500"
      badgeStyle = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      label = "Cancelled"
      break
    default:
      dotColor = "bg-muted-foreground"
      badgeStyle = "bg-muted/60 text-muted-foreground border-border"
      label = status
  }

  return (
    <Badge 
      variant="outline" 
      className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border shadow-none ${badgeStyle}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
      <span>{label}</span>
    </Badge>
  )
}
