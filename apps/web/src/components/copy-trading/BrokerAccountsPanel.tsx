'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Link2,
} from 'lucide-react';
import { brokerApi } from '@/lib/api/broker';
import { Button } from '@/components/ui/button';

interface BrokerAccount {
  id: string;
  brokerName: string;
  accountNumberLast4: string;
  serverName?: string;
  isDefault?: boolean;
  isPaperTrading?: boolean;
}

function formatMoney(value: number | undefined, currency = 'USD') {
  if (value == null || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function BrokerRow({ account }: { account: BrokerAccount }) {
  // Poll live broker values via testConnection. MetaAPI calls aren't free, so
  // keep the cadence modest (every 30s) and allow a manual refresh.
  const query = useQuery({
    queryKey: ['broker-info', account.id],
    queryFn: () => brokerApi.testConnection(account.id),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const connected = query.data?.connected;
  const info = query.data?.accountInfo;
  const loading = query.isLoading || query.isFetching;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-muted/2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {query.isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground/40" />
        ) : connected ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-chart-3" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0 text-chart-4" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {account.brokerName} ···{account.accountNumberLast4}
            {account.isDefault && (
              <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-micro font-bold uppercase tracking-wide text-primary">
                Primary
              </span>
            )}
          </p>
          <p className="text-xs text-foreground/40">
            {account.serverName || 'Unknown server'}
            {' · '}
            {query.isLoading
              ? 'Checking…'
              : connected
                ? 'Connected'
                : 'Not connected'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-micro uppercase tracking-widest text-foreground/30">
            Balance
          </p>
          <p className="text-sm font-bold text-foreground">
            {connected ? formatMoney(info?.balance, info?.currency) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-micro uppercase tracking-widest text-foreground/30">
            Equity
          </p>
          <p className="text-sm font-bold text-foreground">
            {connected ? formatMoney(info?.equity, info?.currency) : '—'}
          </p>
        </div>
        <button
          onClick={() => query.refetch()}
          disabled={loading}
          title="Refresh values"
          aria-label="Refresh account values"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-muted/3 text-foreground/40 transition-colors hover:bg-muted/6 hover:text-foreground disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export function BrokerAccountsPanel({
  accounts,
  onConnect,
}: {
  accounts: BrokerAccount[];
  onConnect: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Connected Brokers</h2>
        <Button variant="outline" size="sm" onClick={onConnect}>
          <Link2 className="mr-1 h-3.5 w-3.5" /> Connect another account
        </Button>
      </div>
      <div className="space-y-2">
        {accounts.map((account) => (
          <BrokerRow key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}
