'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

export type PerformanceBarDatum = {
  label: string;
  display: string;
  score: number;
  color: string;
};

export default function DashboardPerformanceBarChart({ data }: { data: PerformanceBarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.06)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const pt = payload[0].payload as PerformanceBarDatum;
            return (
              <div className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground">{pt.label}</p>
                <p className="text-sm font-bold text-foreground">{pt.display}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="score" radius={[0, 8, 8, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} fillOpacity={0.88} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
