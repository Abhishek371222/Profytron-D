import { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { jsonError, jsonOk, userIdFromRequest } from '@/lib/broker/store-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Soft-disconnect a broker account (store-only path on Vercel). */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id: accountId } = await ctx.params;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return jsonError('DATABASE_URL not configured', 503);

  const userId = await userIdFromRequest(req);
  if (!userId) {
    return jsonError('Session expired. Please refresh and log in again.', 401);
  }

  const sql = neon(databaseUrl);
  const rows = (await sql`
    SELECT id FROM "BrokerAccount"
    WHERE id = ${accountId} AND "userId" = ${userId} AND "isActive" = true
    LIMIT 1
  `) as Array<{ id: string }>;

  if (!rows[0]) return jsonError('Account not found', 404);

  await sql`
    UPDATE "BrokerAccount"
    SET "isActive" = false
    WHERE id = ${accountId}
  `;
  await sql`
    UPDATE "UserStrategySubscription"
    SET "brokerAccountId" = null
    WHERE "brokerAccountId" = ${accountId}
  `;

  return jsonOk({ success: true, disconnected: true, accountId });
}
