import { PageHeaderSkeleton } from "@/components/ui/skeleton-layouts"
import { Skeleton } from "@/components/ui/skeleton"

export default function CatalogueLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm">
            <div className="aspect-[4/3] w-full rounded-md bg-muted/50 mb-4 flex items-center justify-center">
              <Skeleton className="h-full w-full rounded-md" />
            </div>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
