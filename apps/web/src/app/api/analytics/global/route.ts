import { NextRequest } from 'next/server';
import {
  error,
  isMetaApiUnauthorized,
  json,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';
import { loadClosedTradesForRange } from '@/lib/server/metaapi-deals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

type MacroEvent = { event: string; impact: string; timestamp: string };

async function fetchMacroEvents(): Promise<MacroEvent[]> {
  try {
    const res = await fetch(
      'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      { cache: 'no-store', signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      title?: string;
      impact?: string;
      date?: string;
      country?: string;
    }>;
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((r) => r.title && r.date)
      .slice(0, 12)
      .map((r) => {
        const impactRaw = String(r.impact || 'Low').toLowerCase();
        const impact =
          impactRaw.includes('high') || impactRaw === '3'
            ? 'HIGH'
            : impactRaw.includes('med') || impactRaw === '2'
              ? 'MEDIUM'
              : 'LOW';
        return {
          event: `${r.country ? `${r.country} · ` : ''}${r.title}`,
          impact,
          timestamp: new Date(r.date!).toISOString(),
        };
      });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  try {
    const packed = await loadClosedTradesForRange(userId, '3m');
    const closed = packed?.closed ?? [];
    const depositBase = packed?.depositBase ?? 1;
    const liveEquity = packed?.liveEquity ?? 0;

    // Symbol rotation from real closed trades (replaces fake $1M sector rows).
    const bySymbol = new Map<
      string,
      { pnls: number[]; netPnl: number }
    >();
    for (const t of closed) {
      const cur = bySymbol.get(t.symbol) || { pnls: [], netPnl: 0 };
      cur.pnls.push(t.profit);
      cur.netPnl += t.profit;
      bySymbol.set(t.symbol, cur);
    }

    const sectorRotation = [...bySymbol.entries()]
      .map(([symbol, v]) => {
        const wins = v.pnls.filter((p) => p > 0).length;
        const winRate = v.pnls.length ? (wins / v.pnls.length) * 100 : 0;
        let peak = 0;
        let eq = 0;
        let dd = 0;
        for (const p of v.pnls) {
          eq += p;
          peak = Math.max(peak, eq);
          dd = Math.max(dd, peak > 0 ? ((peak - eq) / peak) * 100 : 0);
        }
        const mean =
          v.pnls.reduce((a, b) => a + b, 0) / Math.max(1, v.pnls.length);
        const variance =
          v.pnls.reduce((a, b) => a + (b - mean) ** 2, 0) /
          Math.max(1, v.pnls.length - 1);
        const std = Math.sqrt(variance);
        const sharpe = std > 1e-9 ? mean / std : 0;
        return {
          strategyId: symbol,
          netPnl: Number(v.netPnl.toFixed(2)),
          sharpeRatio: Number(sharpe.toFixed(2)),
          drawdown: Number(dd.toFixed(2)),
          winRate: Number(winRate.toFixed(1)),
        };
      })
      .sort((a, b) => b.netPnl - a.netPnl)
      .slice(0, 8);

    const totalPnL = closed.reduce((s, t) => s + t.profit, 0);
    const winRate =
      closed.length > 0
        ? (closed.filter((t) => t.profit > 0).length / closed.length) * 100
        : 0;
    // Regime from live account edge (only when closed trades exist).
    let label = 'UNKNOWN';
    let confidence = 0;
    if (closed.length > 0) {
      const edgePct = depositBase > 0 ? (totalPnL / depositBase) * 100 : 0;
      label =
        edgePct > 5 && winRate >= 55
          ? 'TRENDING'
          : edgePct < -5
            ? 'RISK-OFF'
            : 'RANGING';
      confidence = Math.min(
        95,
        Math.max(35, 50 + Math.abs(edgePct) * 1.5 + (winRate - 50) * 0.4),
      );
    }

    const macroEvents = await fetchMacroEvents();

    // Personal leaderboard row from this account (no fake million-dollar peers).
    const leaderboard = closed.length
      ? [
          {
            rank: 1,
            userId: userId,
            username: 'You',
            avatarUrl: null as string | null,
            totalPnl: Number(totalPnL.toFixed(2)),
            totalTrades: closed.length,
          },
        ]
      : [];

    return json({
      marketRegime: {
        label,
        confidence: Number(confidence.toFixed(2)),
      },
      sectorRotation,
      macroEvents,
      leaderboard,
      liveEquity: Number(liveEquity.toFixed(2)),
      source: 'metaapi',
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load global analytics';
    console.error('[analytics/global]', message);
    return json({
      marketRegime: { label: 'UNKNOWN', confidence: 0 },
      sectorRotation: [],
      macroEvents: [],
      leaderboard: [],
      source: 'error',
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message,
    });
  }
}
