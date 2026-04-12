"use client";

import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Activity, DollarSign, ShieldAlert, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardKpis = {
  totalUsers?: number;
  totalStrategies?: number;
  totalTrades?: number;
  pendingVerifications?: number;
  mrr?: string;
};

const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboardMetrics(),
    refetchInterval: 30_000,
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments-overview'],
    queryFn: () => adminApi.getPaymentsOverview(),
    refetchInterval: 30_000,
  });

  const kpis: DashboardKpis = dashboardQuery.data?.kpis ?? {};

  const chartData = useMemo(() => {
    const deposits = Number(paymentsQuery.data?.deposits ?? 0);
    const withdrawals = Number(paymentsQuery.data?.withdrawals ?? 0);
    const subscriptions = Number(paymentsQuery.data?.subscriptions ?? 0);
    const mrr = parseCurrency(kpis.mrr);

    return [
      { label: 'Deposits', value: deposits },
      { label: 'Withdrawals', value: withdrawals },
      { label: 'Subscriptions', value: subscriptions },
      { label: 'MRR', value: mrr },
    ];
  }, [paymentsQuery.data, kpis.mrr]);

  const isLoading = dashboardQuery.isLoading || paymentsQuery.isLoading;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400">Live platform metrics and payment snapshots.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={Number(kpis.totalUsers ?? 0).toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <MetricCard
          title="Total Trades"
          value={Number(kpis.totalTrades ?? 0).toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
          loading={isLoading}
        />
        <MetricCard
          title="Pending Reviews"
          value={Number(kpis.pendingVerifications ?? 0).toLocaleString()}
          icon={<ShieldAlert className="h-4 w-4" />}
          loading={isLoading}
        />
        <MetricCard
          title="MRR"
          value={kpis.mrr ?? '$0.00'}
          icon={<DollarSign className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-200">Payments Overview</h2>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between text-slate-400">
        <span className="text-sm">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white">
        {loading ? 'Loading...' : value}
      </div>
    </div>
  );
}
