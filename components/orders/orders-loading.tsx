"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function OrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 animate-pulse" />
          <Skeleton className="h-9 w-24 animate-pulse" />
          <Skeleton className="h-9 w-32 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="border border-border/80 bg-card rounded-xl p-5 flex items-center gap-4">
            <Skeleton className="h-11 w-11 rounded-full shrink-0 animate-pulse" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16 animate-pulse" />
              <Skeleton className="h-7 w-20 animate-pulse" />
              <Skeleton className="h-2 w-24 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Insights Strip Skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="border border-border/60 bg-muted/10 rounded-lg p-3.5 flex items-center justify-between">
            <div className="space-y-2 flex-1 mr-2">
              <Skeleton className="h-2 w-14 animate-pulse" />
              <Skeleton className="h-4 w-24 animate-pulse" />
            </div>
            <Skeleton className="h-4 w-4 shrink-0 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="h-16 border border-border/80 bg-card rounded-xl w-full flex items-center px-4 justify-between gap-4">
        <Skeleton className="h-9 flex-1 max-w-md animate-pulse" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 animate-pulse" />
          <Skeleton className="h-9 w-32 animate-pulse" />
          <Skeleton className="h-9 w-36 animate-pulse" />
          <Skeleton className="h-9 w-28 animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b border-border/80 bg-muted/30">
          <Skeleton className="h-5 w-full animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
