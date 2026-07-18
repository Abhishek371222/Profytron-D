import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveQuote, type MarketSymbol } from '@/lib/server/live-market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const SYMBOLS: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD', 'US30', 'NAS100', 'SPX500'];

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

function edgeCached(data: unknown) {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=20',
    },
  });
}

export async function GET(req: NextRequest) {
  const symbol = String(
    req.nextUrl.searchParams.get('symbol') || 'BTCUSDT',
  ).toUpperCase() as MarketSymbol;

  if (!SYMBOLS.includes(symbol)) {
    return noStore({ success: false, error: 'Unsupported symbol' }, 400);
  }

  try {
    const quote = await fetchLiveQuote(symbol);
    return edgeCached({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return noStore(
      {
        success: false,
        error: e?.message || 'Failed to load quote',
        message: e?.message || 'Failed to load quote',
      },
      502,
    );
  }
}
