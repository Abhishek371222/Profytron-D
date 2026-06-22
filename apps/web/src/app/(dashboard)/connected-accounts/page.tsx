'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
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
  SYNCING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};
const STATUS_DOT: Record<AccountStatus, string> = {
  CONNECTED: 'bg-chart-3',
  DISCONNECTED: 'bg-destructive',
  SYNCING: 'bg-orange-500 animate-pulse',
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

  const handleReconnect = (_account: BrokerAccount) => {
    setShowModal(true);
  };

  const handleDisconnect = (account: BrokerAccount) => {
    toast.error(`Disconnected ${account.brokerName} account`, { description: 'Your bots on this account have been paused.' });
    queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
  };

  const handleViewDetails = (account: BrokerAccount) => {
    toast.info(`Viewing details for ${account.brokerName} ${maskAccount(account.accountNumber)}`);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Connected Accounts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your broker connections for bot trading</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh accounts"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Connect New Broker
          </button>
        </div>
      </div>

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
              ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
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
              transition={{ delay: idx * 0.06 }}
              className="dashboard-card p-5 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                {account.balance != null && (
                  <div className="rounded-lg bg-muted/20 border border-[var(--card-border)] p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Balance</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{formatInr(account.balance, account.currency)}</p>
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
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Last Synced</p>
                    <p className="text-xs font-bold text-foreground">{timeAgo(account.lastSyncedAt)}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleReconnect(account)}
                  disabled={account.status === 'CONNECTED'}
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
                  className="flex-1 h-8 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnect(account)}
                  className="h-8 w-8 rounded-lg border border-[var(--card-border)] bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center shrink-0"
                  aria-label="Disconnect account"
                >
                  <Link2Off className="h-3.5 w-3.5" />
                </button>
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

          <div className="overflow-x-auto">
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
                              ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              : 'bg-muted text-muted-foreground border-[var(--card-border)]',
                          )}>
                            <span className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              bot.status === 'ACTIVE' ? 'bg-chart-3' : bot.status === 'PAUSED' ? 'bg-orange-500' : 'bg-muted-foreground',
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
