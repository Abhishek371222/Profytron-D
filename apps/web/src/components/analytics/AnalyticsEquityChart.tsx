'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type EquityPoint = { date: string; equity: number; drawdownPct?: number };

function formatAxisMoney(value: number) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '$0';
  if (Math.abs(v) >= 10000) return `$${(v / 1000).toFixed(0)}k`;
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = label ? new Date(label) : null;
  const dateLabel =
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : label;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground">{dateLabel}</p>
      <p className="font-bold text-foreground tabular-nums">
        $
        {Number(payload[0]?.value ?? 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

export function AnalyticsEquityChart({ data }: { data: EquityPoint[] }) {
  const first = data[0];
  const last = data[data.length - 1];
  const equities = data.map((d) => d.equity).filter((n) => Number.isFinite(n));
  const min = equities.length ? Math.min(...equities) : 0;
  const max = equities.length ? Math.max(...equities) : 1;
  const pad = Math.max((max - min) * 0.08, max * 0.01, 1);

  // Thin dense timestamps so X labels don't overlap.
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  const ariaLabel =
    first && last
      ? `Equity curve chart from $${Math.round(first.equity).toLocaleString()} on ${first.date} to $${Math.round(last.equity).toLocaleString()} on ${last.date}.`
      : 'Equity curve chart';

  return (
    <div className="h-[220px] relative" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} initialDimension={{ width: 400, height: 250 }}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="analyticsEqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            interval={tickInterval}
            tickFormatter={(v) => {
              const d = new Date(v);
              if (Number.isNaN(d.getTime())) return '';
              return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis
            domain={[Math.max(0, min - pad), max + pad]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisMoney}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="var(--primary)"
            fill="url(#analyticsEqFill)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
