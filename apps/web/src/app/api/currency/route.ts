import { NextRequest, NextResponse } from 'next/server';
import { CURRENCY_MAP, DEFAULT_CURRENCY, CurrencyInfo } from '@/lib/currency';

/**
 * GET /api/currency?country=IN
 *
 * Returns the CurrencyInfo for the detected or supplied country.
 * Detection order:
 *   1. `country` query param
 *   2. CF-IPCountry header (Cloudflare)
 *   3. X-Forwarded-For first IP → resolved country (best-effort header scan)
 *   4. DEFAULT_CURRENCY (USD)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // 1. Explicit query param
  let countryCode = (searchParams.get('country') ?? '').toUpperCase();

  // 2. Cloudflare header (populated on Vercel Edge / CF Workers)
  if (!countryCode) {
    countryCode = (req.headers.get('cf-ipcountry') ?? '').toUpperCase();
  }

  // 3. Vercel's x-vercel-ip-country header
  if (!countryCode) {
    countryCode = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase();
  }

  // 4. Accept-Language header as last resort (e.g. "en-IN,en;q=0.9")
  if (!countryCode) {
    const acceptLang = req.headers.get('accept-language') ?? '';
    const match = acceptLang.match(/[a-z]{2}-([A-Z]{2})/);
    if (match) countryCode = match[1].toUpperCase();
  }

  const currency: CurrencyInfo =
    countryCode && countryCode in CURRENCY_MAP
      ? CURRENCY_MAP[countryCode]
      : DEFAULT_CURRENCY;

  return NextResponse.json(
    { country: countryCode || 'US', currency },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    },
  );
}
