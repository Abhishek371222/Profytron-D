import { NextRequest } from 'next/server';
import {
  error,
  json,
  loadLiveBroker,
  metaGetPositions,
  metaTrade,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Scope = 'ALL' | 'BUYS' | 'SELLS' | 'PROFITABLE' | 'LOSING';

function isBuy(type: string) {
  const t = String(type || '').toUpperCase();
  return t.includes('BUY') || t.includes('LONG');
}

export async function POST(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  let scope: Scope = 'ALL';
  try {
    const body = await req.json();
    if (body?.scope) scope = String(body.scope).toUpperCase() as Scope;
  } catch {
  }

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return error('No live MetaApi broker connected', 400);

    const positions = await metaGetPositions(live);
    const selected = positions.filter((p) => {
      const profit = Number(p.profit ?? p.unrealizedProfit ?? 0);
      const buy = isBuy(p.type || p.side || '');
      switch (scope) {
        case 'BUYS':
          return buy;
        case 'SELLS':
          return !buy;
        case 'PROFITABLE':
          return profit > 0;
        case 'LOSING':
          return profit < 0;
        case 'ALL':
        default:
          return true;
      }
    });

    const closed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const p of selected) {
      const positionId = String(p.id || '');
      if (!positionId) continue;
      const result = await metaTrade(live, {
        actionType: 'POSITION_CLOSE_ID',
        positionId,
      });
      if (result.ok) closed.push(positionId);
      else failed.push({ id: positionId, error: result.message });
    }

    return json({
      status: closed.length ? 'SUCCESS' : 'NO_OPEN_TRADES',
      scope,
      closedTrades: closed.length,
      closed,
      failed,
    });
  } catch (e: any) {
    return error(e?.message || 'Bulk close failed', 500);
  }
}
