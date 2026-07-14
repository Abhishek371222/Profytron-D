import { Skeleton } from "@/components/ui/skeleton";

export function MarketplaceSkeleton() {
  return (
    <div className="flex min-h-[60vh] animate-in fade-in flex-col bg-background duration-200">
      <Skeleton className="mx-[var(--dashboard-p)] mt-4 h-3 w-40" />
      <Skeleton className="mx-[var(--dashboard-p)] mt-4 h-[clamp(12rem,18vw,16rem)] rounded-[var(--radius-card)]" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[clamp(16rem,18vw,18.25rem)] shrink-0 p-4 lg:block">
          <Skeleton className="h-full min-h-[24rem] rounded-[var(--radius-card)]" />
        </div>
        <div className="flex-1 space-y-5 p-[var(--dashboard-p)]">
          {/* Height matches FeaturedRow's real card (min-h-[22rem]) to avoid a
              layout jump when data loads. */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="min-h-[22rem] rounded-[var(--radius-card)]" />
            <Skeleton className="min-h-[22rem] rounded-[var(--radius-card)]" />
          </div>
          <Skeleton className="h-8 w-48" />
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--card-border)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-[var(--card-border)] px-4 py-3 last:border-0">
                <Skeleton className="h-10 w-10 shrink-0 rounded-[12px]" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
