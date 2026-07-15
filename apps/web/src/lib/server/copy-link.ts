import { createDecipheriv, createCipheriv, randomBytes, randomUUID } from 'crypto';
import { sql as pgSql, type SqlFunction } from './pg-sql';

const PROVISIONING =
  'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CF_API =
  process.env.COPYFACTORY_API_URL?.trim() ||
  'https://copyfactory-api-v1.new-york.agiliumtrade.ai';

export const DEFAULT_CF_STRATEGY_ID =
  process.env.COPYFACTORY_STRATEGY_FALLBACK?.trim() || 'Z4kE';

export type Sql = SqlFunction;

export function metaHeaders(token: string) {
  return {
    'auth-token': token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export function decryptAesGcm(payload: string, keyHex: string): string {
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

export function encryptAesGcm(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) throw new Error('AES_MASTER_KEY must be 64 hex chars');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: cipher.getAuthTag().toString('hex'),
  });
}

export async function ensureSubscriberRole(
  token: string,
  metaApiAccountId: string,
): Promise<void> {
  const put = await fetch(
    `${PROVISIONING}/users/current/accounts/${metaApiAccountId}`,
    {
      method: 'PUT',
      headers: metaHeaders(token),
      body: JSON.stringify({
        application: 'CopyFactory',
        copyFactoryRoles: ['SUBSCRIBER'],
      }),
    },
  );
  if (!put.ok) {
    const body = await put.text();
    throw new Error(
      `Failed to enable CopyFactory SUBSCRIBER: ${body || put.status}`,
    );
  }

  const get = await fetch(
    `${PROVISIONING}/users/current/accounts/${metaApiAccountId}`,
    { headers: metaHeaders(token), cache: 'no-store' },
  );
  if (get.ok) {
    const account = await get.json();
    if (account.state !== 'DEPLOYED') {
      await fetch(
        `${PROVISIONING}/users/current/accounts/${metaApiAccountId}/deploy`,
        { method: 'POST', headers: metaHeaders(token) },
      );
    }
  }
}

export async function linkCopyFactorySubscriber(input: {
  token: string;
  metaApiAccountId: string;
  strategyId: string;
  multiplier?: number;
  name?: string;
}): Promise<void> {
  const getRes = await fetch(
    `${CF_API}/users/current/configuration/subscribers/${input.metaApiAccountId}`,
    { headers: metaHeaders(input.token), cache: 'no-store' },
  );
  let existing: any = null;
  if (getRes.ok) {
    existing = await getRes.json();
  }

  const subscriptions = Array.isArray(existing?.subscriptions)
    ? existing.subscriptions.filter(
        (s: any) => s.strategyId !== input.strategyId,
      )
    : [];

  subscriptions.push({
    strategyId: input.strategyId,
    multiplier: input.multiplier ?? 1,
    skipPendingOrders: false,
  });

  const putRes = await fetch(
    `${CF_API}/users/current/configuration/subscribers/${input.metaApiAccountId}`,
    {
      method: 'PUT',
      headers: metaHeaders(input.token),
      body: JSON.stringify({
        name:
          input.name ||
          existing?.name ||
          `Profytron ${input.metaApiAccountId.slice(0, 8)}`,
        subscriptions,
      }),
    },
  );
  if (!putRes.ok) {
    const body = await putRes.text();
    throw new Error(`CopyFactory link failed: ${body || putRes.status}`);
  }
}

export async function trackActivation(
  sql: Sql,
  userId: string,
  event: string,
  metadata?: Record<string, unknown>,
) {
  const id = randomUUID();
  const meta = metadata ? JSON.stringify(metadata) : null;
  await sql`
    INSERT INTO "UserActivationEvent" (id, "userId", event, metadata, "createdAt")
    VALUES (${id}, ${userId}, ${event}, ${meta}::jsonb, NOW())
    ON CONFLICT ("userId", event) DO NOTHING
  `;
}

export type LinkResult = {
  subscriptionId: string;
  strategyId: string;
  strategyName: string;
  copyFactoryStrategyId: string;
  metaApiAccountId: string;
  status: 'linked' | 'skipped' | 'error';
  message?: string;
};

