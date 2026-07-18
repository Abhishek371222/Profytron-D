import type { QueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/platform/data/query-keys';
import { createSchedulerApi } from '@/platform/scheduler';
import { metricsApi } from '@/platform/metrics';
import {
  getMt5SyncState,
  subscribeMt5Sync,
  setMt5SyncState,
  transitionMt5Sync,
  type Mt5SyncState,
  type Mt5SyncPhase,
  type SyncStatusLabel,
} from './state-machine';
import { applyEquityDelta, applyPositionsDelta } from './delta';

export type { Mt5SyncState, Mt5SyncPhase, SyncStatusLabel };
export type SyncStatus = SyncStatusLabel;

export {
  getMt5SyncState,
  subscribeMt5Sync,
  setMt5SyncState,
  transitionMt5Sync,
};

export { applyEquityDelta, applyPositionsDelta };

/** Patch equity — versioned delta path (no broker-accounts invalidate). */
export function applyEquityPatch(
  qc: QueryClient,
  patch: {
    balance?: number;
    equity?: number;
    margin?: number;
    freeMargin?: number;
    currency?: string;
    accountId?: string;
    version?: number;
    syncedAt?: number;
  },
) {
  applyEquityDelta(qc, patch);
}

/**
 * Targeted invalidation — only when no versioned delta was applied.
 * Equity / positions prefer setQueryData via delta helpers.
 */
export function invalidateForTradingEvent(
  qc: QueryClient,
  event:
    | 'trade_opened'
    | 'trade_closed'
    | 'trade_modified'
    | 'trade_partially_closed'
    | 'trade_failed'
    | 'trade_blocked'
    | 'emergency_stop'
    | 'strategy_activated'
    | 'bot_activated'
    | 'subscription_status_changed'
    | 'account_equity'
    | 'account_sync_degraded'
    | 'new_notification',
) {
  const sched = createSchedulerApi();
  sched.debounceChannel(
    `trading:${event}`,
    400,
    () => {
      metricsApi.mark('mt5.invalidate', { event });
      switch (event) {
        case 'account_equity':
          // Delta path owns equity; no HTTP refetch.
          break;
        case 'account_sync_degraded':
          transitionMt5Sync('degraded', { source: 'socket' });
          break;
        case 'trade_opened':
        case 'trade_closed':
        case 'trade_modified':
        case 'trade_partially_closed':
        case 'trade_failed':
        case 'trade_blocked':
          // Prefer positions_delta; fall back to open-trades only (not shotgun).
          void qc.invalidateQueries({
            queryKey: QueryKeys.openTrades(),
            refetchType: 'active',
          });
          sched.schedule('mt5:history-reconcile', 'medium', () => {
            void qc.invalidateQueries({
              queryKey: ['trade-history'],
              refetchType: 'active',
            });
          });
          sched.schedule('mt5:risk-reconcile', 'low', () => {
            void qc.invalidateQueries({
              queryKey: QueryKeys.dashboardRisk(),
              refetchType: 'active',
            });
          });
          break;
        case 'emergency_stop':
          void qc.invalidateQueries({ queryKey: QueryKeys.openTrades() });
          void qc.invalidateQueries({ queryKey: QueryKeys.dashboardRisk() });
          break;
        case 'strategy_activated':
        case 'bot_activated':
        case 'subscription_status_changed':
          void qc.invalidateQueries({ queryKey: QueryKeys.myStrategies() });
          void qc.invalidateQueries({ queryKey: ['copy-subscriptions'] });
          break;
        case 'new_notification':
          void qc.invalidateQueries({ queryKey: ['notifications-unread'] });
          break;
      }
    },
    'high',
  );
}

/** Entity-scoped refresh (replaces shotgun invalidateAccountQueries). */
export function scheduleEntityRefresh(
  qc: QueryClient,
  entities: Array<
    'open-trades' | 'trade-history' | 'portfolio' | 'dashboard-risk' | 'broker-accounts'
  >,
  priority: 'critical' | 'high' | 'medium' | 'low' = 'critical',
) {
  const sched = createSchedulerApi();
  transitionMt5Sync('synchronizing', { source: 'api' });
  for (const entity of entities) {
    sched.schedule(
      `refresh:${entity}`,
      priority,
      () => {
        void sched.coalesce(`fetch:${entity}`, async () => {
          const key =
            entity === 'open-trades'
              ? QueryKeys.openTrades()
              : entity === 'dashboard-risk'
                ? QueryKeys.dashboardRisk()
                : entity === 'broker-accounts'
                  ? QueryKeys.brokerAccounts()
                  : [entity];
          await qc.invalidateQueries({ queryKey: key, refetchType: 'active' });
        });
      },
    );
  }
  sched.schedule('refresh:done', priority, () => {
    transitionMt5Sync('fresh', { source: 'api', lastSyncedAt: Date.now() });
  });
}

export const mt5SyncApi = {
  getState: getMt5SyncState,
  subscribe: subscribeMt5Sync,
  setState: setMt5SyncState,
  transition: transitionMt5Sync,
  applyEquityPatch,
  applyEquityDelta,
  applyPositionsDelta,
  invalidateForTradingEvent,
  scheduleEntityRefresh,
};
