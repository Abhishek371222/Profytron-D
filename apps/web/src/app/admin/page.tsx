"use client";

import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [broadcastForm, setBroadcastForm] = useState({
    accountId: '',
    strategyId: '',
    signalType: 'BUY',
    pair: 'BTCUSDT',
    price: '',
  });

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

  const brokerAccountsQuery = useQuery({
    queryKey: ['admin', 'broker-accounts'],
    queryFn: () => adminApi.getBrokerAccounts(),
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

  const toggleMasterSource = async (accountId: string, currentValue: boolean) => {
    try {
      await adminApi.setBrokerMasterSource(accountId, !currentValue);
      toast.success(currentValue ? 'Master source disabled' : 'Master source enabled');
      await brokerAccountsQuery.refetch();
    } catch {
      toast.error('Unable to update master source');
    }
  };

  const broadcastSignal = async () => {
    if (
      !broadcastForm.accountId ||
      !broadcastForm.strategyId ||
      !broadcastForm.pair ||
      !broadcastForm.price
    ) {
      toast.error('Fill in the master account, strategy, pair, and price');
      return;
    }

    try {
      await adminApi.broadcastMasterSignal(broadcastForm.accountId, {
        strategyId: broadcastForm.strategyId,
        signalType: broadcastForm.signalType,
        pair: broadcastForm.pair,
        price: Number(broadcastForm.price),
      });
      toast.success('Master signal broadcast queued');
    } catch {
      toast.error('Unable to broadcast master signal');
    }
  };

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

      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-slate-200">Copy-Trading Masters</h2>
            <p className="text-xs text-slate-400">
              Mark one broker account as a master source, then broadcast its trades to subscribed users.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            {Number(brokerAccountsQuery.data?.length ?? 0).toLocaleString()} connected accounts
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="grid gap-2">
              {(brokerAccountsQuery.data ?? []).map((account: any) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {account.user?.fullName ?? account.user?.email ?? 'Unknown user'}
                      </span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                        {account.brokerName}
                      </span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                        ••••{account.accountNumberLast4}
                      </span>
                      {account.isMasterSource && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                          Master
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {account._count?.subscriptions ?? 0} subscribers, {account._count?.trades ?? 0} trades
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMasterSource(account.id, Boolean(account.isMasterSource))}
                    >
                      {account.isMasterSource ? 'Disable master' : 'Make master'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setBroadcastForm((current) => ({ ...current, accountId: account.id }))
                      }
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
              {!brokerAccountsQuery.data?.length && (
                <div className="rounded-lg border border-dashed border-slate-800 px-4 py-6 text-center text-sm text-slate-500">
                  No broker accounts connected yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Broadcast signal
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs uppercase tracking-widest text-slate-500">Master account</label>
              <Input
                value={broadcastForm.accountId}
                onChange={(event) =>
                  setBroadcastForm((current) => ({ ...current, accountId: event.target.value }))
                }
                placeholder="Broker account id"
                className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs uppercase tracking-widest text-slate-500">Strategy id</label>
              <Input
                value={broadcastForm.strategyId}
                onChange={(event) =>
                  setBroadcastForm((current) => ({ ...current, strategyId: event.target.value }))
                }
                placeholder="Strategy id"
                className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="ml-1 text-xs uppercase tracking-widest text-slate-500">Signal</label>
                <Input
                  value={broadcastForm.signalType}
                  onChange={(event) =>
                    setBroadcastForm((current) => ({ ...current, signalType: event.target.value }))
                  }
                  placeholder="BUY"
                  className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs uppercase tracking-widest text-slate-500">Pair</label>
                <Input
                  value={broadcastForm.pair}
                  onChange={(event) =>
                    setBroadcastForm((current) => ({ ...current, pair: event.target.value }))
                  }
                  placeholder="BTCUSDT"
                  className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-xs uppercase tracking-widest text-slate-500">Price</label>
              <Input
                value={broadcastForm.price}
                onChange={(event) =>
                  setBroadcastForm((current) => ({ ...current, price: event.target.value }))
                }
                placeholder="62000"
                inputMode="decimal"
                className="border-slate-800 bg-slate-900 text-white placeholder:text-slate-600"
              />
            </div>
            <Button onClick={broadcastSignal} className="w-full justify-center">
              Broadcast to followers <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs leading-relaxed text-slate-500">
              This uses the existing queue fan-out, so one master trade can distribute to thousands of
              subscribers per bot without changing the execution path.
            </p>
          </div>
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
