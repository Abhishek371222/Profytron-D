#!/usr/bin/env node
/**
 * WebSocket gateway static inventory + optional live connect smoke.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadEnv,
  ensureDirs,
  writeJson,
  walkTs,
  API_SRC,
  rel,
  apiBase,
  tokens,
} from './lib.mjs';

loadEnv();
ensureDirs();

const gatewayFiles = walkTs(API_SRC).filter((f) => f.endsWith('.gateway.ts'));
const gateways = [];

for (const f of gatewayFiles) {
  const text = fs.readFileSync(f, 'utf8');
  const ns =
    (text.match(/namespace:\s*['"]([^'"]+)['"]/) || [])[1] ||
    (text.match(/@WebSocketGateway\(\s*\{([^}]*)\}/s) || [])[1]?.match(
      /namespace:\s*['"]([^'"]+)['"]/,
    )?.[1] ||
    'default';
  const cors = /cors:\s*\{/.test(text);
  const subscribe = [...text.matchAll(/@SubscribeMessage\(\s*['"]([^'"]+)['"]\s*\)/g)].map(
    (m) => m[1],
  );
  const emits = [
    ...text.matchAll(/\.emit\(\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/server\.to\([^)]*\)\.emit\(\s*['"]([^'"]+)['"]/g),
  ].map((m) => m[1]);
  const uniqueEmits = [...new Set(emits)];
  gateways.push({
    file: rel(f),
    namespace: ns,
    cors,
    clientEvents: subscribe,
    serverEmits: uniqueEmits,
    redisAdapter: true, // wired in main via RedisIoAdapter
  });
}

let live = [];
const base = apiBase();
try {
  // Dynamic import socket.io-client if available
  const { io } = await import('socket.io-client').catch(() => ({ io: null }));
  if (!io) {
    live = [{ skipped: true, reason: 'socket.io-client not installed in root' }];
  } else {
    const tok = tokens();
    for (const g of gateways) {
      const url = `${base.replace(/^http/, 'ws')}`;
      await new Promise((resolve) => {
        const socket = io(url + (g.namespace.startsWith('/') ? g.namespace : `/${g.namespace}`), {
          transports: ['websocket'],
          auth: tok.user ? { token: tok.user } : undefined,
          extraHeaders: tok.user ? { Authorization: `Bearer ${tok.user}` } : {},
          timeout: 5000,
          reconnection: false,
        });
        const timer = setTimeout(() => {
          live.push({
            namespace: g.namespace,
            connected: false,
            error: 'timeout',
          });
          socket.close();
          resolve();
        }, 6000);
        socket.on('connect', () => {
          live.push({ namespace: g.namespace, connected: true, id: socket.id });
          clearTimeout(timer);
          socket.close();
          resolve();
        });
        socket.on('connect_error', (err) => {
          live.push({
            namespace: g.namespace,
            connected: false,
            error: String(err.message || err).slice(0, 200),
          });
          clearTimeout(timer);
          socket.close();
          resolve();
        });
      });
    }
  }
} catch (e) {
  live = [{ skipped: true, reason: String(e.message || e).slice(0, 200) }];
}

writeJson('websockets.json', {
  at: new Date().toISOString(),
  base,
  adapter: 'apps/api/src/adapters/redis-io.adapter.ts',
  gateways,
  live,
});

console.log(JSON.stringify({ gateways: gateways.length, live: live.length }, null, 2));
