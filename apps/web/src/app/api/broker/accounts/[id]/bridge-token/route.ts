import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';
import {
  decryptAesGcm,
  encryptAesGcm,
  hashBridgeToken,
  jsonError,
  jsonOk,
  mintBridgeToken,
  userIdFromRequest,
} from '@/lib/broker/store-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Rotate bridge EA token for a store-only MT5 account (no MetaApi). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: accountId } = await ctx.params;
  const databaseUrl = process.env.DATABASE_URL;
  const aesKey = process.env.AES_MASTER_KEY;
  if (!databaseUrl || !aesKey) {
    return jsonError('Store-only broker API is not configured', 503);
  }

  const userId = await userIdFromRequest(req);
  if (!userId) {
    return jsonError('Session expired. Please refresh and log in again.', 401);
  }

  const sql = neon(databaseUrl);
  const rows = (await sql`
    SELECT id, "isPaperTrading", "credentialsEncrypted"
    FROM "BrokerAccount"
    WHERE id = ${accountId} AND "userId" = ${userId} AND "isActive" = true
    LIMIT 1
  `) as Array<{
    id: string;
    isPaperTrading: boolean;
    credentialsEncrypted: string;
  }>;

  const account = rows[0];
  if (!account) return jsonError('Account not found', 404);
  if (account.isPaperTrading) {
    return jsonError('Paper accounts do not use a bridge token', 400);
  }

  const bridgeToken = mintBridgeToken();
  const bridgeTokenHash = hashBridgeToken(bridgeToken);

  let creds: Record<string, unknown> = {};
  try {
    creds = JSON.parse(
      decryptAesGcm(account.credentialsEncrypted, aesKey),
    );
  } catch {
    creds = {};
  }
  creds.bridgeToken = bridgeToken;
  creds.executionMode = creds.executionMode ?? 'master_only';
  creds.metaApiAccountId = creds.metaApiAccountId ?? null;

  const credentialsEncrypted = encryptAesGcm(JSON.stringify(creds), aesKey);

  try {
    await sql`
      UPDATE "BrokerAccount"
      SET
        "credentialsEncrypted" = ${credentialsEncrypted},
        "bridgeTokenHash" = ${bridgeTokenHash}
      WHERE id = ${account.id}
    `;
  } catch {
    await sql`
      UPDATE "BrokerAccount"
      SET "credentialsEncrypted" = ${credentialsEncrypted}
      WHERE id = ${account.id}
    `;
  }

  return jsonOk({
    accountId: account.id,
    bridgeToken,
    message:
      'Paste this token into ProfytronCopyBridge. Previous token is revoked.',
  });
}
