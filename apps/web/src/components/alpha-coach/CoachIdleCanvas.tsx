'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BrainCircuit, Radio } from 'lucide-react';

const PROMPTS = [
  { label: 'Exposure check', q: 'Analyze exposure' },
  { label: 'Stop placement', q: 'Optimize stop-loss' },
  { label: 'Gold playbook', q: 'Explain XAUUSD risk' },
  { label: 'Drawdown fix', q: 'Review drawdown' },
];

/** Idle canvas unique to Alpha Coach — compact, not a stretched widget. */
export function CoachIdleCanvas({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1600);
    return () => window.clearInterval(id);
  }, []);

  const bars = React.useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const phase = (tick + i * 2) % 8;
        return 30 + ((phase * 9 + i * 11) % 50);
      }),
    [tick],
  );

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--primary)_5%,var(--card))] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              Coaching lattice
            </p>
            <p className="text-[10px] text-muted-foreground">
              Gemini graph · Alpha Coach only
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
          <Radio className="h-3 w-3 animate-pulse" />
          Sync
        </span>
      </div>

      <div className="mt-3 flex h-10 max-w-[220px] items-end gap-[3px]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-2 rounded-sm bg-primary/70 transition-[height] duration-500"
            style={{ height: `${h}%`, opacity: 0.4 + (i % 4) * 0.12 }}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {PROMPTS.map((p, idx) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onPick(p.q)}
            className={cn(
              'rounded-lg border border-[var(--card-border)] bg-background/80 px-2.5 py-2 text-left text-[11px] font-medium text-foreground transition hover:border-primary/30 hover:bg-primary/5',
              idx === tick % 4 && 'ring-1 ring-primary/25',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
