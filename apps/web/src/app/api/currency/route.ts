import { NextRequest, NextResponse } from 'next/server';
import { CURRENCY_MAP, DEFAULT_CURRENCY, CurrencyInfo } from '@/lib/currency';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  let countryCode = (searchParams.get('country') ?? '').toUpperCase();

  if (!countryCode) {
    countryCode = (req.headers.get('cf-ipcountry') ?? '').toUpperCase();
  }

  if (!countryCode) {
    countryCode = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase();
  }

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
