#!/usr/bin/env node
/**
 * Capture response payload sizes / JSON depth for successful GET probes.
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

function jsonDepth(v, d = 0) {
  if (v === null || typeof v !== 'object') return d;
  if (Array.isArray(v)) {
    if (!v.length) return d + 1;
    return Math.max(...v.slice(0, 20).map((x) => jsonDepth(x, d + 1)));
  }
  const vals = Object.values(v);
  if (!vals.length) return d + 1;
  return Math.max(...vals.slice(0, 40).map((x) => jsonDepth(x, d + 1)));
}

function countNulls(v, acc = { nulls: 0, keys: 0 }) {
  if (v === null) {
    acc.nulls++;
    return acc;
  }
  if (typeof v !== 'object') return acc;
  if (Array.isArray(v)) {
    for (const x of v.slice(0, 50)) countNulls(x, acc);
    return acc;
  }
  for (const [k, x] of Object.entries(v)) {
    acc.keys++;
    if (x === null) acc.nulls++;
    else countNulls(x, acc);
  }
  return acc;
}

const latency = readJson('latency.json');
const tok = tokens();
const results = [];

if (!latency?.reachable) {
  writeJson('payloads.json', {
    at: new Date().toISOString(),
    base: apiBase(),
    note: 'API unreachable — no payload samples',
    results: [],
  });
  console.log('skipped payloads — API unreachable');
  process.exit(0);
}

const candidates = (latency.results || [])
  .filter((r) => !r.skipped && r.lastStatus && r.lastStatus < 400)
  .slice(0, Number(process.env.API_AUDIT_PAYLOAD_LIMIT || 80));

for (const ep of candidates) {
  const token =
    ep.auth === 'admin' ? tok.admin : ep.auth === 'public' ? '' : tok.user;
  const res = await request(ep.method, ep.path, { token });
  const data = res.json?.data !== undefined ? res.json.data : res.json;
  const nullStats = countNulls(data);
  results.push({
    method: ep.method,
    path: ep.path,
    module: ep.module,
    status: res.status,
    bytes: res.bytes,
    contentEncoding: res.contentEncoding,
    topKeys:
      data && typeof data === 'object' && !Array.isArray(data)
        ? Object.keys(data).slice(0, 30)
        : Array.isArray(data)
          ? [`Array(${data.length})`]
          : [],
    jsonDepth: data != null ? jsonDepth(data) : 0,
    nullRatio:
      nullStats.keys > 0 ? +(nullStats.nulls / nullStats.keys).toFixed(3) : null,
    wrapped: Boolean(res.json && 'success' in res.json && 'data' in res.json),
  });
  console.log(ep.path, res.bytes, 'B', 'depth', results[results.length - 1].jsonDepth);
}

results.sort((a, b) => (b.bytes || 0) - (a.bytes || 0));
writeJson('payloads.json', {
  at: new Date().toISOString(),
  base: apiBase(),
  results,
});
console.log(JSON.stringify({ payloads: results.length, largest: results[0]?.path }, null, 2));
