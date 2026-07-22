/**
 * Route loading UI for /my-bots — matches page skeleton geometry to limit CLS.
 */
export default function MyBotsLoading() {
  return (
    <div className="space-y-6 pb-8" aria-busy="true" aria-hidden>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-[14px] bg-muted/50" />
          <div className="space-y-2">
            <div className="h-5 w-28 animate-pulse rounded-md bg-muted/50" />
            <div className="h-4 w-56 animate-pulse rounded-md bg-muted/40" />
          </div>
        </div>
        <div className="h-9 w-40 animate-pulse rounded-[var(--radius-button)] bg-muted/50" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[4.75rem] animate-pulse rounded-[16px] border border-[var(--card-border)] bg-muted/40"
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted/40" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="marketplace-skeleton h-52 min-h-[13rem] rounded-[var(--radius-card)]"
          />
        ))}
      </div>
    </div>
  );
}
