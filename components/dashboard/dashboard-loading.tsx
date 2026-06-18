"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 animate-pulse" />
          <Skeleton className="h-4 w-80 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-56 animate-pulse" />
          <Skeleton className="h-8.5 w-28 animate-pulse" />
          <Skeleton className="h-8.5 w-24 animate-pulse" />
        </div>
      </div>

      {/* KPI Cards Skeleton (4 columns) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="border border-border/80 bg-card rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-10 rounded-xl animate-pulse" />
              <Skeleton className="h-5 w-14 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 animate-pulse" />
              <Skeleton className="h-7 w-32 animate-pulse" />
              <Skeleton className="h-3 w-24 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Business Health & Insights Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 border border-border/80 bg-card rounded-2xl p-5 space-y-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-28 w-28 rounded-full shrink-0 animate-pulse" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-24 animate-pulse" />
              <Skeleton className="h-3 w-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16 animate-pulse" />
                <Skeleton className="h-2 w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-7 border border-border/80 bg-card rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-36 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Executive Profit Center Skeleton */}
      <div className="border border-border/80 bg-card rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <Skeleton className="h-5 w-44 animate-pulse" />
          <Skeleton className="h-10 w-80 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <Skeleton className="lg:col-span-7 h-[240px] rounded-xl animate-pulse" />
          <div className="lg:col-span-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Command Center Skeleton */}
      <div className="border border-border/80 bg-card rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <Skeleton className="h-5 w-48 animate-pulse" />
          <Skeleton className="h-8 w-36 animate-pulse" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-xl animate-pulse" />
      </div>

      {/* Performers Skeleton */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="border border-border/80 bg-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <Skeleton className="h-5 w-36 animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0 animate-pulse" />
                  <Skeleton className="h-4 flex-1 animate-pulse" />
                  <Skeleton className="h-4 w-12 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
