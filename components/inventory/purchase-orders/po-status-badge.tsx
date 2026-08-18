"use client"

import { Badge } from "@/components/ui/badge"

export type POStatusType = "DRAFT" | "ORDERED" | "IN_TRANSIT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED"

interface POStatusBadgeProps {
  status: string
}

export function POStatusBadge({ status }: POStatusBadgeProps) {
  const normalized = (status || "DRAFT").toUpperCase()

  const config: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    DRAFT: {
      label: "Draft",
      dot: "bg-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
      text: "text-slate-700 dark:text-slate-300",
    },
    ORDERED: {
      label: "Ordered",
      dot: "bg-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
    },
    IN_TRANSIT: {
      label: "In Transit",
      dot: "bg-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
    },
    PARTIALLY_RECEIVED: {
      label: "Partial",
      dot: "bg-orange-500",
      bg: "bg-orange-500/10 border-orange-500/20",
      text: "text-orange-700 dark:text-orange-300",
    },
    RECEIVED: {
      label: "Received",
      dot: "bg-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    CANCELLED: {
      label: "Cancelled",
      dot: "bg-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-700 dark:text-rose-300",
    },
  }

  const current = config[normalized] || config.DRAFT

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border shadow-none ${current.bg} ${current.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </Badge>
  )
}
