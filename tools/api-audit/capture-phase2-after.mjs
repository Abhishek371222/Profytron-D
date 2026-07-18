#!/usr/bin/env node
/**
 * Capture after-metrics for API Phase 2 targeted endpoints.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { request, apiBase, loadEnv, tokens } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/api-audit/phase2/data');

loadEnv();
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = [
  { method: 'GET', path: '/v1/subscriptions/plans', auth: false },
  { method: 'GET', path: '/v1/copy/masters', auth: false },
  { method: 'GET', path: '/health', auth: false },
  { method: 'GET', path: '/v1/market/news', auth: false },
  { method: 'GET', path: '/v1/market/ohlc?symbol=BTCUSDT&timeframe=15m&limit=50', auth: false },
];

const SAMPLES = 5;
const results = [];

for (const ep of TARGETS) {
  const samples = [];
  for (let i = 0; i < SAMPLES; i++) {
    samples.push(await request(ep.method, ep.path));
    // brief pause so health cache / redis cache can engage on subsequent samples
    await new Promise((r) => setTimeout(r, 50));
  }
  const ok = samples.filter((s) => s.status && s.status < 600);
  const ms = ok.map((s) => s.ms).sort((a, b) => a - b);
  results.push({
    ...ep,
    samples: samples.map((s) => ({ status: s.status, ms: s.ms, bytes: s.bytes })),
    p50: ms[Math.floor(ms.length / 2)] ?? null,
    min: ms[0] ?? null,
    max: ms[ms.length - 1] ?? null,
    avgBytes: ok.length
      ? Math.round(ok.reduce((a, s) => a + (s.bytes || 0), 0) / ok.length)
      : null,
    // warm = samples after first (cache expected)
    warmP50: (() => {
      const warm = ok.slice(1).map((s) => s.ms).sort((a, b) => a - b);
      return warm[Math.floor(warm.length / 2)] ?? null;
    })(),
  });
  console.log(ep.path, 'p50', results[results.length - 1].p50, 'warm', results[results.length - 1].warmP50, 'bytes', results[results.length - 1].avgBytes);
}

const out = {
  at: new Date().toISOString(),
  base: apiBase(),
  authJwtPresent: Boolean(tokens().user),
  results,
};
fs.writeFileSync(path.join(OUT, 'after-latency.json'), JSON.stringify(out, null, 2));
console.log('wrote after-latency.json');
