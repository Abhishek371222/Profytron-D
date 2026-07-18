'use client';

import { useQuery } from '@tanstack/react-query';
import { brokerApi } from '@/lib/api/broker';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { persistDashboardQuery } from '@/lib/queries/dashboard-cache';

const ACCOUNT_CONTEXT_REFRESH_MS = 10_000;

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
  sharedAccess?: boolean;
};

function normalizeAccounts(raw: unknown): BrokerAccountSummary[] {
  if (Array.isArray(raw)) return raw as BrokerAccountSummary[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
    return (raw as any).data as BrokerAccountSummary[];
  }
  return [];
}

export function useAccountContext() {
  const sessionReady = useAuthStore((s) => s.sessionReady);

  const brokerAccountsQuery = useQuery({
    queryKey: ['broker-accounts'],
    queryFn: async () => {
      const raw = await brokerApi.getBrokerAccounts();
      persistDashboardQuery(['broker-accounts'], raw);
      return normalizeAccounts(raw);
    },
    staleTime: ACCOUNT_CONTEXT_REFRESH_MS,
    refetchInterval: ACCOUNT_CONTEXT_REFRESH_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (count, err: any) => {
      const status = err?.response?.status;
      if (status === 401 || status === 403) return count < 2;
      return count < 1;
    },
    retryDelay: (attempt) => 600 * (attempt + 1),
    enabled: sessionReady,
  });

  const accounts = normalizeAccounts(brokerAccountsQuery.data);
  const ownedAccounts = accounts.filter((a) => !a.sharedAccess);
  const defaultAccount =
    ownedAccounts.find((a) => a.isDefault) ?? ownedAccounts[0] ?? null;
  const hasBrokerAccount = ownedAccounts.length > 0;
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
