'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invalidateAccountQueries, BROKER_ACCOUNTS_KEY } from '@/lib/queries/account-queries';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  acquireTradingSocket,
  onTradingEvent,
  reconnectTradingSocket,
} from '@/lib/realtime/trading-socket';
import {
  acquireAccountSnapshotSocket,
  onSnapshotUpdate,
  reconnectAccountSnapshotSocket,
  type SnapshotUpdatePayload,
} from '@/lib/realtime/account-snapshot-socket';

export function useDashboardRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  React.useEffect(() => {
    if (!enabled || !isAuthenticated || !accessToken) return;

    const release = acquireTradingSocket(accessToken);
    const releaseSnapshot = acquireAccountSnapshotSocket(accessToken);

    const invalidate = (() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return (...keys: string[]) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
        }, 400);
      };
    })();

    const unsubs = [
      onTradingEvent('trade_opened', () => invalidateAccountQueries(queryClient)),
      onTradingEvent('trade_closed', () => invalidateAccountQueries(queryClient)),
      onTradingEvent('trade_modified', () => invalidateAccountQueries(queryClient)),
      onTradingEvent('trade_partially_closed', () => invalidateAccountQueries(queryClient)),
      onTradingEvent('trade_failed', (payload) => {
        invalidateAccountQueries(queryClient);
        const reason =
          typeof payload === 'object' &&
          payload !== null &&
          'reason' in payload &&
          typeof (payload as { reason?: string }).reason === 'string'
            ? (payload as { reason: string }).reason
            : 'Trade execution failed';
        toast.error(reason);
      }),
      onTradingEvent('trade_blocked', (payload) => {
        invalidateAccountQueries(queryClient);
        const reason =
          typeof payload === 'object' &&
          payload !== null &&
          'reason' in payload &&
          typeof (payload as { reason?: string }).reason === 'string'
            ? (payload as { reason: string }).reason
            : 'Trade blocked by risk policy';
        toast.warning(reason);
      }),
      onTradingEvent('emergency_stop_triggered', () => {
        invalidate('open-trades', 'portfolio', 'dashboard-risk', 'copy-subscriptions');
      }),
      onTradingEvent('strategy_activated', () => invalidate('my-strategies', 'copy-subscriptions')),
      onTradingEvent('bot_activated', () => invalidate('my-strategies', 'copy-subscriptions')),
      onTradingEvent('subscription_status_changed', () =>
        invalidate('my-strategies', 'copy-subscriptions', 'marketplace-strategy'),
      ),
      onTradingEvent('new_notification', (payload: any) => {
        invalidate('notifications-unread');
        if (payload && typeof payload === 'object' && payload.title) {
          const isAlert = payload.priority === 'CRITICAL' || payload.priority === 'HIGH' || payload.category === 'SECURITY';
          if (isAlert) {
            toast.warning(payload.title, { description: payload.body?.slice(0, 80) });
          } else {
            toast.info(payload.title, { description: payload.body?.slice(0, 80) });
          }
        }
      }),
      onSnapshotUpdate((payload: SnapshotUpdatePayload) => {
        queryClient.invalidateQueries({
          queryKey: ['account-snapshot-latest', payload.brokerAccountId],
        });
        queryClient.invalidateQueries({
          queryKey: ['account-snapshot-positions', payload.brokerAccountId],
        });
        queryClient.invalidateQueries({
          queryKey: ['account-snapshot-deals', payload.brokerAccountId],
        });
        queryClient.invalidateQueries({
          queryKey: ['account-snapshot-equity-history', payload.brokerAccountId],
        });
        queryClient.invalidateQueries({
          queryKey: ['account-snapshot-performance', payload.brokerAccountId],
        });
        queryClient.invalidateQueries({
          queryKey: ['account-snapshot-risk', payload.brokerAccountId],
        });
        invalidate(
          BROKER_ACCOUNTS_KEY[0],
          'portfolio',
          'open-trades',
          'trade-history',
          'dashboard-risk',
        );
      }),
    ];

    return () => {
      unsubs.forEach((off) => off());
      release();
      releaseSnapshot();
    };
  }, [enabled, isAuthenticated, accessToken, queryClient]);
}

export { reconnectTradingSocket };
export { reconnectAccountSnapshotSocket };
