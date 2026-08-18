"use client"

import { Badge } from "@/components/ui/badge"

export type ShipmentStatusType = "PENDING" | "IN_TRANSIT" | "ARRIVED" | "RECEIVING" | "COMPLETED" | "CANCELLED"

interface IncomingStatusBadgeProps {
  status: string
}

export function IncomingStatusBadge({ status }: IncomingStatusBadgeProps) {
  const normalized = (status || "PENDING").toUpperCase()

  const config: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    PENDING: {
      label: "Pending",
      dot: "bg-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
      text: "text-slate-700 dark:text-slate-300",
    },
    IN_TRANSIT: {
      label: "In Transit",
      dot: "bg-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
    },
    ARRIVED: {
      label: "Arrived",
      dot: "bg-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
      text: "text-blue-700 dark:text-blue-300",
    },
    RECEIVING: {
      label: "Receiving",
      dot: "bg-purple-500",
      bg: "bg-purple-500/10 border-purple-500/20",
      text: "text-purple-700 dark:text-purple-300",
    },
    COMPLETED: {
      label: "Completed",
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

  const current = config[normalized] || config.PENDING

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
