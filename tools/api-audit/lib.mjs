#!/usr/bin/env node
/**
 * Shared paths/env for API audit Phase 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const OUT_DIR = process.env.API_AUDIT_OUT
  ? path.resolve(process.env.API_AUDIT_OUT)
  : path.join(ROOT, 'docs/api-audit/phase1');
export const DATA = path.join(OUT_DIR, 'data');
export const REPORTS = path.join(OUT_DIR, 'reports');
export const DIAGRAMS = path.join(OUT_DIR, 'diagrams');
export const API_SRC = path.join(ROOT, 'apps/api/src');

export function ensureDirs() {
  for (const d of [OUT_DIR, DATA, REPORTS, DIAGRAMS, path.join(OUT_DIR, 'before')]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

export function loadEnv() {
  for (const p of [path.join(ROOT, 'apps/api/.env'), path.join(ROOT, '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}

export function writeJson(name, obj) {
  ensureDirs();
  const p = path.join(DATA, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

export function readJson(name, fallback = null) {
  const p = path.join(DATA, name);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function apiBase() {
  return (process.env.API_BASE || process.env.AUDIT_API_BASE || 'http://localhost:4000').replace(
    /\/$/,
    '',
  );
}

export function tokens() {
  return {
    user: process.env.AUDIT_JWT || '',
    admin: process.env.COMPAT_ADMIN_JWT || process.env.AUDIT_JWT || '',
  };
}

export function request(method, urlPath, { token, body, timeoutMs = 30000 } = {}) {
  const base = apiBase();
  const url = new URL(urlPath.startsWith('http') ? urlPath : `${base}${urlPath}`);
  const lib = url.protocol === 'https:' ? https : http;
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    payload = typeof body === 'string' ? body : JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = lib.request(url, { method, headers, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let json = null;
        try {
          json = JSON.parse(buf.toString('utf8'));
        } catch {
          /* ignore */
        }
        resolve({
          status: res.statusCode,
          ms: +(performance.now() - t0).toFixed(1),
          bytes: buf.length,
          contentEncoding: res.headers['content-encoding'] || null,
          cacheControl: res.headers['cache-control'] || null,
          contentType: res.headers['content-type'] || null,
          bodyPreview: buf.toString('utf8').slice(0, 400),
          json,
        });
      });
    });
    req.on('error', (e) =>
      resolve({ status: 0, ms: +(performance.now() - t0).toFixed(1), error: e.message }),
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ms: timeoutMs, error: 'timeout' });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

export function walkTs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      walkTs(p, acc);
    } else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.d.ts')) {
      acc.push(p);
    }
  }
  return acc;
}

export function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}
