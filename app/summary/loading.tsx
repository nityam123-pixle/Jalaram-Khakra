import { PageHeaderSkeleton, ChartsSkeleton, ActivityFeedSkeleton } from "@/components/ui/skeleton-layouts"
import { Skeleton } from "@/components/ui/skeleton"

export default function SummaryLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeaderSkeleton />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <ChartsSkeleton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <div className="col-span-4">
          <ActivityFeedSkeleton count={6} />
        </div>
        <div className="col-span-3">
          <ActivityFeedSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}
