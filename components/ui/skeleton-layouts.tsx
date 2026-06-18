import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[120px] mb-2" />
            <Skeleton className="h-3 w-[150px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton({ columns = 5, rows = 10 }: { columns?: number, rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <div className="border-b bg-muted/50 p-4">
          <div className="flex justify-between gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full max-w-[150px]" />
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4 p-4 border-b last:border-0">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full max-w-[150px]" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
    </div>
  )
}

export function MetricCardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full mb-1" />
            <Skeleton className="h-6 w-[60px]" />
            <Skeleton className="h-3 w-[80px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="pl-2">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-4 w-[250px]" />
      </CardHeader>
      <CardContent className="space-y-8">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-4 w-[80px] ml-auto font-medium" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>
      <Skeleton className="h-10 w-[120px]" />
    </div>
  )
}
