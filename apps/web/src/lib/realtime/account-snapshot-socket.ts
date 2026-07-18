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

export type SnapshotUpdatePayload = {
  brokerAccountId: string;
  snapshotId: string;
  capturedAt: string;
  syncStatus: string;
  syncDurationMs?: number | null;
  metaApiLatencyMs?: number | null;
  apiVersion?: string | null;
};

type EventHandler = (payload: SnapshotUpdatePayload) => void;

let socket: Socket | null = null;
let refCount = 0;
let activeToken: string | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
const TEARDOWN_GRACE_MS = 500;

const snapshotHandlers = new Set<EventHandler>();

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

  socket = io(`${wsBase}/account-snapshot`, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 12_000,
    autoConnect: true,
  });
  activeToken = token;

  socket.on('snapshot.updated', (payload: SnapshotUpdatePayload) => {
    snapshotHandlers.forEach((handler) => handler(payload));
  });

  return socket;
}

export function acquireAccountSnapshotSocket(token: string): () => void {
  refCount += 1;
  connectSocket(token);
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount !== 0) return;
    if (disconnectTimer) clearTimeout(disconnectTimer);
    disconnectTimer = setTimeout(() => {
      disconnectTimer = null;
      if (refCount !== 0 || !socket) return;
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      activeToken = null;
    }, TEARDOWN_GRACE_MS);
  };
}

export function onSnapshotUpdate(handler: EventHandler): () => void {
  snapshotHandlers.add(handler);
  return () => snapshotHandlers.delete(handler);
}

export function reconnectAccountSnapshotSocket(token: string): void {
  if (!token) return;
  if (refCount > 0) {
    connectSocket(token);
  } else {
    activeToken = null;
  }
}
