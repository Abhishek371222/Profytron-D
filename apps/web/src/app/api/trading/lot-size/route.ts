import { NextRequest } from 'next/server';
import {
  computeLotSize,
  error,
  json,
  loadLiveBroker,
  metaGetAccountInfo,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

/**
 * Lot size calculator for ~$100 accounts.
 * POST { masterVolume, masterEquity?, multiplier?, mode?, fixedLot?, skipIfBelowMin? }
 */
export async function POST(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  let body: {
    masterVolume?: number;
    masterEquity?: number;
    followerEquity?: number;
    multiplier?: number;
    mode?: 'FIXED' | 'MULTIPLIER' | 'EQUITY_RATIO' | 'BALANCE';
    fixedLot?: number;
    minLot?: number;
    maxLot?: number;
    skipIfBelowMin?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  const masterVolume = Number(body.masterVolume);
  if (!Number.isFinite(masterVolume) || masterVolume <= 0) {
    return error('masterVolume must be a positive number', 400);
  }

  try {
    const live = await loadLiveBroker(userId);
    let followerEquity = body.followerEquity;
    let balance: number | null = null;
    let leverage: number | null = null;

    if (live && (followerEquity == null || followerEquity <= 0)) {
      const info = await metaGetAccountInfo(live);
      followerEquity = Number(info.equity || info.balance || 0);
      balance = Number(info.balance || 0);
      leverage = Number(info.leverage || 0) || null;
    }

    const mode = body.mode || 'EQUITY_RATIO';
    const result = computeLotSize({
      mode,
      masterVolume,
      multiplier: body.multiplier ?? 1,
      fixedLot: body.fixedLot,
      masterEquity: body.masterEquity,
      followerEquity: followerEquity ?? undefined,
      minLot: body.minLot,
      maxLot: body.maxLot,
      skipIfBelowMin: body.skipIfBelowMin ?? true,
    });

    return json({
      mode,
      masterVolume,
      masterEquity: body.masterEquity ?? null,
      followerEquity: followerEquity ?? null,
      balance,
      leverage,
      multiplier: body.multiplier ?? 1,
      rawVolume: Number(result.raw.toFixed(6)),
      volume: result.volume,
      skipped: result.skipped,
      reason: result.reason ?? null,
      note:
        mode === 'EQUITY_RATIO' || mode === 'BALANCE'
          ? 'Sized to your equity vs master — safe for ~$100 accounts'
          : null,
    });
  } catch (e: any) {
    return error(e?.message || 'Lot calculation failed', 500);
  }
}
