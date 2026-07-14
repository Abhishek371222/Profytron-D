'use client';

import { io, type Socket } from 'socket.io-client';

const toWsBaseUrl = (raw?: string): string => {
  const fallback =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000';
  const value = (raw || fallback).trim();
  if (value.startsWith('ws://')) return `http://${value.slice(5)}`;
  if (value.startsWith('wss://')) return `https://${value.slice(6)}`;
  return value;
};

type EventHandler = (payload: unknown) => void;

let socket: Socket | null = null;
let refCount = 0;
let activeToken: string | null = null;
// React Strict Mode double-effects, Fast Refresh remounts, and quick
// component churn cause refCount to bounce 1 -> 0 -> 1 within a tick.
// Without a grace period we'd call socket.disconnect() on a socket whose
// native WebSocket handshake hasn't finished yet — hence the "WebSocket is
// closed before the connection is established" console warning — and then
// immediately reopen a brand new connection for the re-mount.
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
const TEARDOWN_GRACE_MS = 500;

const priceHandlers = new Set<EventHandler>();
const eventHandlers = new Map<string, Set<EventHandler>>();

function dispatchEvent(event: string, payload: unknown) {
  eventHandlers.get(event)?.forEach((handler) => handler(payload));
}

function bindSocketEvents(sock: Socket) {
  sock.on('price_update', (payload: unknown) => {
    priceHandlers.forEach((handler) => handler(payload));
  });

  const tradeEvents = [
    'trade_opened',
    'trade_closed',
    'trade_modified',
    'trade_partially_closed',
    'trade_failed',
    'trade_blocked',
    'emergency_stop_triggered',
    'strategy_activated',
    'new_notification',
  ] as const;

  for (const event of tradeEvents) {
    sock.on(event, (payload: unknown) => dispatchEvent(event, payload));
  }
}

function connectSocket(token: string) {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  if (socket && activeToken === token) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const wsBase = toWsBaseUrl(
    process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BACKEND_URL,
  );

  socket = io(`${wsBase}/trading`, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 12_000,
    // Avoid spamming the console when the API is briefly restarting.
    autoConnect: true,
  });
  activeToken = token;
  bindSocketEvents(socket);

  socket.on('connect', () => {
    socket?.emit('subscribe_prices');
  });

  socket.on('connect_error', () => {
    // Intentionally quiet — Overview still works over HTTP polling.
  });

  return socket;
}

/** Acquire a shared trading socket reference. Returns release function. */
export function acquireTradingSocket(token: string): () => void {
  refCount += 1;
  connectSocket(token);
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount !== 0) return;
    if (disconnectTimer) clearTimeout(disconnectTimer);
    disconnectTimer = setTimeout(() => {
      disconnectTimer = null;
      // A re-acquire within the grace window bumped refCount back up —
      // keep the (possibly still-connecting) socket alive.
      if (refCount !== 0 || !socket) return;
      socket.emit('unsubscribe_prices');
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      activeToken = null;
    }, TEARDOWN_GRACE_MS);
  };
}

export function onPriceUpdate(handler: EventHandler): () => void {
  priceHandlers.add(handler);
  return () => priceHandlers.delete(handler);
}

export function onTradingEvent(event: string, handler: EventHandler): () => void {
  if (!eventHandlers.has(event)) eventHandlers.set(event, new Set());
  eventHandlers.get(event)!.add(handler);
  return () => eventHandlers.get(event)?.delete(handler);
}

export function isTradingSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

/** Reconnect the shared socket when the JWT is rotated (e.g. after refresh). */
export function reconnectTradingSocket(token: string): void {
  if (!token) return;
  if (refCount > 0) {
    connectSocket(token);
  } else {
    activeToken = null;
  }
}
