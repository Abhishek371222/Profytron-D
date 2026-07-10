/** Realistic OHLC market data: trend → pullback → continuation */
export type Candle = {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export function generateMarketCandles(count = 72): Candle[] {
  const candles: Candle[] = [];
  let price = 2318;

  for (let i = 0; i < count; i++) {
    const phase =
      i < count * 0.35 ? 1.2 : i < count * 0.52 ? -0.85 : i < count * 0.78 ? 1.05 : -0.35;
    const noise = Math.sin(i * 0.7) * 2.4 + Math.cos(i * 0.31) * 1.8;
    const move = phase * (2.8 + Math.random() * 1.2) + noise * 0.4;
    const open = price;
    const close = Math.round((open + move) * 100) / 100;
    const body = Math.abs(close - open);
    const wick = 3 + Math.random() * 5 + body * 0.35;
    const high = Math.max(open, close) + wick * (0.4 + Math.random() * 0.5);
    const low = Math.min(open, close) - wick * (0.35 + Math.random() * 0.45);
    const vol = Math.round(180 + body * 42 + Math.random() * 120);

    candles.push({
      o: Math.round(open * 100) / 100,
      h: Math.round(high * 100) / 100,
      l: Math.round(low * 100) / 100,
      c: Math.round(close * 100) / 100,
      v: vol,
    });
    price = close;
  }

  return candles;
}

export function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export const MARKET_NODES = [
  { id: 'ny', label: 'New York', exchange: 'NYSE', time: '09:30 EST', x: 268, y: 188 },
  { id: 'ld', label: 'London', exchange: 'LSE', time: '08:00 GMT', x: 492, y: 158 },
  { id: 'ff', label: 'Frankfurt', exchange: 'XETRA', time: '09:00 CET', x: 518, y: 168 },
  { id: 'tk', label: 'Tokyo', exchange: 'TSE', time: '09:00 JST', x: 848, y: 182 },
  { id: 'sg', label: 'Singapore', exchange: 'SGX', time: '09:00 SGT', x: 768, y: 278 },
] as const;

export const MARKET_ARCS = [
  { from: 'ny', to: 'ld' },
  { from: 'ld', to: 'ff' },
  { from: 'ld', to: 'tk' },
  { from: 'tk', to: 'sg' },
  { from: 'ny', to: 'sg' },
] as const;

export const BANK_LOGOS = [
  'Citi',
  'Barclays',
  'Goldman Sachs',
  'JP Morgan',
  'Morgan Stanley',
] as const;

export const FEATURE_CARDS = [
  { title: 'Bank-grade Security', desc: '256-bit Encrypted', icon: 'shield' as const },
  { title: '99.99% Uptime', desc: 'Enterprise Reliability', icon: 'activity' as const },
  { title: 'Global Infrastructure', desc: 'Low Latency Everywhere', icon: 'globe' as const },
] as const;

export const TELEMETRY = [
  { label: 'Market Status', value: 'OPEN', icon: 'signal' as const },
  { label: 'Global Latency', value: '4ms', icon: 'zap' as const },
  { label: 'System Uptime', value: '99.99%', icon: 'shield' as const },
] as const;
