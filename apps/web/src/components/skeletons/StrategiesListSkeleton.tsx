import { Skeleton } from '@/components/ui/skeleton';

export function StrategiesListSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <Skeleton className="h-3 w-40" />
      <div className="flex justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl hidden sm:block" />
      </div>

      <div className="dashboard-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#0B0F1A] border border-white/[0.08] p-5 space-y-4 min-h-[420px]">
            <div className="flex justify-between">
              <Skeleton className="h-9 w-9 rounded-lg bg-white/10" />
              <Skeleton className="h-6 w-16 rounded bg-white/10" />
            </div>
            <Skeleton className="h-6 w-3/4 bg-white/10" />
            <Skeleton className="h-28 w-full -mx-2 bg-white/5" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-10 bg-white/5" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
