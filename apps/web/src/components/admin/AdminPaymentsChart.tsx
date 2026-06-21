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
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#47a7aa" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
