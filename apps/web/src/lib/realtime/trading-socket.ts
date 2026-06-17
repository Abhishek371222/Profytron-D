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
    'emergency_stop_triggered',
    'strategy_activated',
    'new_notification',
    'transaction_update',
  ] as const;

  for (const event of tradeEvents) {
    sock.on(event, (payload: unknown) => dispatchEvent(event, payload));
  }
}

function connectSocket(token: string) {
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
  });
  activeToken = token;
  bindSocketEvents(socket);

  socket.on('connect', () => {
    socket?.emit('subscribe_prices');
  });

  return socket;
}

/** Acquire a shared trading socket reference. Returns release function. */
export function acquireTradingSocket(token: string): () => void {
  refCount += 1;
  connectSocket(token);
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && socket) {
      socket.emit('unsubscribe_prices');
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      activeToken = null;
    }
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
