import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-[var(--section-gap)] dashboard-stagger">
      <div className="space-y-2">
        <Skeleton className="h-[var(--type-dashboard-title)] w-[clamp(12rem,28vw,16rem)] rounded-lg" />
        <Skeleton className="h-4 w-[clamp(8rem,18vw,12rem)] rounded-md" />
      </div>

      <div className="dashboard-grid-main">
        <div className="space-y-[var(--dashboard-gap)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[var(--dashboard-gap)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dashboard-card p-[var(--card-p)] space-y-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>
          <div className="dashboard-card p-[var(--card-p)] space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="w-full rounded-xl" style={{ height: "var(--chart-h-lg)" }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(15rem,18vw)_1fr] gap-[var(--dashboard-gap)]">
            <div className="dashboard-card p-[var(--card-p)] space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            </div>
            <div className="dashboard-card p-[var(--card-p)] space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>

        <div className="hidden xl:flex flex-col gap-[var(--dashboard-gap)]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="dashboard-card p-[var(--card-p)] space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
