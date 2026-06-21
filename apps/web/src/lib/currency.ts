export interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
  rate: number; // multiplier from USD
}

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  IN: { code: 'INR', symbol: '₹', locale: 'en-IN', rate: 83.5 },
  US: { code: 'USD', symbol: '$', locale: 'en-US', rate: 1 },
  GB: { code: 'GBP', symbol: '£', locale: 'en-GB', rate: 0.79 },
  DE: { code: 'EUR', symbol: '€', locale: 'de-DE', rate: 0.92 },
  FR: { code: 'EUR', symbol: '€', locale: 'fr-FR', rate: 0.92 },
  IT: { code: 'EUR', symbol: '€', locale: 'it-IT', rate: 0.92 },
  ES: { code: 'EUR', symbol: '€', locale: 'es-ES', rate: 0.92 },
  NL: { code: 'EUR', symbol: '€', locale: 'nl-NL', rate: 0.92 },
  AE: { code: 'AED', symbol: 'AED ', locale: 'ar-AE', rate: 3.67 },
  SG: { code: 'SGD', symbol: 'S$', locale: 'en-SG', rate: 1.34 },
  AU: { code: 'AUD', symbol: 'A$', locale: 'en-AU', rate: 1.53 },
  CA: { code: 'CAD', symbol: 'C$', locale: 'en-CA', rate: 1.36 },
  JP: { code: 'JPY', symbol: '¥', locale: 'ja-JP', rate: 149 },
  PK: { code: 'PKR', symbol: '₨', locale: 'en-PK', rate: 278 },
  BD: { code: 'BDT', symbol: '৳', locale: 'en-BD', rate: 109 },
  NG: { code: 'NGN', symbol: '₦', locale: 'en-NG', rate: 1580 },
  ZA: { code: 'ZAR', symbol: 'R', locale: 'en-ZA', rate: 18.7 },
  BR: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', rate: 4.97 },
  MX: { code: 'MXN', symbol: 'MX$', locale: 'es-MX', rate: 17.1 },
  SA: { code: 'SAR', symbol: 'SR', locale: 'ar-SA', rate: 3.75 },
  MY: { code: 'MYR', symbol: 'RM', locale: 'ms-MY', rate: 4.71 },
  TH: { code: 'THB', symbol: '฿', locale: 'th-TH', rate: 35.1 },
  ID: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', rate: 15800 },
  PH: { code: 'PHP', symbol: '₱', locale: 'en-PH', rate: 56.4 },
  KR: { code: 'KRW', symbol: '₩', locale: 'ko-KR', rate: 1325 },
};

export const DEFAULT_CURRENCY: CurrencyInfo = { code: 'USD', symbol: '$', locale: 'en-US', rate: 1 };

export function formatPrice(usdPrice: number, currency: CurrencyInfo): string {
  if (usdPrice === 0) return 'FREE';
  const localPrice = usdPrice * currency.rate;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: currency.code === 'JPY' || currency.code === 'IDR' || currency.code === 'KRW' ? 0 : 0,
    }).format(localPrice);
  } catch {
    return `${currency.symbol}${Math.round(localPrice).toLocaleString()}`;
  }
}
