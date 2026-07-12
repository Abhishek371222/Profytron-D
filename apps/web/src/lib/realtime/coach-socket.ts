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
const eventHandlers = new Map<string, Set<EventHandler>>();

function dispatch(event: string, payload: unknown) {
  eventHandlers.get(event)?.forEach((handler) => handler(payload));
}

function bindSocketEvents(sock: Socket) {
  const events = [
    'message',
    'typing',
    'escalation:new',
    'escalation:claimed',
    'escalation:reply',
    'escalation:resolved',
  ] as const;
  for (const event of events) {
    sock.on(event, (payload: unknown) => dispatch(event, payload));
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

  socket = io(`${wsBase}/coach`, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 12_000,
  });
  activeToken = token;
  bindSocketEvents(socket);
  socket.on('connect_error', () => {
    /* quiet while API restarts */
  });
  return socket;
}

export function acquireCoachSocket(token: string): () => void {
  refCount += 1;
  connectSocket(token);
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      activeToken = null;
    }
  };
}

export function onCoachEvent(event: string, handler: EventHandler): () => void {
  if (!eventHandlers.has(event)) eventHandlers.set(event, new Set());
  eventHandlers.get(event)!.add(handler);
  return () => eventHandlers.get(event)?.delete(handler);
}

export function joinCoachConversation(conversationId: string) {
  socket?.emit('join_conversation', { conversationId });
}

export function emitCoachTyping(conversationId: string, isTyping: boolean) {
  socket?.emit('typing', { conversationId, isTyping });
}
