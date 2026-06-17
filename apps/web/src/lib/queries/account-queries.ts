import type { QueryClient } from '@tanstack/react-query';

export const ACCOUNT_QUERY_KEYS = [
  'portfolio',
  'wallet-balance',
  'open-trades',
  'dashboard-risk',
  'broker-accounts',
  'broker-equity',
  'my-strategies',
  'activation-progress',
] as const;

export function invalidateAccountQueries(qc: QueryClient) {
  for (const key of ACCOUNT_QUERY_KEYS) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}
