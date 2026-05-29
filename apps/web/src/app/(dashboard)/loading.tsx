import React from 'react';

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/[0.04] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent ${className ?? ''}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-5 pb-10 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.015] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Shimmer className="w-10 h-10 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <Shimmer className="h-7 w-48 rounded-xl" />
              <Shimmer className="h-4 w-72 rounded-lg" />
            </div>
          </div>
          <Shimmer className="h-9 w-24 rounded-xl shrink-0" />
        </div>
        <div className="mt-4 flex gap-2">
          {['w-10', 'w-12', 'w-12', 'w-14', 'w-10', 'w-10'].map((w, i) => (
            <Shimmer key={i} className={`h-8 ${w} rounded-xl`} />
          ))}
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Shimmer className="h-3 w-20 rounded-lg" />
              <Shimmer className="w-8 h-8 rounded-xl" />
            </div>
            <Shimmer className="h-8 w-28 rounded-xl" />
            <Shimmer className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-5 space-y-4">
          <div className="space-y-1.5">
            <Shimmer className="h-3 w-24 rounded-lg" />
            <Shimmer className="h-5 w-40 rounded-xl" />
          </div>
          <Shimmer className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-5 space-y-3">
          <div className="space-y-1.5">
            <Shimmer className="h-3 w-24 rounded-lg" />
            <Shimmer className="h-5 w-36 rounded-xl" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-[14px] border border-white/[0.04]">
              <Shimmer className="h-3 w-28 rounded-lg" />
              <Shimmer className="h-4 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
