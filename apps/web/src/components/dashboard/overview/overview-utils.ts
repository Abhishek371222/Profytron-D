export function formatMoney(
  value: number,
  currency = 'USD',
  decimals = 2,
): string {
  const abs = Math.abs(value);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${value < 0 ? '-' : ''}$${abs.toLocaleString('en-US', {
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
