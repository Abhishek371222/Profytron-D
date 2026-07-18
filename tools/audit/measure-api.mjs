#!/usr/bin/env node
/**
 * PROFYTRON_AUDIT: measure API endpoint latency/payload without modifying app code.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';

const BASE = process.env.API_BASE || 'http://localhost:4000';
const OUT = path.resolve('docs/audit/data/api/endpoint-timings.json');
const TOKEN = process.env.AUDIT_JWT || '';

const ENDPOINTS = [
  { method: 'GET', path: '/health', auth: false },
  { method: 'GET', path: '/v1/market/quotes?symbols=EURUSD,XAUUSD,BTCUSDT', auth: false },
  { method: 'GET', path: '/v1/marketplace/listings?page=1&limit=20', auth: false },
  { method: 'GET', path: '/v1/leaderboard', auth: false },
  { method: 'GET', path: '/v1/analytics/portfolio?range=1m', auth: true },
  { method: 'GET', path: '/v1/trading/trades/open', auth: true },
  { method: 'GET', path: '/v1/trading/trades/closed?limit=20', auth: true },
  { method: 'GET', path: '/v1/broker/accounts', auth: true },
  { method: 'GET', path: '/v1/users/me', auth: true },
  { method: 'GET', path: '/v1/notifications', auth: true },
  { method: 'GET', path: '/v1/wallet', auth: true },
  { method: 'GET', path: '/v1/coach/conversations', auth: true },
];

function request(method, urlPath) {
  const url = new URL(urlPath, BASE);
  const lib = url.protocol === 'https:' ? https : http;
  const headers = { Accept: 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = lib.request(url, { method, headers, timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          ms: +(performance.now() - t0).toFixed(1),
          bytes: buf.length,
          contentEncoding: res.headers['content-encoding'] || null,
          cacheControl: res.headers['cache-control'] || null,
          contentType: res.headers['content-type'] || null,
        });
      });
    });
    req.on('error', (e) => resolve({ status: 0, ms: +(performance.now() - t0).toFixed(1), error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ms: 30000, error: 'timeout' }); });
    req.end();
  });
}

const results = [];
for (const ep of ENDPOINTS) {
  if (ep.auth && !TOKEN) {
    results.push({ ...ep, skipped: true, reason: 'no AUDIT_JWT' });
    continue;
  }
  const samples = [];
  for (let i = 0; i < 3; i++) samples.push(await request(ep.method, ep.path));
  const ok = samples.filter((s) => s.status && s.status < 500);
  const ms = ok.map((s) => s.ms).sort((a, b) => a - b);
  results.push({
    ...ep,
    samples,
    p50: ms[Math.floor(ms.length / 2)] ?? null,
    min: ms[0] ?? null,
    max: ms[ms.length - 1] ?? null,
    avgBytes: ok.length ? Math.round(ok.reduce((a, s) => a + (s.bytes || 0), 0) / ok.length) : null,
  });
  console.log(ep.path, results[results.length - 1].p50, 'ms', results[results.length - 1].avgBytes, 'B');
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
console.log('wrote', OUT);
