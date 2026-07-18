import { Skeleton } from "@/components/ui/skeleton";

export function JournalSkeleton() {
  return (
    <div className="space-y-5 p-6 animate-in fade-in duration-300">
      { }
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      { }
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-muted/2 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
          </div>

          <Skeleton className="h-16 w-full rounded-xl" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
