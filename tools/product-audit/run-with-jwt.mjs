#!/usr/bin/env node
/**
 * Mint lab AUDIT_JWT / COMPAT_ADMIN_JWT from JWT_ACCESS_SECRET + DB users,
 * then run product-audit (does not print token values).
 *
 * Usage: node tools/product-audit/run-with-jwt.mjs
 * Env: PRODUCT_AUDIT_BASE; skip mint when AUDIT_JWT already set.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadEnv, ROOT, tokens } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv();

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64url');
}

/** Minimal HS256 JWT (matches Nest JwtService default for access tokens). */
function signHs256(payload, secret, expiresInSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function parseExpiresSeconds(raw, fallback = 86400) {
  if (!raw) return fallback;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = String(raw).match(/^(\d+)([smhd])$/i);
  if (!m) return fallback;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === 's') return n;
  if (u === 'm') return n * 60;
  if (u === 'h') return n * 3600;
  if (u === 'd') return n * 86400;
  return fallback;
}

async function mintPair() {
  const existing = tokens();
  if (existing.user) {
    return {
      user: existing.user,
      admin: existing.admin || existing.user,
      source: 'env',
    };
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET missing — cannot mint AUDIT_JWT');
  }

  const require = createRequire(path.join(ROOT, 'apps/api/package.json'));
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    const user =
      (await prisma.user.findFirst({
        where: {
          deletedAt: null,
          isActive: true,
          isSuspended: false,
          role: 'USER',
        },
        select: { id: true, email: true, role: true },
        orderBy: { createdAt: 'asc' },
      })) ||
      (await prisma.user.findFirst({
        where: { deletedAt: null, isActive: true, isSuspended: false },
        select: { id: true, email: true, role: true },
        orderBy: { createdAt: 'asc' },
      }));

    const admin =
      (await prisma.user.findFirst({
        where: {
          deletedAt: null,
          isActive: true,
          isSuspended: false,
          role: 'ADMIN',
        },
        select: { id: true, email: true, role: true },
        orderBy: { createdAt: 'asc' },
      })) || user;

    if (!user) {
      throw new Error('No active user in DB to mint AUDIT_JWT');
    }

    const expiresIn = parseExpiresSeconds(process.env.JWT_ACCESS_EXPIRES, 86400);
    const sign = (u) =>
      signHs256(
        {
          sub: u.id,
          email: u.email,
          role: u.role,
          jti: crypto.randomUUID(),
        },
        secret,
        expiresIn,
      );

    return {
      user: sign(user),
      admin: sign(admin),
      source: 'minted',
      userRole: user.role,
      adminRole: admin.role,
      userIdPrefix: String(user.id).slice(0, 8),
      adminIdPrefix: String(admin.id).slice(0, 8),
    };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

const pair = await mintPair();
const env = {
  ...process.env,
  AUDIT_JWT: pair.user,
  COMPAT_ADMIN_JWT: pair.admin,
};

console.log(
  JSON.stringify({
    ok: true,
    jwtSource: pair.source,
    hasUserJwt: Boolean(pair.user),
    hasAdminJwt: Boolean(pair.admin),
    userIdPrefix: pair.userIdPrefix || null,
    adminIdPrefix: pair.adminIdPrefix || null,
    note: 'Token values not logged',
  }),
);

const r = spawnSync(process.execPath, [path.join(__dirname, 'run-all.mjs')], {
  stdio: 'inherit',
  cwd: ROOT,
  env,
});
process.exit(r.status || 0);
