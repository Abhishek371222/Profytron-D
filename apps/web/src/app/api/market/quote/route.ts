import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveQuote, type MarketSymbol } from '@/lib/server/live-market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const SYMBOLS: MarketSymbol[] = ['BTCUSDT', 'EURUSD', 'XAUUSD'];

export async function GET(req: NextRequest) {
  const symbol = String(
    req.nextUrl.searchParams.get('symbol') || 'BTCUSDT',
  ).toUpperCase() as MarketSymbol;

  if (!SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { success: false, error: 'Unsupported symbol' },
      { status: 400 },
    );
  }

  try {
    const quote = await fetchLiveQuote(symbol);
    return NextResponse.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || 'Failed to load quote',
        message: e?.message || 'Failed to load quote',
      },
      { status: 502 },
    );
  }
}
