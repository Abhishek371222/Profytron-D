import { NextRequest } from 'next/server';
import {
  error,
  json,
  loadLiveBroker,
  metaGetPositions,
  metaTrade,
  parsePositionId,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

/** Set SL at current price ± distance (price units). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const { id } = await ctx.params;
  const positionId = parsePositionId(id);
  if (!positionId) return error('Invalid position id', 400);

  let distance: number;
  try {
    const body = await req.json();
    distance = Number(body?.distance);
  } catch {
    return error('Invalid JSON body', 400);
  }
  if (!Number.isFinite(distance) || distance <= 0) {
    return error('distance must be a positive number', 400);
  }

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return error('No live MetaApi broker connected', 400);

    const positions = await metaGetPositions(live);
    const pos = positions.find((p) => String(p.id) === positionId);
    if (!pos) return error('Position not found', 404);

    const current = Number(
      pos.currentPrice || pos.priceCurrent || pos.openPrice || pos.priceOpen || 0,
    );
    const type = String(pos.type || pos.side || '').toUpperCase();
    const isBuy = type.includes('BUY') || type.includes('LONG');
    const stopLoss = isBuy ? current - distance : current + distance;
    const digits = Number(pos.digits ?? 2);

    const result = await metaTrade(live, {
      actionType: 'POSITION_MODIFY',
      positionId,
      stopLoss: Number(stopLoss.toFixed(digits || 2)),
      ...(pos.takeProfit != null ? { takeProfit: Number(pos.takeProfit) } : {}),
    });

    if (!result.ok) return error(result.message, result.status);
    return json({
      status: 'TRAILING_STOP',
      positionId,
      stopLoss,
      distance,
      meta: result.data,
    });
  } catch (e: any) {
    return error(e?.message || 'Trailing stop failed', 500);
  }
}
