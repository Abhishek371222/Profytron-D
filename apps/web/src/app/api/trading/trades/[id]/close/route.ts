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

export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const { id } = await ctx.params;
  const positionId = parsePositionId(id);
  if (!positionId) return error('Invalid position id', 400);

  let volume: number | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.volume != null) {
      volume = Number(body.volume);
      if (!Number.isFinite(volume) || volume <= 0) {
        return error('volume must be a positive number', 400);
      }
    }
  } catch {
  }

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return error('No live MetaApi broker connected', 400);

    const result =
      volume != null
        ? await metaTrade(live, {
            actionType: 'POSITION_PARTIAL',
            positionId,
            volume,
          })
        : await metaTrade(live, {
            actionType: 'POSITION_CLOSE_ID',
            positionId,
          });

    if (!result.ok) return error(result.message, result.status);
    return json({
      status: 'CLOSED',
      positionId,
      volume: volume ?? null,
      meta: result.data,
    });
  } catch (e: any) {
    return error(e?.message || 'Close failed', 500);
  }
}
