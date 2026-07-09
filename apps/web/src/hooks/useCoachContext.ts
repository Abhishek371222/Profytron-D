'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthStore } from '@/lib/stores/useAuthStore';

/** Lightweight data hook for Alpha Coach — no WebSockets or market feed. */
export function useCoachContext() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { hasBrokerAccount, defaultAccount } = useAccountContext();

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', '1m'],
    queryFn: () => analyticsApi.getPortfolio('1m'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const openTradesQuery = useQuery({
    queryKey: ['open-trades'],
    queryFn: () => tradingApi.getOpenTrades(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const portfolio = portfolioQuery.data;
  const winRate = portfolio?.winRate ?? 0;
  const openTrades = openTradesQuery.data ?? [];

  return {
    portfolio,
    winRate,
    openTrades,
    hasBrokerAccount,
    defaultAccount,
    isLoading: portfolioQuery.isPending || openTradesQuery.isPending,
    isError: portfolioQuery.isError || openTradesQuery.isError,
  };
}
