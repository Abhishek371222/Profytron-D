import { Skeleton } from '@/components/ui/skeleton';

export function WalletSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <Skeleton className="h-3 w-32" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="dashboard-card p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="flex flex-wrap gap-2 p-4 border-b border-[var(--card-border)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[var(--card-border)] last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="dashboard-card p-5 space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
