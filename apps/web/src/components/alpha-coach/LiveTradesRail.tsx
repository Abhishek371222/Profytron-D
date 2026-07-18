'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, Radio, X } from 'lucide-react';

type OpenTrade = {
  id?: string;
  symbol?: string;
  direction?: string;
  volume?: number;
  openPrice?: number;
  profit?: number | null;
};

type FeedItem = { id: string; text: string; tone?: 'info' | 'good' | 'warn' };

function RingGauge({
  value,
  max = 100,
  label,
  suffix = '',
  color = '#348398',
}: {
  value: number;
  max?: number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const size = 72;
  const sw = 6;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--card-border)] bg-card px-2 py-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={sw}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: `drop-shadow(0 0 5px color-mix(in srgb, ${color} 35%, transparent))`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums text-foreground">
            {Math.round(value)}
            {suffix}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function LiveTradesRail({
  openTrades,
  winRate,
  periodPnl,
  alphaScore,
  feed,
  hasBrokerAccount,
  onClose,
  onSelectTrade,
  selectedTradeId,
  className,
}: {
  openTrades: OpenTrade[];
  winRate: number;
  periodPnl: number;
  alphaScore: number;
  feed: FeedItem[];
  hasBrokerAccount: boolean;
  onClose?: () => void;
  onSelectTrade?: (id: string) => void;
  selectedTradeId?: string | null;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-card',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-3 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Live desk</p>
          <p className="text-[11px] text-muted-foreground">Account pulse</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Radio className="h-2.5 w-2.5" />
            Live
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted xl:hidden"
              aria-label="Close live desk"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-[var(--card-border)] px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <RingGauge value={alphaScore} label="Alpha" color="#348398" />
          <RingGauge
            value={winRate}
            label="Win rate"
            suffix="%"
            color={winRate >= 55 ? '#348398' : '#973336'}
          />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-muted/40 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Period P&L</span>
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              periodPnl >= 0 ? 'text-[#348398]' : 'text-[#973336]',
            )}
          >
            {periodPnl >= 0 ? '+' : '-'}$
            {Math.abs(periodPnl).toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-[var(--card-border)] px-3 py-3">
          <p className="mb-2 text-xs font-semibold text-foreground">
            Open trades ({openTrades.length})
          </p>
          {!hasBrokerAccount && (
            <p className="rounded-xl border border-[var(--card-border)] bg-muted/30 px-3 py-2.5 text-[12px] leading-snug text-muted-foreground">
              Connect a broker to stream live positions into this desk.
            </p>
          )}
          {hasBrokerAccount && openTrades.length === 0 && (
            <p className="rounded-xl border border-[var(--card-border)] bg-muted/30 px-3 py-2.5 text-[12px] leading-snug text-muted-foreground">
              No open positions right now.
            </p>
          )}
          <ul className="space-y-1.5">
            {openTrades.slice(0, 10).map((t, i) => {
              const pnl = t.profit ?? 0;
              const tid = t.id || `${t.symbol}-${i}`;
              const selected = Boolean(t.id && selectedTradeId === t.id);
              return (
                <motion.li
                  key={tid}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'rounded-xl border bg-card px-3 py-2',
                    selected
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-[var(--card-border)]',
                    onSelectTrade && t.id ? 'cursor-pointer hover:bg-muted/40' : '',
                  )}
                  onClick={() => {
                    if (onSelectTrade && t.id) onSelectTrade(t.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {t.symbol || '—'}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                        t.direction === 'SHORT' || t.direction === 'SELL'
                          ? 'bg-[#973336]/12 text-[#973336]'
                          : 'bg-[#348398]/12 text-[#348398]',
                      )}
                    >
                      {t.direction || '—'}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {t.volume ?? '—'} @ {t.openPrice ?? '—'}
                    </span>
                    <span
                      className={cn(
                        'font-bold tabular-nums',
                        pnl >= 0 ? 'text-[#348398]' : 'text-[#973336]',
                      )}
                    >
                      {pnl >= 0 ? '+' : ''}
                      {pnl.toFixed(2)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="px-3 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#348398]" />
            <p className="text-xs font-semibold text-foreground">Coach feed</p>
          </div>
          <ul className="space-y-1.5">
            {feed.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.03 }}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[12px] leading-snug',
                  item.tone === 'warn' &&
                    'border-[#973336]/25 border-l-[3px] border-l-[#973336] bg-[#973336]/[0.06] text-foreground',
                  item.tone === 'good' &&
                    'border-[#348398]/25 border-l-[3px] border-l-[#348398] bg-[#348398]/[0.06] text-foreground',
                  (!item.tone || item.tone === 'info') &&
                    'border-[var(--card-border)] bg-muted/25 text-muted-foreground',
                )}
              >
                {item.tone === 'warn' && (
                  <AlertTriangle className="mb-0.5 mr-1 inline h-3 w-3 text-[#973336]" />
                )}
                {item.text}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
