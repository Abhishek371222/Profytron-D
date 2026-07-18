'use client';

import React from 'react';
import { OverviewMetricCards } from '@/components/dashboard/overview/OverviewMetricCards';
import { OverviewOpenPositions } from '@/components/dashboard/overview/OverviewOpenPositions';
import { OverviewRecentTrades } from '@/components/dashboard/overview/OverviewRecentTrades';
import { OverviewAccountHealth } from '@/components/dashboard/overview/OverviewAccountHealth';
import {
  OverviewMarketWatch,
  type WatchTab,
} from '@/components/dashboard/overview/OverviewMarketWatch';
import { OverviewEconomicCalendar } from '@/components/dashboard/overview/OverviewEconomicCalendar';
import { OverviewMarketNews } from '@/components/dashboard/overview/OverviewMarketNews';
import { OverviewQuickActions } from '@/components/dashboard/overview/OverviewQuickActions';
import {
  useLiveMarketFeed,
  isFakeNestQuote,
  type SupportedSymbol,
} from '@/hooks/useLiveMarketFeed';
import type { MarketNewsCategory } from '@/lib/api/market';

function useQuoteMap() {
  const { quotes, isLoading } = useLiveMarketFeed(
    ['BTCUSDT', 'EURUSD', 'XAUUSD'] as SupportedSymbol[],
    { enabled: true, allowFallback: false },
  );
  const quoteMap = React.useMemo(() => {
    const next: Record<string, { price: number; change24hPct: number }> = {};
    for (const [key, q] of Object.entries(quotes)) {
      if (!q) continue;
      if (isFakeNestQuote(key, q.price, q.source)) continue;
      next[key] = { price: q.price, change24hPct: q.change24hPct };
    }
    return next;
  }, [quotes]);
  return { quoteMap, quotesLoading: isLoading && Object.keys(quoteMap).length === 0 };
}

/** Memo boundaries — equity props must not remount sibling modules. */
export const MetricsModule = React.memo(OverviewMetricCards);
export const RecentTradesModule = React.memo(OverviewRecentTrades);
export const RiskModule = React.memo(OverviewAccountHealth);
export const CalendarModule = React.memo(OverviewEconomicCalendar);
export const NewsModule = React.memo(OverviewMarketNews);
export const QuickActionsModule = React.memo(OverviewQuickActions);

type PositionsProps = React.ComponentProps<typeof OverviewOpenPositions>;

export const OpenTradesModule = React.memo(function OpenTradesModule({
  quotes: quotesProp,
  ...rest
}: Omit<PositionsProps, 'quotes'> & { quotes?: PositionsProps['quotes'] }) {
  const { quoteMap } = useQuoteMap();
  return (
    <OverviewOpenPositions quotes={quotesProp ?? quoteMap} {...rest} />
  );
});

type WatchProps = {
  activeTab: WatchTab;
  onTabChange: (tab: WatchTab) => void;
  loading?: boolean;
};

export const MarketWatchModule = React.memo(function MarketWatchModule({
  activeTab,
  onTabChange,
  loading,
}: WatchProps) {
  const { quoteMap, quotesLoading } = useQuoteMap();
  return (
    <OverviewMarketWatch
      quotes={quoteMap}
      activeTab={activeTab}
      onTabChange={onTabChange}
      loading={loading ?? quotesLoading}
    />
  );
});

export type { WatchTab, MarketNewsCategory };
