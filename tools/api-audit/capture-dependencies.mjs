#!/usr/bin/env node
/**
 * Controller → service dependency graph + code scans for cache/rate-limit/pagination.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadEnv,
  ensureDirs,
  writeJson,
  readJson,
  walkTs,
  API_SRC,
  rel,
} from './lib.mjs';

loadEnv();
ensureDirs();

const inventory = readJson('endpoints.json', { controllers: [] });
const edges = [];
const serviceFiles = walkTs(API_SRC).filter((f) => f.endsWith('.service.ts'));
const serviceSizes = serviceFiles.map((f) => {
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n').length;
  const className = (text.match(/export\s+class\s+(\w+)/) || [])[1] || path.basename(f);
  const prismaCalls = (text.match(/this\.prisma\./g) || []).length;
  const redisCalls = (text.match(/this\.redis|redisService|REDIS_CLIENT/g) || []).length;
  return { file: rel(f), className, lines, prismaCalls, redisCalls };
});

for (const c of inventory.controllers || []) {
  for (const inj of c.injects || []) {
    edges.push({
      from: c.controller,
      to: inj.type,
      module: c.module,
    });
  }
}

// Detect services injecting each other (possible cycles — 2-hop heuristic)
const byName = new Map();
for (const s of serviceFiles) {
  const text = fs.readFileSync(s, 'utf8');
  const name = (text.match(/export\s+class\s+(\w+)/) || [])[1];
  if (!name) continue;
  const ctor = text.match(/constructor\s*\(([^)]*)\)/s);
  const deps = [];
  if (ctor) {
    for (const part of ctor[1].split(',')) {
      const m = part.match(/:\s*(\w+)/);
      if (m) deps.push(m[1]);
    }
  }
  byName.set(name, deps);
}
const cycles = [];
for (const [a, deps] of byName) {
  for (const b of deps) {
    if (byName.get(b)?.includes(a)) cycles.push([a, b]);
  }
}

// Cache scan
const cacheHits = [];
for (const f of walkTs(API_SRC)) {
  const text = fs.readFileSync(f, 'utf8');
  if (!/redis|TTL_|setex|\.set\(/i.test(text)) continue;
  const ttls = [...text.matchAll(/const\s+(TTL_[A-Z0-9_]+)\s*=\s*(\d+)/g)].map((m) => ({
    name: m[1],
    seconds: Number(m[2]),
  }));
  const setEx = [...text.matchAll(/['`]EX['`]\s*,\s*(\d+)/g)].map((m) => Number(m[1]));
  if (ttls.length || setEx.length || /cached\(/.test(text)) {
    cacheHits.push({ file: rel(f), ttls, setExSeconds: setEx });
  }
}

// Rate limit scan
const throttleUsages = [];
for (const f of walkTs(API_SRC).filter((x) => x.endsWith('.controller.ts') || x.includes('throttler'))) {
  const text = fs.readFileSync(f, 'utf8');
  if (!/@Throttle|Throttler/.test(text)) continue;
  throttleUsages.push({
    file: rel(f),
    throttles: [...text.matchAll(/@Throttle\(\s*\{([^}]+)\}\s*\)/g)].map((m) =>
      m[1].replace(/\s+/g, ' ').trim(),
    ),
  });
}

// Pagination scan
const pagination = [];
for (const f of serviceFiles.concat(walkTs(API_SRC).filter((x) => x.endsWith('.controller.ts')))) {
  const text = fs.readFileSync(f, 'utf8');
  const hasCursor = /\bcursor\b/.test(text) && (/skip:\s*1/.test(text) || /cursor:/.test(text));
  const hasPage = /\bpage\b/.test(text) && /skip:\s*\(/.test(text);
  const hasTake = /\btake:\s*/.test(text);
  if (hasCursor || hasPage || hasTake) {
    pagination.push({
      file: rel(f),
      cursor: hasCursor,
      offsetPage: hasPage,
      take: hasTake,
    });
  }
}

writeJson('dependencies.json', {
  at: new Date().toISOString(),
  edges,
  edgeCount: edges.length,
  largestServices: serviceSizes.sort((a, b) => b.lines - a.lines).slice(0, 20),
  mutualInjections: cycles,
  cacheHits,
  throttleUsages,
  pagination,
  throttlerDefault: { ttlMs: 60000, limit: 100, authenticatedBump: 1000 },
});

console.log(
  JSON.stringify(
    {
      edges: edges.length,
      services: serviceSizes.length,
      cycles: cycles.length,
      cacheFiles: cacheHits.length,
    },
    null,
    2,
  ),
);
