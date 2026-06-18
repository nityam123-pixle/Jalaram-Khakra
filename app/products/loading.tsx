import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton-layouts"

export default function ProductsLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <TableSkeleton columns={5} rows={12} />
      </div>
    </div>
  )
}
