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
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground tabular-nums">
        ${payload[0]?.value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

export function AnalyticsEquityChart({ data }: { data: EquityPoint[] }) {
  return (
    <div className="h-[280px] relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="analyticsEqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#47a7aa" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#47a7aa" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#47a7aa"
            fill="url(#analyticsEqFill)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
