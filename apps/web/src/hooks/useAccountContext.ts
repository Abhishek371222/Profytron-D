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
};

export function useAccountContext() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const brokerAccountsQuery = useQuery({
    queryKey: ['broker-accounts'],
    queryFn: () => brokerApi.getBrokerAccounts(),
    staleTime: 60_000,
    enabled: isAuthenticated,
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
