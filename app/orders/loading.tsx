import { PageHeaderSkeleton, KpiCardsSkeleton, TableSkeleton } from "@/components/ui/skeleton-layouts"

export default function OrdersLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeaderSkeleton />
      <KpiCardsSkeleton count={4} />
      <div className="mt-8">
        <TableSkeleton columns={7} rows={10} />
      </div>
    </div>
  )
}
