import { NextResponse } from 'next/server';
import { fetchLiveQuotes } from '@/lib/server/live-market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

export async function GET() {
  try {
    const quotes = await fetchLiveQuotes();
    return noStore({
      success: true,
      data: quotes,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return noStore(
      {
        success: false,
        error: e?.message || 'Failed to load quotes',
        message: e?.message || 'Failed to load quotes',
      },
      502,
    );
  }
}
