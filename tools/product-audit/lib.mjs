#!/usr/bin/env node
/**
 * Shared helpers for Product Excellence Phase 1 (measure-only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const OUT_ROOT = process.env.PRODUCT_AUDIT_OUT
  ? path.resolve(process.env.PRODUCT_AUDIT_OUT)
  : path.join(ROOT, 'docs/product-audit/phase1');
export const DATA = path.join(OUT_ROOT, 'data');
export const REPORTS = path.join(OUT_ROOT, 'reports');
export const JOURNEYS_DIR = path.join(OUT_ROOT, 'journeys');

export function loadEnv() {
  for (const p of [
    path.join(ROOT, 'apps/web/.env.local'),
    path.join(ROOT, 'apps/web/.env'),
    path.join(ROOT, 'apps/api/.env'),
    path.join(ROOT, '.env'),
  ]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let v = m[2];
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}

export function ensureDirs() {
  for (const d of [
    OUT_ROOT,
    DATA,
    REPORTS,
    JOURNEYS_DIR,
    path.join(OUT_ROOT, 'before'),
  ]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

export function webBase() {
  return (
    process.env.PRODUCT_AUDIT_BASE ||
    process.env.WEB_BASE ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function tokens() {
  const user = process.env.AUDIT_JWT || '';
  const admin = process.env.COMPAT_ADMIN_JWT || user;
  return { user, admin };
}

/** Same seed pattern as tools/ui-audit/capture-matrix.mjs */
export function authInitScript() {
  return (t) => {
    try {
      sessionStorage.setItem('profytron_access', t);
      localStorage.setItem(
        'profytron-auth',
        JSON.stringify({
          state: {
            accessToken: t,
            isAuthenticated: true,
            sessionReady: true,
            isHydrating: false,
            user: {
              id: 'product-audit',
              email: 'product-audit@profytron.test',
              onboardingCompleted: true,
              role: 'user',
            },
          },
          version: 0,
        }),
      );
      document.cookie = 'onboarding_completed=1; path=/';
    } catch (_) {}
  };
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

export function loadJourneys() {
  const p = path.join(__dirname, 'journeys.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function slugify(s) {
  return String(s)
    .replace(/^\//, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '') || 'root';
}
