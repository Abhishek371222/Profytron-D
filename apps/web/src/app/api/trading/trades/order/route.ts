import { NextRequest } from 'next/server';
import {
  computeLotSize,
  error,
  json,
  loadLiveBroker,
  metaGetAccountInfo,
  metaTrade,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  let body: {
    symbol?: string;
    side?: string;
    volume?: number;
    stopLoss?: number;
    takeProfit?: number;
    masterVolume?: number;
    masterEquity?: number;
    sizingMode?: 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO' | 'BALANCE';
    multiplier?: number;
  };
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const symbol = String(body.symbol || '').trim().toUpperCase();
  const side = String(body.side || '').toUpperCase();
  if (!symbol) return error('symbol is required', 400);
  if (side !== 'BUY' && side !== 'SELL') {
    return error('side must be BUY or SELL', 400);
  }

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return error('No live MetaApi broker connected', 400);

    let volume = body.volume != null ? Number(body.volume) : NaN;

    if ((!Number.isFinite(volume) || volume <= 0) && body.masterVolume != null) {
      const info = await metaGetAccountInfo(live);
      const sized = computeLotSize({
        mode: body.sizingMode || 'EQUITY_RATIO',
        masterVolume: Number(body.masterVolume),
        multiplier: body.multiplier ?? 1,
        masterEquity: body.masterEquity ?? undefined,
        followerEquity: Number(info.equity || info.balance || 0),
        skipIfBelowMin: true,
      });
      if (sized.skipped || sized.volume == null) {
        return error(sized.reason || 'Lot size below minimum — order skipped', 422);
      }
      volume = sized.volume;
    }

    if (!Number.isFinite(volume) || volume < 0.01) {
      return error('volume must be >= 0.01 lots', 400);
    }
    volume = Number(Math.max(0.01, volume).toFixed(2));

    const result = await metaTrade(live, {
      actionType: side === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
      symbol,
      volume,
      ...(body.stopLoss != null ? { stopLoss: Number(body.stopLoss) } : {}),
      ...(body.takeProfit != null ? { takeProfit: Number(body.takeProfit) } : {}),
      comment: 'Profytron manual',
    });

    if (!result.ok) return error(result.message, result.status);
    return json({
      status: 'QUEUED',
      symbol,
      side,
      volume,
      orderId: result.data?.orderId ?? null,
      meta: result.data,
    });
  } catch (e: any) {
    return error(e?.message || 'Order failed', 500);
  }
}
