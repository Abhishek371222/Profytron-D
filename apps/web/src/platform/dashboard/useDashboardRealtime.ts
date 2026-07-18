'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAppSession } from '@/app-core';
import {
  acquireTradingSocket,
  onTradingEvent,
  reconnectTradingSocket,
} from '@/lib/realtime/trading-socket';
import {
  invalidateForTradingEvent,
  applyEquityPatch,
  applyPositionsDelta,
  transitionMt5Sync,
  getMt5SyncState,
} from '@/platform/mt5-sync';
import { lifecycleApi } from '@/platform/lifecycle';
import { metricsApi } from '@/platform/metrics';
import { QueryKeys } from '@/platform/data/query-keys';

/** Platform-owned realtime bridge — deltas first, targeted invalidate fallback. */
export function useDashboardRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken } = useAppSession();

  React.useEffect(() => {
    if (!enabled || !isAuthenticated || !accessToken) return;

    const release = acquireTradingSocket(accessToken);
    const life = lifecycleApi.own(
      'dashboard-trading-socket',
      'websocket',
      release,
    );

    const unsubs = [
      onTradingEvent('trade_opened', () =>
        invalidateForTradingEvent(queryClient, 'trade_opened'),
      ),
      onTradingEvent('trade_closed', () =>
        invalidateForTradingEvent(queryClient, 'trade_closed'),
      ),
      onTradingEvent('trade_modified', () =>
        invalidateForTradingEvent(queryClient, 'trade_modified'),
      ),
      onTradingEvent('trade_partially_closed', () =>
        invalidateForTradingEvent(queryClient, 'trade_partially_closed'),
      ),
      onTradingEvent('trade_failed', (payload) => {
        invalidateForTradingEvent(queryClient, 'trade_failed');
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
        invalidateForTradingEvent(queryClient, 'trade_blocked');
        const reason =
          typeof payload === 'object' &&
          payload !== null &&
          'reason' in payload &&
          typeof (payload as { reason?: string }).reason === 'string'
            ? (payload as { reason: string }).reason
            : 'Trade blocked by risk policy';
        toast.warning(reason);
      }),
      onTradingEvent('emergency_stop_triggered', () =>
        invalidateForTradingEvent(queryClient, 'emergency_stop'),
      ),
      onTradingEvent('strategy_activated', () =>
        invalidateForTradingEvent(queryClient, 'strategy_activated'),
      ),
      onTradingEvent('bot_activated', () =>
        invalidateForTradingEvent(queryClient, 'bot_activated'),
      ),
      onTradingEvent('subscription_status_changed', () =>
        invalidateForTradingEvent(queryClient, 'subscription_status_changed'),
      ),
      onTradingEvent('account_equity', (payload: unknown) => {
        const p = payload as Record<string, unknown> | null;
        if (p && typeof p === 'object') {
          applyEquityPatch(queryClient, {
            balance: Number(p.balance),
            equity: Number(p.equity),
            margin: Number(p.margin),
            freeMargin: Number(p.freeMargin),
            currency: p.currency != null ? String(p.currency) : undefined,
            accountId:
              p.accountId != null
                ? String(p.accountId)
                : p.brokerAccountId != null
                  ? String(p.brokerAccountId)
                  : undefined,
            version:
              typeof p.version === 'number' ? p.version : undefined,
            syncedAt:
              typeof p.syncedAt === 'number' ? p.syncedAt : undefined,
          });
        }
      }),
      onTradingEvent('positions_delta', (payload: unknown) => {
        if (payload && typeof payload === 'object') {
          applyPositionsDelta(
            queryClient,
            payload as Parameters<typeof applyPositionsDelta>[1],
          );
        }
      }),
      onTradingEvent('sync_status', (payload: unknown) => {
        const p = payload as { status?: string } | null;
        const status = p?.status;
        if (status === 'degraded') {
          transitionMt5Sync('degraded', { source: 'socket' });
        } else if (status === 'recovering') {
          transitionMt5Sync('recovering', { source: 'socket' });
        } else if (status === 'fresh' || status === 'synchronizing') {
          transitionMt5Sync(
            status === 'fresh' ? 'fresh' : 'synchronizing',
            { source: 'socket' },
          );
        }
        queryClient.setQueryData(QueryKeys.syncStatus(), getMt5SyncState());
        metricsApi.mark('mt5.sync_status', p);
      }),
      onTradingEvent('account_sync_degraded', () => {
        transitionMt5Sync('degraded', { source: 'socket' });
        invalidateForTradingEvent(queryClient, 'account_sync_degraded');
      }),
      onTradingEvent('new_notification', (payload: any) => {
        invalidateForTradingEvent(queryClient, 'new_notification');
        if (payload && typeof payload === 'object' && payload.title) {
          const isAlert =
            payload.priority === 'CRITICAL' ||
            payload.priority === 'HIGH' ||
            payload.category === 'SECURITY';
          if (isAlert) {
            toast.warning(payload.title, {
              description: payload.body?.slice(0, 80),
            });
          }
        }
      }),
    ];

    reconnectTradingSocket(accessToken);
    transitionMt5Sync('fresh', { source: 'socket' });

    return () => {
      for (const u of unsubs) u();
      life();
    };
  }, [enabled, isAuthenticated, accessToken, queryClient]);
}
