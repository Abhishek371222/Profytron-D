#!/usr/bin/env node
/**
 * Capture HTTP latency for probeable GET routes (and curated public POSTs skipped by default).
 */
import {
  loadEnv,
  ensureDirs,
  writeJson,
  readJson,
  request,
  tokens,
  apiBase,
} from './lib.mjs';

loadEnv();
ensureDirs();

const SAMPLES = Number(process.env.API_AUDIT_SAMPLES || 3);
const LIMIT = Number(process.env.API_AUDIT_LIMIT || 0);
const inventory = readJson('endpoints.json');
if (!inventory) {
  console.error('Run inventory.mjs first');
  process.exit(1);
}

const tok = tokens();
let routes = inventory.endpoints.filter((e) => e.probeable);
// Prefer safe list endpoints; skip path params with :id unless substituted
routes = routes.filter((e) => !e.path.includes(':'));
if (LIMIT > 0) routes = routes.slice(0, LIMIT);

const results = [];
const base = apiBase();

// Reachability — /health may be 503 when a dependency is down; still treat as up
const health = await request('GET', '/health');
const statusProbe = await request('GET', '/v1');
const reachable =
  (Boolean(health.status) && !health.error) ||
  (Boolean(statusProbe.status) && !statusProbe.error);

for (const ep of routes) {
  const needAdmin = ep.auth === 'admin';
  const needAuth = ep.auth !== 'public';
  const token = needAdmin ? tok.admin : needAuth ? tok.user : '';
  if (needAuth && !token) {
    results.push({
      method: ep.method,
      path: ep.path,
      module: ep.module,
      auth: ep.auth,
      skipped: true,
      reason: needAdmin ? 'no COMPAT_ADMIN_JWT/AUDIT_JWT' : 'no AUDIT_JWT',
    });
    continue;
  }
  if (!reachable) {
    results.push({
      method: ep.method,
      path: ep.path,
      module: ep.module,
      auth: ep.auth,
      skipped: true,
      reason: 'API unreachable',
    });
    continue;
  }

  const samples = [];
  for (let i = 0; i < SAMPLES; i++) {
    samples.push(await request(ep.method, ep.path, { token }));
  }
  const ok = samples.filter((s) => s.status && s.status < 500);
  const ms = ok.map((s) => s.ms).sort((a, b) => a - b);
  results.push({
    method: ep.method,
    path: ep.path,
    module: ep.module,
    auth: ep.auth,
    samples: samples.map((s) => ({
      status: s.status,
      ms: s.ms,
      bytes: s.bytes,
      error: s.error,
    })),
    p50: ms[Math.floor(ms.length / 2)] ?? null,
    min: ms[0] ?? null,
    max: ms[ms.length - 1] ?? null,
    avgBytes: ok.length
      ? Math.round(ok.reduce((a, s) => a + (s.bytes || 0), 0) / ok.length)
      : null,
    lastStatus: samples[samples.length - 1]?.status ?? null,
  });
  const last = results[results.length - 1];
  console.log(`${ep.method} ${ep.path} p50=${last.p50}ms bytes=${last.avgBytes} status=${last.lastStatus}`);
}

const out = {
  at: new Date().toISOString(),
  base,
  reachable,
  health,
  samplesPerRoute: SAMPLES,
  authJwtPresent: Boolean(tok.user),
  adminJwtPresent: Boolean(tok.admin),
  probed: results.filter((r) => !r.skipped).length,
  skipped: results.filter((r) => r.skipped).length,
  results,
};
writeJson('latency.json', out);
console.log(JSON.stringify({ reachable, probed: out.probed, skipped: out.skipped }, null, 2));
