import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Primary KPI Cards Skeleton (Row 1) */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="border border-border/80 bg-card rounded-xl p-5 flex flex-col justify-between h-[150px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 my-2" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Secondary Metrics Skeleton (Row 2) */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="border border-border/60 bg-card rounded-xl p-4 flex items-center justify-between gap-3 h-[72px]"
          >
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>

      {/* Filter Container Skeleton */}
      <div className="p-4 bg-card rounded-2xl border border-border/80 space-y-3.5">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <Skeleton className="h-9.5 rounded-xl" />
          <Skeleton className="h-9.5 rounded-xl" />
          <Skeleton className="h-9.5 rounded-xl" />
          <Skeleton className="h-9.5 rounded-xl" />
          <Skeleton className="h-9.5 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b border-border/80 bg-muted/30">
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
