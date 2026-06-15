'use client';

import React from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const toWsBaseUrl = (raw?: string): string => {
  const fallback = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000';
  const value = (raw || fallback).trim();
  if (value.startsWith('ws://')) return `http://${value.slice(5)}`;
  if (value.startsWith('wss://')) return `https://${value.slice(6)}`;
  return value;
};

/** Subscribes to trading WebSocket events and invalidates dashboard queries in real time. */
export function useDashboardRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  React.useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const wsBase = toWsBaseUrl(process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BACKEND_URL);
    const socket: Socket = io(`${wsBase}/trading`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    const invalidate = (...keys: string[]) => {
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    };

    socket.on('connect', () => {
      socket.emit('subscribe_prices');
    });

    socket.on('trade_opened', () => {
      invalidate('open-trades', 'portfolio', 'dashboard-risk', 'my-strategies');
    });

    socket.on('trade_closed', () => {
      invalidate('open-trades', 'portfolio', 'dashboard-risk', 'wallet-balance');
    });

    socket.on('emergency_stop_triggered', () => {
      invalidate('open-trades', 'portfolio', 'dashboard-risk');
    });

    socket.on('strategy_activated', () => {
      invalidate('my-strategies');
    });

    socket.on('new_notification', () => {
      invalidate('notifications-unread');
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, isAuthenticated, queryClient]);
}
