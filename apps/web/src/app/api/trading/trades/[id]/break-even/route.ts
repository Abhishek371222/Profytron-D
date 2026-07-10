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

/** Move SL to open price ± optional pip offset. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const { id } = await ctx.params;
  const positionId = parsePositionId(id);
  if (!positionId) return error('Invalid position id', 400);

  let offsetPips = 0;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.offsetPips != null) offsetPips = Number(body.offsetPips) || 0;
  } catch {
    // ignore
  }

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return error('No live MetaApi broker connected', 400);

    const positions = await metaGetPositions(live);
    const pos = positions.find((p) => String(p.id) === positionId);
    if (!pos) return error('Position not found', 404);

    const openPrice = Number(pos.openPrice || pos.priceOpen || 0);
    const type = String(pos.type || pos.side || '').toUpperCase();
    const isBuy = type.includes('BUY') || type.includes('LONG');
    // Rough pip: 0.01 for XAU, 0.0001 for FX — use symbol digits if present
    const digits = Number(pos.digits ?? (String(pos.symbol || '').includes('XAU') ? 2 : 5));
    const pip = digits <= 3 ? 0.01 : 0.0001;
    const offset = offsetPips * pip;
    const stopLoss = isBuy ? openPrice + offset : openPrice - offset;

    const result = await metaTrade(live, {
      actionType: 'POSITION_MODIFY',
      positionId,
      stopLoss: Number(stopLoss.toFixed(digits || 2)),
      ...(pos.takeProfit != null ? { takeProfit: Number(pos.takeProfit) } : {}),
    });

    if (!result.ok) return error(result.message, result.status);
    return json({
      status: 'BREAK_EVEN',
      positionId,
      stopLoss,
      meta: result.data,
    });
  } catch (e: any) {
    return error(e?.message || 'Break-even failed', 500);
  }
}
