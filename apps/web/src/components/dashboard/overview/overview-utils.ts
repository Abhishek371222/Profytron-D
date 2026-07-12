import { CURRENCY_MAP, type CurrencyInfo } from '@/lib/currency';

function localeForCurrency(currency: string): string {
  const hit = Object.values(CURRENCY_MAP).find((c) => c.code === currency);
  return hit?.locale ?? (currency === 'INR' ? 'en-IN' : 'en-US');
}

/** Convert an amount from one ISO currency into another using USD-relative rates. */
export function convertMoney(
  amount: number,
  fromCode: string,
  to: CurrencyInfo,
): number {
  if (!Number.isFinite(amount)) return 0;
  if (fromCode === to.code) return amount;
  const from = Object.values(CURRENCY_MAP).find((c) => c.code === fromCode);
  const fromRate = from?.rate ?? 1;
  const usd = fromRate > 0 ? amount / fromRate : amount;
  return usd * to.rate;
}

export function formatMoney(
  value: number,
  _currency = 'USD',
  decimals = 2,
): string {
  // Overview money is always USD (MetaAPI account currency for this product).
  const abs = Math.abs(value);
  const locale = localeForCurrency(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
    return `${value < 0 ? '-' : ''}${symbol}${abs.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
}

export function formatSignedMoney(value: number, currency = 'USD'): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatMoney(Math.abs(value), currency)}`;
}

export function formatPct(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function formatSymbol(symbol: string): string {
  const s = symbol.replace('/', '').toUpperCase();
  if (s.length === 6 && /^[A-Z]+$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  if (s === 'BTCUSDT') return 'BTC/USDT';
  if (s === 'XAUUSD') return 'XAU/USD';
  return symbol;
}

export function pnlClass(value: number): string {
  if (value > 0) return 'text-[var(--chart-bull)]';
  if (value < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function normalizeQuoteKey(symbol: string): string {
  return symbol.replace('/', '').replace('-', '').toUpperCase();
}
