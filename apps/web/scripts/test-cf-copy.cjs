const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const env = fs.readFileSync(path.join(__dirname, '../../../render.env'), 'utf8');
const get = (k) =>
  env.split(/\r?\n/).find((l) => l.startsWith(k + '='))?.slice(k.length + 1);

function decrypt(payload, keyHex) {
  const parsed = JSON.parse(payload);
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(parsed.encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

const token = get('METAAPI_TOKEN');
const sql = neon(get('DATABASE_URL'));
const aes = get('AES_MASTER_KEY');

const masterId = '789f8612-bded-470e-a5a1-6626c3c48f04';
const subId = 'ac010ea8-d527-4984-bba9-d7e148ee2892';
const region = 'london';
const host = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;

async function meta(path, opts = {}) {
  const res = await fetch(`${host}${path}`, {
    ...opts,
    headers: {
      'auth-token': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

(async () => {
  console.log('Placing test BUY 0.01 XAUUSD on master...');
  const trade = await meta(
    `/users/current/accounts/${masterId}/trade`,
    {
      method: 'POST',
      body: JSON.stringify({
        actionType: 'ORDER_TYPE_BUY',
        symbol: 'XAUUSD',
        volume: 0.01,
      }),
    },
  );
  console.log('master trade result', trade);

  for (let i = 1; i <= 12; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const [mPos, sPos] = await Promise.all([
      meta(`/users/current/accounts/${masterId}/positions`),
      meta(`/users/current/accounts/${subId}/positions`),
    ]);
    const mIds = (mPos || []).map((p) => p.id);
    const sIds = (sPos || []).map((p) => p.id);
    console.log(
      `[${i}] master=${mIds.join(',')} sub=${sIds.join(',')} mCount=${mIds.length} sCount=${sIds.length}`,
    );
    if (trade?.stringCode || trade?.orderId) {
    }
  }
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
