'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type AdminPaymentsChartDatum = { label: string; value: number };

/**
 * Recharts payments bar chart, isolated into its own module so the admin
 * dashboard can defer the charting bundle via next/dynamic (ssr: false).
 */
export default function AdminPaymentsChart({
  data,
}: {
  data: AdminPaymentsChartDatum[];
}) {
  const summary = data.map((d) => `${d.label} ${d.value}`).join(', ');
  return (
    <div
      role="img"
      aria-label={summary ? `Payments bar chart. ${summary}.` : 'Payments bar chart'}
      className="h-full w-full"
    >
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} initialDimension={{ width: 400, height: 250 }}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}
