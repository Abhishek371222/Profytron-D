'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { brokerApi } from '@/lib/api/broker';
import { BrokerConnectModal } from '@/components/copy-trading/BrokerConnectModal';
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe,
  Link2,
  Link2Off,
  Loader2,
  Plus,
  RefreshCcw,
  Shield,
  TrendingUp,
  XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
type AccountType = 'Live' | 'Demo' | 'Paper';

interface BrokerAccount {
  id: string;
  brokerName: string;
  accountNumber: string;
  accountType: AccountType;
  status: AccountStatus;
  balance?: number;
  currency?: string;
  lastSyncedAt?: string;
  activeBotCount?: number;
  isPaperTrading?: boolean;
  serverName?: string;
  storeOnly?: boolean;
  balanceNote?: string;
  login?: string;
  fillMode?: string;
}

interface LinkedBot {
  id: string;
  botName: string;
  brokerAccountId: string;
  brokerName: string;
  accountNumber: string;
  status: string;
  pnl?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AccountStatus, string> = {
  CONNECTED: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  DISCONNECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  SYNCING: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
};
const STATUS_DOT: Record<AccountStatus, string> = {
  CONNECTED: 'bg-chart-3',
  DISCONNECTED: 'bg-destructive',
  SYNCING: 'bg-chart-4 animate-pulse',
};

const BROKER_ICON_MAP: Record<string, React.ElementType> = {};

function BrokerIcon({ name }: { name: string }) {
  const Icon = BROKER_ICON_MAP[name] ?? Building2;
  return <Icon className="h-5 w-5" />;
}

const SUPPORTED_BROKERS = [
  'Zerodha', 'Upstox', 'Angel One', 'Dhan',
  'Interactive Brokers', 'Alpaca', 'Binance',
  'MetaTrader 4', 'MetaTrader 5',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskAccount(num?: string) {
  if (!num) return '****';
  return '****' + num.slice(-4);
}

const VALID_STATUSES: AccountStatus[] = ['CONNECTED', 'DISCONNECTED', 'SYNCING'];

function normalizeStatus(status?: string): AccountStatus {
  const upper = String(status ?? '').toUpperCase();
  return (VALID_STATUSES as string[]).includes(upper)
    ? (upper as AccountStatus)
    : 'CONNECTED';
}

function formatStatus(status: AccountStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatInr(amount: number, currency = 'INR') {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectedAccountsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);

  // Fetch broker accounts (real endpoint). Refetch periodically so live
  // balances and a still-connecting account update without a manual refresh.
  const accountsQuery = useQuery({
    queryKey: ['broker-accounts'],
    refetchInterval: 20_000,
    queryFn: async () => {
      const res = await apiClient.get('/broker/accounts');
      const raw = unwrapApiResponse<any[]>(res.data) ?? [];
      return raw.map((a): BrokerAccount => {
        const live = a.equity ?? a.balance ?? a.initialEquity;
        const status: AccountStatus =
          a.isActive === false
            ? 'DISCONNECTED'
            : a.connectionStatus === 'CONNECTING'
            ? 'SYNCING'
            : 'CONNECTED';
        return {
          id: a.id,
          brokerName: a.brokerName,
          accountNumber: a.accountNumberLast4 ?? '',
          accountType: a.isPaperTrading ? 'Paper' : 'Live',
          status,
          balance: live ?? undefined,
          currency: a.currency ?? 'USD',
          lastSyncedAt: a.lastConnectedAt ?? a.connectedAt,
          isPaperTrading: Boolean(a.isPaperTrading),
          serverName: a.serverName ?? undefined,
          storeOnly: Boolean(a.storeOnly),
          balanceNote:
            typeof a.balanceNote === 'string' ? a.balanceNote : undefined,
          login: a.login ? String(a.login) : undefined,
          fillMode: a.fillMode ?? undefined,
        };
      });
    },
  });

  // Fetch linked bots (from strategies with broker info)
  const botsQuery = useQuery({
    queryKey: ['connected-bots'],
    queryFn: async () => {
      const res = await apiClient.get('/strategies/my');
      return unwrapApiResponse<LinkedBot[]>(res.data);
    },
  });

  const bots = botsQuery.data ?? [];
  const accounts = React.useMemo<BrokerAccount[]>(() => {
    const raw = accountsQuery.data ?? [];
    return raw.map((a) => ({
      ...a,
      status: normalizeStatus(a?.status),
      activeBotCount: bots.filter(
        (b) =>
          b.status === 'ACTIVE' &&
          (b.accountNumber ? b.accountNumber === a.accountNumber : true),
      ).length,
    }));
  }, [accountsQuery.data, bots]);

  // Account health status
  const totalAccounts = accounts.length;
  const connectedCount = accounts.filter((a) => a.status === 'CONNECTED').length;
  const disconnectedCount = accounts.filter((a) => a.status === 'DISCONNECTED').length;

  const healthStatus: 'green' | 'yellow' | 'red' =
    totalAccounts === 0
      ? 'green'
      : disconnectedCount > 0
      ? 'red'
      : connectedCount < totalAccounts
      ? 'yellow'
      : 'green';

  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [bridgeBusyId, setBridgeBusyId] = React.useState<string | null>(null);

  const handleReconnect = (_account: BrokerAccount) => {
    setShowModal(true);
  };

  const handleRotateBridgeToken = async (account: BrokerAccount) => {
    if (account.isPaperTrading) return;
    const ok = window.confirm(
      `Generate a new bridge token for ${account.brokerName} ···${account.accountNumber}?\n\nThe old token stops working. Paste the new one into ProfytronCopyBridge on MT5.`,
    );
    if (!ok) return;
    setBridgeBusyId(account.id);
    try {
      const result = await brokerApi.rotateBridgeToken(account.id);
      const token = result?.bridgeToken as string | undefined;
      if (token) {
        try {
          await navigator.clipboard.writeText(token);
        } catch {
          /* ignore */
        }
        toast.success('Bridge token rotated (copied)', {
          description: token.slice(0, 12) + '… — paste into ProfytronCopyBridge EA',
          duration: 12_000,
        });
      } else {
        toast.success('Bridge token rotated');
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.message ?? data?.error ?? err?.message ?? 'Failed to rotate token';
      toast.error(typeof msg === 'string' ? msg : 'Failed to rotate token');
    } finally {
      setBridgeBusyId(null);
    }
  };

  const handleDisconnect = async (account: BrokerAccount) => {
    const ok = window.confirm(
      `Disconnect ${account.brokerName} ···${account.accountNumber}?\n\nThis frees your account slot so you can connect another broker.`,
    );
    if (!ok) return;
    setDisconnectingId(account.id);

    // Optimistic remove so the card disappears immediately
    const previous = queryClient.getQueryData<BrokerAccount[]>(['broker-accounts']);
    queryClient.setQueryData<BrokerAccount[]>(['broker-accounts'], (old) =>
      (old ?? []).filter((a) => a.id !== account.id),
    );

    try {
      await brokerApi.disconnectBroker(account.id);
      toast.success(`${account.brokerName} disconnected`, {
        description: 'Account removed. You can connect a new one now.',
      });
      await queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
    } catch (err: any) {
      if (previous) queryClient.setQueryData(['broker-accounts'], previous);
      const data = err?.response?.data;
      const msg =
        data?.message ??
        data?.error ??
        data?.data?.message ??
        err?.message ??
        'Disconnect failed';
      toast.error(typeof msg === 'string' ? msg : 'Disconnect failed');
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleViewDetails = (account: BrokerAccount) => {
    const lines = [
      `${account.brokerName} ···${account.accountNumber} · ${account.accountType}`,
      account.serverName ? `Server: ${account.serverName}` : null,
      account.login ? `Login: ${account.login}` : null,
      account.balance != null
        ? `Balance ${formatInr(account.balance, account.currency)}`
        : account.storeOnly
          ? 'Balance: not synced yet (bridge EA reports live equity)'
          : 'No live balance cached yet',
      account.fillMode ? `Mode: ${account.fillMode}` : null,
      account.balanceNote ?? null,
    ].filter(Boolean);

    toast.info(lines[0] as string, {
      description: lines.slice(1).join('\n'),
      duration: 8_000,
    });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
    toast.success('Accounts refreshed');
  };

  return (
    <div className="space-y-6 pb-10">
      <BrokerConnectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConnected={() => {
          queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
          queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
        }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Connected Accounts</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Connected Accounts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect your own MT5 — stored in Profytron, no MetaApi seat per user
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refresh}
            className="btn-premium-ghost inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground"
            aria-label="Refresh accounts"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-premium inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide"
          >
            <Plus className="h-4 w-4" />
            Connect New Broker
          </button>
        </div>
      </motion.div>

      {/* Account Health Banner */}
      {!accountsQuery.isLoading && totalAccounts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium',
            healthStatus === 'green'
              ? 'bg-chart-3/10 border-chart-3/20 text-chart-3'
              : healthStatus === 'yellow'
              ? 'bg-chart-4/10 border-chart-4/20 text-chart-4'
              : 'bg-destructive/10 border-destructive/20 text-destructive',
          )}
        >
          {healthStatus === 'green' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : healthStatus === 'yellow' ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {healthStatus === 'green'
            ? `All ${connectedCount} broker account${connectedCount !== 1 ? 's' : ''} connected and healthy`
            : healthStatus === 'yellow'
            ? `${connectedCount} of ${totalAccounts} accounts syncing — bots may be delayed`
            : `${disconnectedCount} account${disconnectedCount !== 1 ? 's' : ''} disconnected — affected bots are paused`}
        </motion.div>
      )}

      {/* Broker Accounts Grid */}
      {accountsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card p-5 space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-8 bg-muted rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        // Empty state
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card py-20 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-[var(--card-border)]">
            <Link2Off className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground">No broker accounts connected yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Connect a broker account to start running bots and copy-trading signals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Connect Broker
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {accounts.map((account, idx) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="group dashboard-card p-5 flex flex-col gap-4 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] hover:border-[color-mix(in_srgb,var(--primary)_18%,var(--card-border))]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                    <BrokerIcon name={account.brokerName} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{account.brokerName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{maskAccount(account.accountNumber)}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shrink-0', STATUS_STYLE[account.status] ?? STATUS_STYLE.CONNECTED)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[account.status] ?? STATUS_DOT.CONNECTED)} />
                  {formatStatus(account.status)}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Type</p>
                  <p className="text-xs font-bold text-foreground">{account.accountType}</p>
                </div>
                <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Balance</p>
                  <p className="text-xs font-bold text-foreground tabular-nums">
                    {account.balance != null
                      ? formatInr(account.balance, account.currency)
                      : account.storeOnly
                        ? 'Via bridge EA'
                        : '—'}
                  </p>
                </div>
                {account.serverName && (
                  <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5 col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Server</p>
                    <p className="text-xs font-bold text-foreground break-all">{account.serverName}</p>
                  </div>
                )}
                {account.login && (
                  <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Login</p>
                    <p className="text-xs font-bold text-foreground font-mono">{account.login}</p>
                  </div>
                )}
                {account.activeBotCount != null && (
                  <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Active Bots</p>
                    <p className="text-xs font-bold text-foreground">{account.activeBotCount}</p>
                  </div>
                )}
                {account.lastSyncedAt && (
                  <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Linked</p>
                    <p className="text-xs font-bold text-foreground">{timeAgo(account.lastSyncedAt)}</p>
                  </div>
                )}
              </div>
              {account.storeOnly && (
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Account linked in Profytron DB. Live equity syncs when ProfytronCopyBridge EA is running on MT5.
                </p>
              )}

                <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDisconnect(account)}
                  disabled={disconnectingId === account.id}
                  className="w-full h-10 rounded-lg border border-destructive/40 bg-destructive text-destructive-foreground text-[12px] font-bold uppercase tracking-wide hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm"
                  aria-label="Disconnect account"
                >
                  {disconnectingId === account.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2Off className="h-4 w-4" />
                  )}
                  Disconnect account
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReconnect(account)}
                    disabled={
                      account.status === 'CONNECTED' ||
                      disconnectingId === account.id
                    }
                    className="flex-1 h-8 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-1"
                  >
                    {account.status === 'SYNCING' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3 w-3" />
                    )}
                    Reconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewDetails(account)}
                    disabled={disconnectingId === account.id}
                    className="flex-1 h-8 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <Globe className="h-3 w-3" />
                    Details
                  </button>
                </div>
                {!account.isPaperTrading && (
                  <button
                    type="button"
                    onClick={() => handleRotateBridgeToken(account)}
                    disabled={
                      disconnectingId === account.id ||
                      bridgeBusyId === account.id
                    }
                    className="w-full h-8 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {bridgeBusyId === account.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    Bridge EA token
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Connected Bots Table */}
      {(botsQuery.isLoading || bots.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dashboard-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Connected Bots</h2>
            {!botsQuery.isLoading && (
              <span className="ml-auto text-[11px] font-semibold text-muted-foreground">{bots.length} bot{bots.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="responsive-table-shell">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-muted/20">
                  {['Bot', 'Broker Account', 'Status', 'P&L', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                        i >= 2 ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {botsQuery.isLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${50 + j * 10}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : bots.map((bot, idx) => (
                      <motion.tr
                        key={bot.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Bot className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{bot.botName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {bot.brokerName} — <span className="font-mono">{maskAccount(bot.accountNumber)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border',
                            bot.status === 'ACTIVE'
                              ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                              : bot.status === 'PAUSED'
                              ? 'bg-chart-4/10 text-chart-4 border-chart-4/20'
                              : 'bg-muted text-muted-foreground border-[var(--card-border)]',
                          )}>
                            <span className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              bot.status === 'ACTIVE' ? 'bg-chart-3' : bot.status === 'PAUSED' ? 'bg-chart-4' : 'bg-muted-foreground',
                            )} />
                            {bot.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {bot.pnl != null ? (
                            <span className={cn('text-sm font-bold tabular-nums', bot.pnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
                              {bot.pnl >= 0 ? '+' : ''}{formatInr(bot.pnl)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => toast.info(`Viewing bot ${bot.botName}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                          >
                            <TrendingUp className="h-3 w-3" />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Supported Brokers */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="dashboard-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Supported Brokers</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_BROKERS.map((broker) => (
            <span
              key={broker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--card-border)] bg-muted/20 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors cursor-default"
            >
              <Building2 className="h-3 w-3" />
              {broker}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[var(--card-border)] text-xs font-semibold text-muted-foreground/60">
            + More coming soon
          </span>
        </div>
      </motion.div>
    </div>
  );
}
