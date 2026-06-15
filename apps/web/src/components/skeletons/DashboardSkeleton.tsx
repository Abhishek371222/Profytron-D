import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 dashboard-stagger">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dashboard-card p-5 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="dashboard-card p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-[340px] w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            <div className="dashboard-card p-5 space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            </div>
            <div className="dashboard-card p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>

        <div className="hidden xl:flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
