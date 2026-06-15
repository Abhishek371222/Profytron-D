import { Skeleton } from '@/components/ui/skeleton';

export function MarketplaceSkeleton() {
  return (
    <div className="flex flex-col min-h-[60vh] bg-[#F8F9FE] animate-in fade-in duration-200">
      <Skeleton className="h-3 w-40 mx-5 mt-4" />
      <Skeleton className="h-40 w-full mt-3" />
      <div className="flex flex-1 min-h-0">
        <div className="hidden lg:block w-[292px] border-r border-[var(--card-border)] p-5 space-y-4 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1 p-5 md:p-6 space-y-5">
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-56 rounded-2xl dashboard-card" />
            <Skeleton className="h-56 rounded-2xl dashboard-card" />
          </div>
          <Skeleton className="h-8 w-48" />
          <div className="dashboard-card overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--card-border)]">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
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
