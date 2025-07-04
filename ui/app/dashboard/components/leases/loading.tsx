import { Skeleton } from "@/components/ui/skeleton"

export function LeaseLoading() {
  return (
    <div className="space-y-8">
      {/* Header Loading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Main Content Loading */}
      <div className="space-y-6">
        {/* Lease Information Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Rented Rooms Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Documents Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
