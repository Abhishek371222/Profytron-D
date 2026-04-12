"use client";

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { RefreshCcw, Server } from 'lucide-react';

type ServiceState = Record<string, string>;

export default function AdminSystemPage() {
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['admin', 'system-metrics'],
    queryFn: () => adminApi.getSystemMetrics(),
    refetchInterval: 15_000,
  });

  const healthQuery = useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 15_000,
  });

  const services = useMemo(() => {
    const activeServices = (healthQuery.data?.activeServices ?? {}) as ServiceState;
    return Object.entries(activeServices).map(([name, status]) => ({ name, status }));
  }, [healthQuery.data]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">System Monitoring</h1>
          <p className="text-sm text-slate-400">Live service status and core platform counters.</p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'system-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'system-health'] });
          }}
          className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          label="Active Users (24h)"
          value={String(metricsQuery.data?.activeUsers24h ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <InfoCard
          label="New Users (7d)"
          value={String(metricsQuery.data?.newUsers7d ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <InfoCard
          label="Pending KYC"
          value={String(metricsQuery.data?.pendingKyc ?? 0)}
          loading={metricsQuery.isLoading}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
          <Server className="h-4 w-4" /> Service Health
        </div>
        {healthQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading services...</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-slate-400">No service telemetry available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const ok = String(service.status).toUpperCase().includes('UP') ||
                String(service.status).toUpperCase().includes('CONNECTED');
              return (
                <div key={service.name} className="rounded border border-slate-700 bg-slate-950 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{service.name}</div>
                  <div className={`mt-1 text-sm font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {service.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Last update: {healthQuery.data?.lastUpdated ?? metricsQuery.data?.timestamp ?? '-'}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{loading ? 'Loading...' : value}</div>
    </div>
  );
}
