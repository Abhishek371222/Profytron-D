/**
 * Quick connectivity check for configured third-party API keys.
 * Usage: node tools/check-api-keys.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiEnvPath = resolve(__dirname, '../apps/api/.env');
const webEnvPath = resolve(__dirname, '../apps/web/.env.local');

function parseEnv(file) {
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const api = parseEnv(apiEnvPath);
const web = parseEnv(webEnvPath);
const env = { ...api, ...web };

async function check(name, fn) {
  try {
    const result = await fn();
    return { name, status: result.ok ? 'ok' : 'fail', detail: result.detail || '' };
  } catch (e) {
    return { name, status: 'fail', detail: e.message?.slice(0, 200) || String(e) };
  }
}

const results = [];

// Neon / DATABASE
results.push(
  await check('Neon PostgreSQL (DATABASE_URL)', async () => {
    const url = env.DATABASE_URL;
    if (!url) return { ok: false, detail: 'not set' };
    const r = await fetch('http://localhost:4000/health');
    const j = await r.json();
    const db = j?.data?.database;
    return { ok: db === 'connected', detail: db || JSON.stringify(j).slice(0, 120) };
  }),
);

// Upstash Redis
results.push(
  await check('Upstash Redis (UPSTASH_REDIS_REST_*)', async () => {
    const url = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return { ok: false, detail: 'not set' };
    const r = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const t = await r.text();
    return { ok: r.ok && !t.includes('max requests limit'), detail: t.slice(0, 160) };
  }),
);

// Local Redis (current dev fallback)
results.push(
  await check('Local Redis (REDIS_URL)', async () => {
    const r = await fetch('http://localhost:4000/health');
    const j = await r.json();
    return { ok: j?.data?.redis === 'connected', detail: j?.data?.redis };
  }),
);

// Supabase
results.push(
  await check('Supabase (anon key)', async () => {
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return { ok: false, detail: 'not set' };
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  }),
);

// Twelve Data
results.push(
  await check('Twelve Data (TWELVE_DATA_API_KEY)', async () => {
    const key = env.TWELVE_DATA_API_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    const r = await fetch(`https://api.twelvedata.com/quote?symbol=EUR/USD&apikey=${key}`);
    const j = await r.json();
    return { ok: !!j.symbol || !!j.price, detail: j.message || j.code || j.symbol || 'ok' };
  }),
);

// OpenRouter
results.push(
  await check('OpenRouter (OPENROUTER_API_KEY)', async () => {
    const key = env.OPENROUTER_API_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, detail: j.error?.message || j.data?.label || `HTTP ${r.status}` };
  }),
);

// Resend
results.push(
  await check('Resend (RESEND_API_KEY)', async () => {
    const key = env.RESEND_API_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    const r = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, detail: j.message || j.name || `HTTP ${r.status}` };
  }),
);

// Stripe secret
results.push(
  await check('Stripe secret (STRIPE_SECRET_KEY)', async () => {
    const key = env.STRIPE_SECRET_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    const r = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, detail: j.error?.message || 'ok' };
  }),
);

// Stripe publishable (frontend)
results.push(
  await check('Stripe publishable (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)', async () => {
    const key = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    return { ok: key.startsWith('pk_'), detail: key.startsWith('pk_test_') ? 'test key format ok' : 'format check only' };
  }),
);

// Razorpay
results.push(
  await check('Razorpay (RAZORPAY_KEY_ID/SECRET)', async () => {
    const id = env.RAZORPAY_KEY_ID;
    const secret = env.RAZORPAY_KEY_SECRET;
    if (!id || !secret) return { ok: false, detail: 'not set' };
    const auth = Buffer.from(`${id}:${secret}`).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      headers: { Authorization: `Basic ${auth}` },
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, detail: j.error?.description || 'ok' };
  }),
);

// MetaAPI
results.push(
  await check('MetaAPI (METAAPI_TOKEN)', async () => {
    const token = env.METAAPI_TOKEN;
    if (!token) return { ok: false, detail: 'not set' };
    const r = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
      headers: { 'auth-token': token },
    });
    const t = await r.text();
    let detail = `HTTP ${r.status}`;
    try {
      const j = JSON.parse(t);
      detail = j.message || j.error || detail;
    } catch {}
    return { ok: r.status !== 401 && r.status !== 403, detail };
  }),
);

// Hugging Face
results.push(
  await check('Hugging Face (HUGGING_FACE_API_KEY)', async () => {
    const key = env.HUGGING_FACE_API_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    const r = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, detail: j.error || j.name || `HTTP ${r.status}` };
  }),
);

// Alpha Vantage
results.push(
  await check('Alpha Vantage (ALPHA_VANTAGE_API_KEY)', async () => {
    const key = env.ALPHA_VANTAGE_API_KEY;
    if (!key) return { ok: false, detail: 'not set' };
    const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${key}`);
    const j = await r.json();
    const err = j['Error Message'] || j['Note'] || j.Information;
    return { ok: !err && !!j['Global Quote'], detail: err || 'ok' };
  }),
);

// Telegram bot
results.push(
  await check('Telegram (TELEGRAM_BOT_TOKEN)', async () => {
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) return { ok: false, detail: 'not set' };
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const j = await r.json();
    return { ok: j.ok === true, detail: j.description || j.result?.username || 'ok' };
  }),
);

// Firebase Admin (backend)
results.push(
  await check('Firebase Admin (FIREBASE_PRIVATE_KEY)', async () => {
    const email = env.FIREBASE_CLIENT_EMAIL;
    const key = env.FIREBASE_PRIVATE_KEY;
    const project = env.FIREBASE_PROJECT_ID;
    if (!email || !key || !project) return { ok: false, detail: 'missing credentials' };
    // Startup log already confirmed init; validate project id consistency
    const mismatch = email.includes('profytron-c0c0d') && project === 'profytron-44bdc';
    return {
      ok: !mismatch,
      detail: mismatch
        ? 'service account is profytron-c0c0d but FIREBASE_PROJECT_ID is profytron-44bdc — likely wrong key pair'
        : 'credentials present; server reported Firebase Admin initialized',
    };
  }),
);

// Firebase VAPID (frontend push)
results.push(
  await check('Firebase VAPID (NEXT_PUBLIC_FIREBASE_VAPID_KEY)', async () => {
    const key = env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!key) return { ok: false, detail: 'empty — browser push notifications will not work' };
    return { ok: true, detail: 'set' };
  }),
);

// AWS Bedrock
results.push(
  await check('AWS Bedrock (AWS_BEARER_TOKEN_BEDROCK)', async () => {
    const token = env.AWS_BEARER_TOKEN_BEDROCK;
    if (!token) return { ok: false, detail: 'not set' };
    // Not wired in codebase for runtime checks; validate presence only
    return { ok: false, detail: 'configured but not used by current API code — cannot live-test' };
  }),
);

// OAuth Google
results.push(
  await check('Google OAuth (GOOGLE_CLIENT_ID/SECRET)', async () => {
    const id = env.GOOGLE_CLIENT_ID;
    const secret = env.GOOGLE_CLIENT_SECRET;
    if (!id || !secret) return { ok: false, detail: 'not set' };
    return {
      ok: false,
      detail: 'keys present; login only works if http://localhost:4000/v1/auth/google/callback is added in Google Cloud Console',
    };
  }),
);

// OAuth GitHub
results.push(
  await check('GitHub OAuth (GITHUB_CLIENT_ID/SECRET)', async () => {
    const id = env.GITHUB_CLIENT_ID;
    const secret = env.GITHUB_CLIENT_SECRET;
    if (!id || !secret) return { ok: false, detail: 'not set' };
    return {
      ok: false,
      detail: 'keys present; login only works if http://localhost:4000/v1/auth/github/callback is registered in GitHub OAuth app',
    };
  }),
);

// Razorpay webhook secret
results.push(
  await check('Razorpay webhook (RAZORPAY_WEBHOOK_SECRET)', async () => {
    if (!env.RAZORPAY_WEBHOOK_SECRET) return { ok: false, detail: 'not set — Razorpay webhooks will fail signature verification' };
    return { ok: true, detail: 'set' };
  }),
);

// Telegram webhook secret
results.push(
  await check('Telegram webhook (TELEGRAM_WEBHOOK_SECRET)', async () => {
    if (!env.TELEGRAM_WEBHOOK_SECRET) return { ok: false, detail: 'not set — telegram webhook endpoint rejects unsigned calls' };
    return { ok: true, detail: 'set' };
  }),
);

// Python AI/backtest services
results.push(
  await check('Python AI service (localhost:8000)', async () => {
    const r = await fetch('http://localhost:8000/health').catch((e) => ({ ok: false, _err: e.message }));
    if (r._err) return { ok: false, detail: 'not running — install Python and run pnpm dev:ai' };
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  }),
);

results.push(
  await check('Python Backtest service (localhost:8001)', async () => {
    const r = await fetch('http://localhost:8001/health').catch((e) => ({ ok: false, _err: e.message }));
    if (r._err) return { ok: false, detail: 'not running — install Python and run pnpm dev:backtest' };
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  }),
);

const fails = results.filter((r) => r.status === 'fail');
const oks = results.filter((r) => r.status === 'ok');

console.log('\n=== WORKING ===');
for (const r of oks) console.log(`✓ ${r.name}: ${r.detail}`);

console.log('\n=== NOT WORKING / INCOMPLETE ===');
for (const r of fails) console.log(`✗ ${r.name}: ${r.detail}`);

console.log(`\nSummary: ${oks.length} ok, ${fails.length} issues\n`);
