'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Link2,
  Link2Off,
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
  balance?: number | null;
  equity?: number | null;
  currency?: string | null;
  liveSynced?: boolean;
  connectionStatus?: string | null;
}

function formatMoney(value: number | undefined | null, currency = 'USD') {
  if (value == null || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${Number(value).toFixed(2)} ${currency}`;
  }
}

function BrokerRow({
  account,
  onDisconnected,
}: {
  account: BrokerAccount;
  onDisconnected?: () => void;
}) {
  const [disconnecting, setDisconnecting] = React.useState(false);
  // Manual refresh only — do not poll testConnection on mount (that made connections feel very slow).
  const query = useQuery({
    queryKey: ['broker-info', account.id],
    queryFn: () => brokerApi.testConnection(account.id),
    enabled: false,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const liveBalance =
    query.data?.accountInfo?.balance ??
    (account.liveSynced ? account.balance : null);
  const liveEquity =
    query.data?.accountInfo?.equity ??
    (account.liveSynced ? account.equity : null);
  const currency =
    query.data?.accountInfo?.currency ?? account.currency ?? 'USD';
  const connected =
    query.data?.connected ??
    account.liveSynced ??
    account.connectionStatus === 'CONNECTED';
  const loading = query.isFetching;

  const handleDisconnect = async () => {
    const ok = window.confirm(
      `Disconnect ${account.brokerName} ···${account.accountNumberLast4}?`,
    );
    if (!ok) return;
    setDisconnecting(true);
    try {
      await brokerApi.disconnectBroker(account.id);
      toast.success('Account disconnected');
      onDisconnected?.();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? err?.message ?? 'Disconnect failed',
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-muted/2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {account.connectionStatus === 'SYNCING' && !connected ? (
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
            {connected ? 'Connected' : account.connectionStatus === 'SYNCING' ? 'Syncing…' : 'Not connected'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-micro uppercase tracking-widest text-foreground/30">
            Balance
          </p>
          <p className="text-sm font-bold text-foreground">
            {liveBalance != null ? formatMoney(liveBalance, currency) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-micro uppercase tracking-widest text-foreground/30">
            Equity
          </p>
          <p className="text-sm font-bold text-foreground">
            {liveEquity != null ? formatMoney(liveEquity, currency) : '—'}
          </p>
        </div>
        <button
          onClick={() => query.refetch()}
          disabled={loading || disconnecting}
          title="Refresh values"
          aria-label="Refresh account values"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-muted/3 text-foreground/40 transition-colors hover:bg-muted/6 hover:text-foreground disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          title="Disconnect account"
          aria-label="Disconnect account"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-muted/3 px-2.5 text-xs font-semibold text-foreground/50 transition-colors hover:border-destructive/30 hover:text-destructive disabled:opacity-50"
        >
          {disconnecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2Off className="h-3.5 w-3.5" />
          )}
          Disconnect
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
  const queryClient = useQueryClient();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Connected Brokers
        </h2>
        <Button variant="outline" size="sm" onClick={onConnect}>
          <Link2 className="mr-1 h-3.5 w-3.5" /> Connect another account
        </Button>
      </div>
      <div className="space-y-2">
        {accounts.map((account) => (
          <BrokerRow
            key={account.id}
            account={account}
            onDisconnected={() => {
              queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
              queryClient.invalidateQueries({ queryKey: ['broker-info'] });
            }}
          />
        ))}
      </div>
    </div>
  );
}
