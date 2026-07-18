'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RenderSlot, useRenderVisible } from '@/platform/rendering';

const OverviewPerformance = dynamic(
  () =>
    import('@/components/dashboard/overview/OverviewPerformance').then(
      (m) => ({ default: m.OverviewPerformance }),
    ),
  {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-xl bg-muted/40 animate-pulse" />,
  },
);

type Point = { date: string; equity: number };

type Props = {
  equityCurve: Point[];
  totalReturnPct: number;
  winRate: number;
  totalTrades: number;
  loading?: boolean;
};

/**
 * Chart isolation — viewport-gated; parent equity ticks without remounting Recharts
 * when props are referentially stable.
 */
export const PerformanceChartSlot = React.memo(function PerformanceChartSlot(
  props: Props,
) {
  const { ref, visible } = useRenderVisible({
    rootMargin: '200px',
    initialVisible: true,
  });

  return (
    <div ref={ref} className="h-full min-h-[220px]">
      <RenderSlot
        id="PerformanceChartSlot"
        active={visible}
        placeholder={
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-[var(--card-border)] bg-card text-xs text-muted-foreground">
            Chart paused (offscreen)
          </div>
        }
      >
        <OverviewPerformance {...props} />
      </RenderSlot>
    </div>
  );
});
