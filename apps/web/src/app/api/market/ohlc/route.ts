import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLiveOhlc,
  type MarketSymbol,
  type MarketTimeframe,
} from '@/lib/server/live-market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SYMBOLS: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'];
const TIMEFRAMES: MarketTimeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

function noStore(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}

export async function GET(req: NextRequest) {
  const symbol = String(
    req.nextUrl.searchParams.get('symbol') || 'BTCUSDT',
  ).toUpperCase() as MarketSymbol;
  const timeframe = String(
    req.nextUrl.searchParams.get('timeframe') || '15m',
  ).toLowerCase() as MarketTimeframe;
  const limit = Number(req.nextUrl.searchParams.get('limit') || 72);

  if (!SYMBOLS.includes(symbol)) {
    return noStore({ success: false, error: 'Unsupported symbol' }, 400);
  }
  if (!TIMEFRAMES.includes(timeframe)) {
    return noStore({ success: false, error: 'Unsupported timeframe' }, 400);
  }

  try {
    const { candles, source } = await fetchLiveOhlc(symbol, timeframe, limit);
    return noStore({
      success: true,
      data: {
        symbol,
        timeframe,
        limit,
        candles,
        source,
        serverTime: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return noStore(
      {
        success: false,
        error: e?.message || 'Failed to load OHLC',
        message: e?.message || 'Failed to load OHLC',
      },
      502,
    );
  }
}
