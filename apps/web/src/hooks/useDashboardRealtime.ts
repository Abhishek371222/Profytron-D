'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateAccountQueries } from '@/lib/queries/account-queries';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { acquireTradingSocket, onTradingEvent } from '@/lib/realtime/trading-socket';

/** Subscribes to trading WebSocket events and invalidates dashboard queries in real time. */
export function useDashboardRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  React.useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const release = acquireTradingSocket(token);

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
      onTradingEvent('emergency_stop_triggered', () => {
        invalidate('open-trades', 'portfolio', 'dashboard-risk');
      }),
      onTradingEvent('strategy_activated', () => invalidate('my-strategies')),
      onTradingEvent('new_notification', () => invalidate('notifications-unread')),
    ];

    return () => {
      unsubs.forEach((off) => off());
      release();
    };
  }, [enabled, isAuthenticated, queryClient]);
}
