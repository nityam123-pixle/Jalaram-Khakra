import { PageHeaderSkeleton, MetricCardsSkeleton, ChartsSkeleton } from "@/components/ui/skeleton-layouts"

export default function InventoryLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeaderSkeleton />
      <MetricCardsSkeleton count={8} />
      <div className="mt-8">
        <ChartsSkeleton />
      </div>
    </div>
  )
}
