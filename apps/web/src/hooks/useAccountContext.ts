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

function normalizeAccounts(raw: unknown): BrokerAccountSummary[] {
  if (Array.isArray(raw)) return raw as BrokerAccountSummary[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
    return (raw as any).data as BrokerAccountSummary[];
  }
  return [];
}

export function useAccountContext() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = isAuthenticated && !isHydrating && Boolean(accessToken);

  const brokerAccountsQuery = useQuery({
    queryKey: ['broker-accounts'],
    queryFn: async () => normalizeAccounts(await brokerApi.getBrokerAccounts()),
    staleTime: 8_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    // After login the cache may be empty — always refetch so Overview gets live MetaAPI values.
    refetchOnMount: true,
    placeholderData: (previous) => previous,
    enabled: sessionReady,
  });

  const accounts = normalizeAccounts(brokerAccountsQuery.data);
  const defaultAccount =
    accounts.find((a) => a.isDefault) ?? accounts[0] ?? null;
  const hasBrokerAccount = accounts.length > 0;
  const isPaper = defaultAccount?.isPaperTrading ?? false;
  const accountsLoading =
    sessionReady &&
    !hasBrokerAccount &&
    (brokerAccountsQuery.isPending ||
      brokerAccountsQuery.isLoading ||
      brokerAccountsQuery.isFetching);

  return {
    brokerAccountsQuery,
    accounts,
    defaultAccount,
    hasBrokerAccount,
    isPaper,
    isLoading: brokerAccountsQuery.isPending,
    accountsLoading,
  };
}
