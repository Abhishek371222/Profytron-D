import { createDecipheriv } from 'crypto';
import { NextRequest } from 'next/server';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export type LiveBroker = {
  brokerAccountId: string;
  metaApiAccountId: string;
  region: string;
  metaToken: string;
  sql: NeonQueryFunction<false, false>;
};

type Creds = {
  login?: string;
  metaApiAccountId?: string;
  metaApiRegion?: string;
  executionMode?: string;
};

export function json(data: unknown, status = 200) {
  return Response.json(
    { success: status < 400, data, timestamp: new Date().toISOString() },
    { status },
  );
}

export function error(message: string, status = 400) {
  return Response.json(
    {
      success: false,
      statusCode: status,
      error: message,
      message,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function decryptAesGcm(payload: string, keyHex: string): string {
  const parsed = JSON.parse(payload);
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let out = decipher.update(parsed.encrypted, 'hex', 'utf8');
  out += decipher.final('utf8');
  return out;
}

export async function userIdFromRequest(
  req: NextRequest,
): Promise<string | null> {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const backend = (
    process.env.BACKEND_API_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://profytron-api.onrender.com'
  ).replace(/\/$/, '');
  if (!bearer) return null;
  try {
    const meRes = await fetch(`${backend}/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    });
    if (!meRes.ok) return null;
    const body = await meRes.json();
    const user = body?.data ?? body;
    return typeof user?.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

export async function loadLiveBroker(userId: string): Promise<LiveBroker | null> {
  const dbUrl = process.env.DATABASE_URL?.trim();
  const aesKey = process.env.AES_MASTER_KEY?.trim();
  const metaToken = process.env.METAAPI_TOKEN?.trim();
  if (!dbUrl || !aesKey || !metaToken) {
    throw new Error('Trading sync is not configured');
  }
  const sql = neon(dbUrl);
  const rows = await sql`
    SELECT id, "credentialsEncrypted", "isPaperTrading"
    FROM "BrokerAccount"
    WHERE "userId" = ${userId} AND "isActive" = true AND "isPaperTrading" = false
    ORDER BY "isDefault" DESC, "connectedAt" DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  let creds: Creds = {};
  try {
    creds = JSON.parse(
      decryptAesGcm(rows[0].credentialsEncrypted as string, aesKey),
    );
  } catch {
    return null;
  }
  if (!creds.metaApiAccountId) return null;
  return {
    brokerAccountId: rows[0].id as string,
    metaApiAccountId: creds.metaApiAccountId,
    region: creds.metaApiRegion || 'london',
    metaToken,
    sql,
  };
}

export function clientHost(region: string) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

export function metaHeaders(token: string) {
  return {
    'auth-token': token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

/** Accepts `meta:12345`, raw ticket, or UUID-looking ids. */
export function parsePositionId(id: string): string {
  const raw = String(id || '').trim();
  if (raw.startsWith('meta:')) return raw.slice(5);
  return raw;
}

const META_FETCH_MS = 4_000;

export async function metaTrade(
  live: LiveBroker,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: any } | { ok: false; status: number; message: string }> {
  const res = await fetch(
    `${clientHost(live.region)}/users/current/accounts/${live.metaApiAccountId}/trade`,
    {
      method: 'POST',
      headers: metaHeaders(live.metaToken),
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(META_FETCH_MS),
    },
  );
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.stringCode ||
      text ||
      `MetaApi trade failed (${res.status})`;
    return { ok: false, status: res.status >= 400 ? res.status : 502, message };
  }
  return { ok: true, data };
}

export async function metaGetPositions(live: LiveBroker): Promise<any[]> {
  const res = await fetch(
    `${clientHost(live.region)}/users/current/accounts/${live.metaApiAccountId}/positions`,
    {
      headers: metaHeaders(live.metaToken),
      cache: 'no-store',
      signal: AbortSignal.timeout(META_FETCH_MS),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MetaApi positions failed: ${body || res.status}`);
  }
  const positions = await res.json();
  return Array.isArray(positions) ? positions : [];
}

export async function metaGetAccountInfo(live: LiveBroker): Promise<any> {
  const res = await fetch(
    `${clientHost(live.region)}/users/current/accounts/${live.metaApiAccountId}/account-information`,
    {
      headers: metaHeaders(live.metaToken),
      cache: 'no-store',
      signal: AbortSignal.timeout(META_FETCH_MS),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MetaApi account info failed: ${body || res.status}`);
  }
  return res.json();
}

export function isMetaApiUnauthorized(message?: string | null): boolean {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('unauthorized') ||
    m.includes('invalid auth-token') ||
    m.includes('failed to authorize')
  );
}

/** Try stored region first, then common MetaAPI regions. */
export async function withResolvedRegion<T>(
  live: LiveBroker,
  fn: (live: LiveBroker) => Promise<T>,
): Promise<T> {
  const regions = Array.from(
    new Set(
      [live.region, 'london', 'new-york', 'vint-hill', 'singapore'].filter(Boolean),
    ),
  );
  let lastError: Error | null = null;
  for (const region of regions) {
    try {
      return await fn({ ...live, region });
    } catch (e: any) {
      lastError = e instanceof Error ? e : new Error(String(e?.message || e));
      if (isMetaApiUnauthorized(lastError.message)) throw lastError;
    }
  }
  throw lastError || new Error('MetaApi request failed');
}

/** Deterministic lot calculator for ~$100 accounts (equity-ratio safe). */
export function computeLotSize(input: {
  mode?: 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO' | 'BALANCE';
  masterVolume: number;
  multiplier?: number;
  fixedLot?: number;
  masterEquity?: number;
  followerEquity?: number;
  minLot?: number;
  maxLot?: number;
  skipIfBelowMin?: boolean;
}): { volume: number | null; raw: number; skipped: boolean; reason?: string } {
  const minLot = input.minLot ?? 0.01;
  const maxLot = input.maxLot ?? 100;
  const step = 0.01;
  const multiplier = input.multiplier && input.multiplier > 0 ? input.multiplier : 1;
  const masterVolume = input.masterVolume > 0 ? input.masterVolume : 0;

  let raw: number;
  switch (input.mode) {
    case 'FIXED':
      raw = input.fixedLot && input.fixedLot > 0 ? input.fixedLot : minLot;
      break;
    case 'BALANCE':
    case 'EQUITY_RATIO': {
      const masterEq = input.masterEquity ?? 0;
      const followerEq = input.followerEquity ?? 0;
      if (masterVolume > 0 && masterEq > 0 && followerEq > 0) {
        raw = masterVolume * (followerEq / masterEq) * multiplier;
      } else if (masterVolume > 0) {
        raw = masterVolume * multiplier;
      } else {
        raw = minLot;
      }
      break;
    }
    case 'MULTIPLIER':
    default:
      raw = masterVolume > 0 ? masterVolume * multiplier : minLot;
      break;
  }

  const stepped = Math.floor(raw / step) * step;
  const rounded = Number(stepped.toFixed(2));

  if (input.skipIfBelowMin && rounded < minLot) {
    return {
      volume: null,
      raw,
      skipped: true,
      reason: `Scaled lot ${raw.toFixed(4)} is below broker minimum ${minLot}`,
    };
  }

  const volume = Math.min(Math.max(rounded < minLot ? minLot : rounded, minLot), maxLot);
  return { volume: Number(volume.toFixed(2)), raw, skipped: false };
}
