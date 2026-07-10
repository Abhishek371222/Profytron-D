import { NextRequest } from 'next/server';
import {
  error,
  json,
  loadLiveBroker,
  metaTrade,
  parsePositionId,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const { id } = await ctx.params;
  const positionId = parsePositionId(id);
  if (!positionId) return error('Invalid position id', 400);

  let body: { stopLoss?: number; takeProfit?: number } = {};
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (body.stopLoss == null && body.takeProfit == null) {
    return error('Provide stopLoss and/or takeProfit', 400);
  }

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return error('No live MetaApi broker connected', 400);

    const result = await metaTrade(live, {
      actionType: 'POSITION_MODIFY',
      positionId,
      ...(body.stopLoss != null ? { stopLoss: Number(body.stopLoss) } : {}),
      ...(body.takeProfit != null ? { takeProfit: Number(body.takeProfit) } : {}),
    });

    if (!result.ok) return error(result.message, result.status);
    return json({
      status: 'MODIFIED',
      positionId,
      stopLoss: body.stopLoss ?? null,
      takeProfit: body.takeProfit ?? null,
      meta: result.data,
    });
  } catch (e: any) {
    return error(e?.message || 'Modify failed', 500);
  }
}
