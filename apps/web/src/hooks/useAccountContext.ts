'use client';

import { useQuery } from '@tanstack/react-query';
import { brokerApi } from '@/lib/api/broker';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export type BrokerAccountSummary = {
  id: string;
  brokerName: string;
  accountNumberLast4: string;
  isPaperTrading: boolean;
  isDefault: boolean;
  initialEquity?: number | null;
  balance?: number | null;
  equity?: number | null;
  margin?: number | null;
  freeMargin?: number | null;
  currency?: string | null;
  connectionStatus?: string | null;
  liveSynced?: boolean;
};

export function useAccountContext() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = isAuthenticated && !isHydrating && Boolean(accessToken);

  const brokerAccountsQuery = useQuery({
    queryKey: ['broker-accounts'],
    queryFn: () => brokerApi.getBrokerAccounts(),
    staleTime: 8_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  const accounts = (brokerAccountsQuery.data ?? []) as BrokerAccountSummary[];
  const defaultAccount =
    accounts.find((a) => a.isDefault) ?? accounts[0] ?? null;
  const hasBrokerAccount = accounts.length > 0;
  const isPaper = defaultAccount?.isPaperTrading ?? false;

  return {
    brokerAccountsQuery,
    accounts,
    defaultAccount,
    hasBrokerAccount,
    isPaper,
    isLoading: brokerAccountsQuery.isPending,
  };
}
