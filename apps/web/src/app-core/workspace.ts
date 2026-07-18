'use client';

/**
 * Workspace lifecycle: hydrate → ready → purge on logout.
 * Selected broker account is owned here for product modules.
 */
import { useAccountContext } from '@/hooks/useAccountContext';
import {
  ensureWorkspaceCacheOwner,
  purgeWorkspaceCaches,
} from '@/lib/queries/purge-workspace-caches';
import { getAppSessionSnapshot } from './session';

export function useWorkspace() {
  const ctx = useAccountContext();
  const userId = getAppSessionSnapshot().user?.id;
  return {
    userId,
    selectedAccount: ctx.defaultAccount,
    hasBrokerAccount: ctx.hasBrokerAccount,
    isPaper: ctx.isPaper,
    accounts: ctx.brokerAccountsQuery.data ?? [],
    accountsLoading: ctx.accountsLoading,
    brokerAccountsQuery: ctx.brokerAccountsQuery,
    ensureOwner: () => ensureWorkspaceCacheOwner(userId),
    purge: () => purgeWorkspaceCaches(),
  };
}

export type WorkspaceAccount = NonNullable<
  ReturnType<typeof useWorkspace>['selectedAccount']
>;
