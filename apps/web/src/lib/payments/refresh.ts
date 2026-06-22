import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate every query a successful payment can affect so the wallet balance,
 * transaction history, monthly summary, dashboard widgets, subscription state,
 * and notifications all refetch immediately — instead of only updating after a
 * hard page reload.
 */
const PAYMENT_AFFECTED_KEYS = [
  'wallet-balance',
  'wallet-transactions',
  'wallet-summary',
  'dashboard-risk',
  'subscription-current',
  'subscription-invoices',
  'subscription-payments',
  'subscriptions',
  'billing-payments',
  'notifications',
  'notifications-count',
];

export async function refreshAfterPayment(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    PAYMENT_AFFECTED_KEYS.map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );
}