/**
 * Professional wiring for every new user:
 * MetaApi SUBSCRIBER role + CopyFactory strategy link + ACTIVE status + sizing defaults.
 */
export async function linkUserCopySubscriptions(input: {
  sql: Sql;
  userId: string;
  metaToken: string;
  aesKey: string;
  subscriptionId?: string;
  strategyId?: string;
}): Promise<LinkResult[]> {
  const { sql, userId, metaToken, aesKey } = input;

  const subs = input.subscriptionId
    ? await sql`
        SELECT
          s.id,
          s.status,
          s."lotMultiplier",
          s."brokerAccountId",
          s."executionProfileJson",
          s."strategyId",
          st.name AS "strategyName",
          st."copyFactoryStrategyId",
          st."masterBrokerAccountId"
        FROM "UserStrategySubscription" s
        JOIN "Strategy" st ON st.id = s."strategyId"
        WHERE s."userId" = ${userId}
          AND s.id = ${input.subscriptionId}
          AND s.status IN ('ACTIVE', 'PROVISIONING')
      `
    : input.strategyId
      ? await sql`
          SELECT
            s.id,
            s.status,
            s."lotMultiplier",
            s."brokerAccountId",
            s."executionProfileJson",
            s."strategyId",
            st.name AS "strategyName",
            st."copyFactoryStrategyId",
            st."masterBrokerAccountId"
          FROM "UserStrategySubscription" s
          JOIN "Strategy" st ON st.id = s."strategyId"
          WHERE s."userId" = ${userId}
            AND s."strategyId" = ${input.strategyId}
            AND s.status IN ('ACTIVE', 'PROVISIONING')
          ORDER BY s."subscribedAt" DESC NULLS LAST
        `
      : await sql`
          SELECT
            s.id,
            s.status,
            s."lotMultiplier",
            s."brokerAccountId",
            s."executionProfileJson",
            s."strategyId",
            st.name AS "strategyName",
            st."copyFactoryStrategyId",
            st."masterBrokerAccountId"
          FROM "UserStrategySubscription" s
          JOIN "Strategy" st ON st.id = s."strategyId"
          WHERE s."userId" = ${userId}
            AND s.status IN ('ACTIVE', 'PROVISIONING')
          ORDER BY s."subscribedAt" DESC NULLS LAST
        `;

  const results: LinkResult[] = [];

  for (const sub of subs) {
    // Non-copy bots (no master) — just mark ACTIVE.
    if (!sub.masterBrokerAccountId) {
      if (sub.status === 'PROVISIONING') {
        await sql`
          UPDATE "UserStrategySubscription"
          SET status = 'ACTIVE'
          WHERE id = ${sub.id}
        `;
      }
      results.push({
        subscriptionId: sub.id,
        strategyId: sub.strategyId,
        strategyName: sub.strategyName,
        copyFactoryStrategyId: '',
        metaApiAccountId: '',
        status: 'skipped',
        message: 'No master account — activated without CopyFactory',
      });
      continue;
    }

    const cfStrategyId =
      (sub.copyFactoryStrategyId as string) || DEFAULT_CF_STRATEGY_ID;

    const brokerRows = sub.brokerAccountId
      ? await sql`
          SELECT id, "credentialsEncrypted", "isActive"
          FROM "BrokerAccount"
          WHERE "userId" = ${userId}
            AND id = ${sub.brokerAccountId}
            AND "isActive" = true
            AND "isPaperTrading" = false
          LIMIT 1
        `
      : await sql`
          SELECT id, "credentialsEncrypted", "isActive"
          FROM "BrokerAccount"
          WHERE "userId" = ${userId}
            AND "isActive" = true
            AND "isPaperTrading" = false
          ORDER BY "isDefault" DESC, "connectedAt" DESC
          LIMIT 1
        `;
    const broker = brokerRows[0];
    if (!broker) {
      results.push({
        subscriptionId: sub.id,
        strategyId: sub.strategyId,
        strategyName: sub.strategyName,
        copyFactoryStrategyId: cfStrategyId,
        metaApiAccountId: '',
        status: 'error',
        message: 'Connect a live MT5 account first',
      });
      continue;
    }

    let creds: any = {};
    try {
      creds = JSON.parse(
        decryptAesGcm(broker.credentialsEncrypted as string, aesKey),
      );
    } catch {
      results.push({
        subscriptionId: sub.id,
        strategyId: sub.strategyId,
        strategyName: sub.strategyName,
        copyFactoryStrategyId: cfStrategyId,
        metaApiAccountId: '',
        status: 'error',
        message: 'Could not decrypt broker credentials',
      });
      continue;
    }

    if (!creds.metaApiAccountId) {
      results.push({
        subscriptionId: sub.id,
        strategyId: sub.strategyId,
        strategyName: sub.strategyName,
        copyFactoryStrategyId: cfStrategyId,
        metaApiAccountId: '',
        status: 'error',
        message: 'Broker is missing MetaApi seat — reconnect MT5',
      });
      continue;
    }

    try {
      await ensureSubscriberRole(metaToken, creds.metaApiAccountId);
      await linkCopyFactorySubscriber({
        token: metaToken,
        metaApiAccountId: creds.metaApiAccountId,
        strategyId: cfStrategyId,
        multiplier: Number(sub.lotMultiplier ?? 1) || 1,
        name: `${creds.login || 'user'} Profytron`,
      });

      // Persist professional defaults on the subscription + creds.
      const profile =
        typeof sub.executionProfileJson === 'object' &&
        sub.executionProfileJson != null
          ? sub.executionProfileJson
          : {};
      const nextProfile = {
        ...profile,
        sizingMode: (profile as any).sizingMode || 'MULTIPLIER',
        copyFactoryLinked: true,
        copyFactoryStrategyId: cfStrategyId,
        linkedAt: new Date().toISOString(),
      };

      await sql`
        UPDATE "UserStrategySubscription"
        SET
          status = 'ACTIVE',
          "brokerAccountId" = ${broker.id},
          "executionProfileJson" = ${JSON.stringify(nextProfile)}::jsonb,
          "lotMultiplier" = COALESCE("lotMultiplier", 1)
        WHERE id = ${sub.id}
      `;

      if (creds.executionMode !== 'metaapi_rpc' || !creds.copyFactoryRole) {
        const enriched = {
          ...creds,
          executionMode: 'metaapi_rpc',
          copyFactoryRole: 'SUBSCRIBER',
        };
        const encrypted = encryptAesGcm(JSON.stringify(enriched), aesKey);
        await sql`
          UPDATE "BrokerAccount"
          SET "credentialsEncrypted" = ${encrypted}
          WHERE id = ${broker.id}
        `;
      }

      // Ensure Strategy row has CF id for future users.
      if (!sub.copyFactoryStrategyId) {
        await sql`
          UPDATE "Strategy"
          SET "copyFactoryStrategyId" = ${cfStrategyId}
          WHERE id = ${sub.strategyId} AND "copyFactoryStrategyId" IS NULL
        `;
      }

      await trackActivation(sql, userId, 'FIRST_MARKETPLACE_SUB', {
        strategyId: sub.strategyId,
        copyFactoryStrategyId: cfStrategyId,
      });

      results.push({
        subscriptionId: sub.id,
        strategyId: sub.strategyId,
        strategyName: sub.strategyName,
        copyFactoryStrategyId: cfStrategyId,
        metaApiAccountId: creds.metaApiAccountId,
        status: 'linked',
      });
    } catch (e: any) {
      results.push({
        subscriptionId: sub.id,
        strategyId: sub.strategyId,
        strategyName: sub.strategyName,
        copyFactoryStrategyId: cfStrategyId,
        metaApiAccountId: creds.metaApiAccountId,
        status: 'error',
        message: e?.message || 'CopyFactory link failed',
      });
    }
  }

  return results;
}

export function createSql(): Sql {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) throw new Error('DATABASE_URL is not configured');
  return pgSql(dbUrl);
}
