import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function json(data: unknown, status = 200) {
  return NextResponse.json(
    { success: status < 400, data, timestamp: new Date().toISOString() },
    { status },
  );
}

function error(message: string, status = 400) {
  return NextResponse.json(
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

function userIdFromJwt(token: string): string | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const jsonPayload = Buffer.from(
      part.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    const payload = JSON.parse(jsonPayload) as {
      sub?: string;
      userId?: string;
      id?: string;
      exp?: number;
    };
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    const id = payload.sub || payload.userId || payload.id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

async function userIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!bearer) return null;

  const fromJwt = userIdFromJwt(bearer);
  if (fromJwt) return fromJwt;

  const backend = (
    process.env.BACKEND_API_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://profytron-api.onrender.com'
  ).replace(/\/$/, '');
  try {
    const meRes = await fetch(`${backend}/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (!meRes.ok) return null;
    const body = await meRes.json();
    const user = body?.data ?? body;
    return typeof user?.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

/**
 * Reliable My Bots payload — does not depend on Nest staying healthy.
 * Auto-links orphan subscriptions to the user's default MT4/MT5 and returns
 * real trade PnL (USD), never seed/catalog marketing %.
 */
export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    return error('Database is not configured', 503);
  }

  const sql = neon(dbUrl);

  try {
    // Prefer live MT4/MT5, then any active account.
    const brokers = await sql`
      SELECT id, "brokerName", "accountNumberLast4", "initialEquity", "isPaperTrading"
      FROM "BrokerAccount"
      WHERE "userId" = ${userId} AND "isActive" = true
      ORDER BY
        CASE WHEN "isPaperTrading" = false AND "brokerName" IN ('MT4', 'MT5') THEN 0 ELSE 1 END,
        "isDefault" DESC,
        "connectedAt" DESC
      LIMIT 1
    `;
    const defaultBroker = brokers[0] as
      | {
          id: string;
          brokerName: string;
          accountNumberLast4: string | null;
          initialEquity: number | null;
          isPaperTrading: boolean;
        }
      | undefined;

    if (defaultBroker?.id) {
      await sql`
        UPDATE "UserStrategySubscription"
        SET "brokerAccountId" = ${defaultBroker.id}
        WHERE "userId" = ${userId}
          AND "brokerAccountId" IS NULL
          AND status IN ('ACTIVE', 'PROVISIONING', 'PAUSED')
      `;
    }

    const rows = await sql`
      SELECT
        s.id AS "subscriptionId",
        s.status,
        s."planType",
        s."subscribedAt",
        s."expiresAt",
        s."brokerAccountId",
        st.id,
        st.name,
        st.category,
        st."riskLevel",
        st."monthlyPrice",
        st."annualPrice",
        st."isVerified",
        ba.id AS "ba_id",
        ba."brokerName" AS "ba_brokerName",
        ba."accountNumberLast4" AS "ba_last4",
        ba."initialEquity" AS "ba_initialEquity",
        ba."isPaperTrading" AS "ba_isPaper",
        u."fullName" AS "creator_fullName",
        u.username AS "creator_username"
      FROM "UserStrategySubscription" s
      INNER JOIN "Strategy" st ON st.id = s."strategyId"
      LEFT JOIN "BrokerAccount" ba ON ba.id = s."brokerAccountId"
      LEFT JOIN "User" u ON u.id = st."creatorId"
      WHERE s."userId" = ${userId}
        AND s.status <> 'INACTIVE'
      ORDER BY s."subscribedAt" DESC
    `;

    const strategyIds = rows
      .map((r: any) => r.id as string)
      .filter(Boolean);

    const pnlMap = new Map<string, { net: number; wins: number; closed: number }>();
    if (strategyIds.length > 0) {
      // neon tagged template doesn't expand arrays cleanly for IN — query per-user then filter.
      const trades = await sql`
        SELECT "strategyId", profit, status
        FROM "Trade"
        WHERE "userId" = ${userId}
          AND "strategyId" IS NOT NULL
          AND status IN ('OPEN', 'CLOSED')
      `;
      for (const t of trades as any[]) {
        const sid = t.strategyId as string;
        if (!strategyIds.includes(sid)) continue;
        const row = pnlMap.get(sid) ?? { net: 0, wins: 0, closed: 0 };
        const profit = Number(t.profit ?? 0);
        if (Number.isFinite(profit)) row.net += profit;
        if (t.status === 'CLOSED') {
          row.closed += 1;
          if (profit > 0) row.wins += 1;
        }
        pnlMap.set(sid, row);
      }
    }

    const bots = rows.map((r: any) => {
      const stats = pnlMap.get(r.id) ?? { net: 0, wins: 0, closed: 0 };
      const currentPnlUsd = Number(stats.net.toFixed(2));
      const equityBase = Number(r.ba_initialEquity ?? 0);
      const currentPnlPct =
        equityBase > 0
          ? Number(((currentPnlUsd / equityBase) * 100).toFixed(2))
          : 0;
      const winRate =
        stats.closed > 0
          ? Number(((stats.wins / stats.closed) * 100).toFixed(1))
          : 0;
      const brokerLabel = r.ba_id
        ? r.ba_last4
          ? `${r.ba_brokerName} ••${r.ba_last4}`
          : String(r.ba_brokerName)
        : null;

      return {
        id: r.id,
        name: r.name,
        category: r.category,
        riskLevel: r.riskLevel,
        monthlyPrice: r.monthlyPrice,
        annualPrice: r.annualPrice,
        isVerified: r.isVerified,
        creator: {
          fullName: r.creator_fullName,
          username: r.creator_username,
        },
        subscriptionId: r.subscriptionId,
        status: r.status,
        planType: r.planType ?? 'MONTHLY',
        subscribedAt: r.subscribedAt,
        expiresAt: r.expiresAt ?? undefined,
        currentPnl: currentPnlUsd,
        currentPnlPct,
        pnlUnit: 'usd',
        latestPnl: currentPnlUsd,
        brokerAccount: r.ba_id
          ? {
              id: r.ba_id,
              broker: r.ba_brokerName,
              accountName: brokerLabel,
              last4: r.ba_last4,
              isPaper: r.ba_isPaper,
            }
          : null,
        monthlyFee: r.monthlyPrice ?? 0,
        renewsAt: r.expiresAt ?? undefined,
        nextBillingDate: r.expiresAt ?? undefined,
        autoRenew: true,
        latestPerformance: {
          winRate,
          totalReturn: currentPnlPct,
          netPnl: currentPnlUsd,
        },
        subscription: {
          id: r.subscriptionId,
          status: r.status,
          planType: r.planType ?? 'MONTHLY',
          renewalDate: r.expiresAt ?? undefined,
          startedAt: r.subscribedAt,
          autoRenew: true,
          brokerAccount: brokerLabel,
        },
        botName: r.name,
        brokerName: r.ba_brokerName ?? null,
        accountNumber: r.ba_last4 ?? null,
        pnl: currentPnlUsd,
      };
    });

    return json(bots);
  } catch (e: any) {
    console.error('[strategies/my]', e?.message || e);
    return error(e?.message || 'Failed to load bots', 500);
  }
}
