'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

export function CoachAiPulseStrip({
  active,
  winRate,
  alphaScore,
  hasAccount,
}: {
  active?: boolean;
  winRate?: number;
  alphaScore?: number;
  hasAccount?: boolean;
}) {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1100);
    return () => window.clearInterval(id);
  }, []);

  const bars = React.useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const wave = Math.sin((tick + i) * 0.7) * 18;
        return Math.max(18, Math.min(88, 36 + ((i * 19 + tick * 9) % 40) + wave));
      }),
    [tick],
  );

  const gemini = active ? 72 + (tick % 18) : 48 + (tick % 12);
  const knowledge = hasAccount ? 78 : 52;
  const desk = Math.min(95, Math.round(alphaScore ?? 50));

  return (
    <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-[var(--card-border)] bg-card/70 px-3 py-1.5 sm:px-4">
      <div className="flex h-8 w-[88px] shrink-0 items-end gap-[2px] rounded-md bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-1.5 py-1">
        {bars.map((h, i) => (
          <div key={i} className="h-full w-[4px]">
            <div
              className={cn(
                'h-full w-full origin-bottom rounded-sm transition-transform duration-500 will-change-transform',
                active ? 'bg-primary' : 'bg-primary/45',
              )}
              style={{ transform: `scaleY(${Math.min(Math.max(h, 0), 100) / 100})` }}
            />
          </div>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            AI signal
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold',
              active ? 'text-emerald-600' : 'text-primary',
            )}
          >
            <Radio className={cn('h-2.5 w-2.5', active && 'animate-pulse')} />
            {active ? 'Generating' : 'Ready'}
          </span>
          {hasAccount && (
            <span className="hidden text-[10px] text-muted-foreground sm:inline">
              · desk WR {Math.round(winRate ?? 0)}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Gemini', value: gemini },
            { label: 'Knowledge', value: knowledge },
            { label: 'Desk', value: desk },
          ].map((m) => (
            <div key={m.label} className="min-w-0">
              <div className="mb-0.5 flex justify-between gap-1 text-[9px] text-muted-foreground">
                <span className="truncate">{m.label}</span>
                <span className="tabular-nums text-foreground/80">{m.value}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-500 will-change-transform"
                  style={{ transform: `scaleX(${Math.min(Math.max(m.value, 0), 100) / 100})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
