import { NextResponse } from 'next/server';
import { fetchLiveQuotes } from '@/lib/server/live-market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    const quotes = await fetchLiveQuotes();
    return NextResponse.json({
      success: true,
      data: quotes,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || 'Failed to load quotes',
        message: e?.message || 'Failed to load quotes',
      },
      { status: 502 },
    );
  }
}
