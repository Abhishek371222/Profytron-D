'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { brokerApi } from '@/lib/api/broker';
import { BROKER_ACCOUNTS_KEY, type BrokerAccountRow } from '@/lib/queries/account-queries';
import { useAccountContext } from '@/hooks/useAccountContext';
import { BrokerConnectModal } from '@/components/copy-trading/BrokerConnectModal';
import { AccountDetailsModal } from '@/components/broker/AccountDetailsModal';
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Link2,
  Link2Off,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Shield,
  XCircle,
  Users,
  Mail,
  Check,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type AccountStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
type AccountType = 'Live' | 'Demo' | 'Paper';

interface BrokerAccount {
  id: string;
  brokerName: string;
  accountNumber: string;
  accountType: AccountType;
  status: AccountStatus;
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  marginLevel?: number;
  credit?: number;
  currency?: string;
  lastSyncedAt?: string;
  activeBotCount?: number;
  isPaperTrading?: boolean;
  serverName?: string;
  storeOnly?: boolean;
  balanceNote?: string;
  login?: string;
  fillMode?: string;
  initialEquity?: number;
  isDefault?: boolean;
  isMasterSource?: boolean;
  sharedAccess?: boolean;
  canManage?: boolean;
  sharedByName?: string | null;
}

interface LinkedBot {
  id: string;
  botName: string;
  brokerAccountId?: string;
  brokerName: string;
  accountNumber: string;
  status: string;
  pnl?: number;
}

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

function mapBrokerAccountRow(a: BrokerAccountRow): BrokerAccount {
  const liveSynced = Boolean(a.liveSynced) || Boolean(a.isPaperTrading);
  const live =
    a.equity != null || a.balance != null || a.initialEquity != null
      ? Number(a.equity ?? a.balance ?? a.initialEquity)
      : null;
  const status: AccountStatus =
    a.isActive === false
      ? 'DISCONNECTED'
      : a.connectionStatus === 'CONNECTING' || a.connectionStatus === 'SYNCING'
        ? 'SYNCING'
        : liveSynced
          ? 'CONNECTED'
          : 'SYNCING';
  return {
    id: a.id,
    brokerName: a.brokerName,
    accountNumber: a.accountNumberLast4 ?? a.accountNumber ?? '',
    accountType: a.isPaperTrading ? 'Paper' : 'Live',
    status,
    balance: live != null && Number.isFinite(live) ? live : undefined,
    equity: a.equity != null && Number.isFinite(Number(a.equity)) ? Number(a.equity) : undefined,
    margin: a.margin != null && Number.isFinite(Number(a.margin)) ? Number(a.margin) : undefined,
    freeMargin:
      a.freeMargin != null && Number.isFinite(Number(a.freeMargin))
        ? Number(a.freeMargin)
        : undefined,
    marginLevel:
      a.marginLevel != null && Number.isFinite(Number(a.marginLevel))
        ? Number(a.marginLevel)
        : undefined,
    credit: a.credit != null && Number.isFinite(Number(a.credit)) ? Number(a.credit) : undefined,
    currency: a.currency ?? 'USD',
    lastSyncedAt: a.lastConnectedAt ?? a.connectedAt ?? undefined,
    isPaperTrading: Boolean(a.isPaperTrading),
    serverName: a.serverName ?? undefined,
    storeOnly: Boolean(a.storeOnly),
    balanceNote:
      typeof a.balanceNote === 'string' ? a.balanceNote : undefined,
    login: a.login ? String(a.login) : undefined,
    fillMode: a.fillMode ?? undefined,
    initialEquity: a.initialEquity ?? undefined,
    isDefault: !!a.isDefault,
    isMasterSource: !!a.isMasterSource,
    sharedAccess: Boolean(a.sharedAccess),
    canManage: a.canManage ?? true,
    sharedByName: a.sharedByName ?? null,
  };
}

export default function ConnectedAccountsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [detailsAccount, setDetailsAccount] = React.useState<BrokerAccount | null>(null);

  const { accounts: rawAccounts, brokerAccountsQuery: accountsQuery } =
    useAccountContext();

  const botsQuery = useQuery({
    queryKey: ['connected-bots'],
    queryFn: async () => {
      const res = await apiClient.get('/strategies/my');
      const raw = unwrapApiResponse<any[]>(res.data) ?? [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map((s): LinkedBot => ({
        id: String(s.id),
        botName: String(s.botName ?? s.name ?? 'Bot'),
        brokerAccountId: s.brokerAccountId ? String(s.brokerAccountId) : undefined,
        brokerName: String(
          s.brokerName ?? s.brokerAccount?.broker ?? '—',
        ),
        accountNumber: String(
          s.accountNumber ?? s.brokerAccount?.last4 ?? '',
        ),
        status: String(s.status ?? 'INACTIVE'),
        pnl:
          typeof s.pnl === 'number'
            ? s.pnl
            : typeof s.currentPnl === 'number'
              ? s.currentPnl
              : undefined,
      }));
    },
  });

  const bots = botsQuery.data ?? [];
  const accounts = React.useMemo<BrokerAccount[]>(() => {
    return (rawAccounts as BrokerAccountRow[]).map((row) => {
      const mapped = mapBrokerAccountRow(row);
      return {
        ...mapped,
        status: normalizeStatus(mapped.status),
        activeBotCount: bots.filter(
          (b) =>
            b.status === 'ACTIVE' &&
            (b.accountNumber ? b.accountNumber === mapped.accountNumber : true),
        ).length,
      };
    });
  }, [rawAccounts, bots]);

  const invalidateBots = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
    void queryClient.invalidateQueries({ queryKey: ['my-bots'] });
  }, [queryClient]);

  const pauseMut = useMutation({
    mutationFn: (id: string) => apiClient.post(`/strategies/${id}/pause`),
    onSuccess: () => {
      toast.success('Bot paused');
      invalidateBots();
    },
    onError: () => toast.error('Could not pause bot'),
  });

  const resumeMut = useMutation({
    mutationFn: (id: string) => apiClient.post(`/strategies/${id}/resume`),
    onSuccess: () => {
      toast.success('Bot resumed');
      invalidateBots();
    },
    onError: () => toast.error('Could not resume bot'),
  });

  const handleViewBot = (bot: LinkedBot) => {
    if (!bot.id) {
      toast.error('Bot details unavailable');
      return;
    }
    router.push(`/marketplace/${bot.id}`);
  };

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

    const previous = queryClient.getQueryData<BrokerAccountRow[]>(BROKER_ACCOUNTS_KEY);
    queryClient.setQueryData<BrokerAccountRow[]>(BROKER_ACCOUNTS_KEY, (old) =>
      (old ?? []).filter((a) => a.id !== account.id),
    );

    try {
      await brokerApi.disconnectBroker(account.id);
      toast.success(`${account.brokerName} disconnected`, {
        description: 'Account removed. You can connect a new one now.',
      });
      await queryClient.invalidateQueries({ queryKey: BROKER_ACCOUNTS_KEY });
      await queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
    } catch (err: any) {
      if (previous) queryClient.setQueryData(BROKER_ACCOUNTS_KEY, previous);
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
    setDetailsAccount(account);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: BROKER_ACCOUNTS_KEY });
    queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
    toast.success('Accounts refreshed');
  };

  const [shareDialogAccount, setShareDialogAccount] = React.useState<BrokerAccount | null>(null);
  const [shareEmail, setShareEmail] = React.useState('');

  const openShareDialog = (account: BrokerAccount) => {
    setShareEmail('');
    setShareDialogAccount(account);
  };

  const sharesQuery = useQuery({
    queryKey: ['broker-shares'],
    queryFn: () => brokerApi.listShares(),
  });

  const shareMut = useMutation({
    mutationFn: () =>
      brokerApi.shareAccount(shareDialogAccount!.id, shareEmail.trim()),
    onSuccess: () => {
      toast.success('Invite sent', {
        description: `${shareEmail.trim()} will see this account once they accept.`,
      });
      setShareDialogAccount(null);
      queryClient.invalidateQueries({ queryKey: ['broker-shares'] });
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg = data?.message ?? data?.error ?? err?.message ?? 'Could not send invite';
      toast.error(typeof msg === 'string' ? msg : 'Could not send invite');
    },
  });

  const acceptShareMut = useMutation({
    mutationFn: (shareId: string) => brokerApi.acceptShare(shareId),
    onSuccess: () => {
      toast.success('Invite accepted');
      queryClient.invalidateQueries({ queryKey: ['broker-shares'] });
      queryClient.invalidateQueries({ queryKey: BROKER_ACCOUNTS_KEY });
    },
    onError: () => toast.error('Could not accept invite'),
  });

  const declineShareMut = useMutation({
    mutationFn: (shareId: string) => brokerApi.declineShare(shareId),
    onSuccess: () => {
      toast.success('Invite declined');
      queryClient.invalidateQueries({ queryKey: ['broker-shares'] });
    },
    onError: () => toast.error('Could not decline invite'),
  });

  const revokeShareMut = useMutation({
    mutationFn: (shareId: string) => brokerApi.revokeShare(shareId),
    onSuccess: () => {
      toast.success('Access revoked');
      queryClient.invalidateQueries({ queryKey: ['broker-shares'] });
      queryClient.invalidateQueries({ queryKey: BROKER_ACCOUNTS_KEY });
    },
    onError: () => toast.error('Could not revoke access'),
  });

  return (
    <div className="space-y-6 pb-10">
      <BrokerConnectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConnected={() => {
          queryClient.invalidateQueries({ queryKey: BROKER_ACCOUNTS_KEY });
          queryClient.invalidateQueries({ queryKey: ['connected-bots'] });
        }}
      />

      <AccountDetailsModal
        account={detailsAccount}
        onClose={() => setDetailsAccount(null)}
        onReconnect={(account) => {
          setDetailsAccount(null);
          handleReconnect(account);
        }}
        maskAccount={maskAccount}
        formatAmount={formatInr}
        timeAgo={timeAgo}
      />

      <Dialog
        open={Boolean(shareDialogAccount)}
        onOpenChange={(open: boolean) => {
          if (!open) setShareDialogAccount(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this account with a teammate</DialogTitle>
            <DialogDescription>
              {shareDialogAccount &&
                `They'll see ${shareDialogAccount.brokerName} ···${maskAccount(shareDialogAccount.accountNumber).slice(-4)} — balance, equity, and trades — but can't disconnect, reconnect, or trade on it. Requires a Business plan or higher.`}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="teammate@email.com"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="pl-9"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShareDialogAccount(null)}
              className="h-9 px-4 rounded-lg border border-[var(--card-border)] bg-card text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => shareMut.mutate()}
              disabled={!shareEmail.trim() || shareMut.isPending}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {shareMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send invite
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Connected Accounts</span>
      </div>

      { }
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
              Live MT5 via MetaApi G2 — balance and MasterSync copy fills
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
            data-tour="connect-broker-cta"
            className="btn-premium inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide"
          >
            <Plus className="h-4 w-4" />
            Connect New Broker
          </button>
        </div>
      </motion.div>

      { }
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

      { }
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
              Connect a broker account to start running bots.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            data-tour="connect-broker-cta"
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
              { }
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
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shrink-0', STATUS_STYLE[account.status] ?? STATUS_STYLE.CONNECTED)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[account.status] ?? STATUS_DOT.CONNECTED)} />
                    {formatStatus(account.status)}
                  </span>
                  {account.sharedAccess && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-chart-2/10 text-chart-2 border border-chart-2/20">
                      Shared by {account.sharedByName || 'teammate'} · view only
                    </span>
                  )}
                </div>
              </div>

              { }
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
                        ? 'Reconnect for live balance'
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
              {account.storeOnly ? (
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Legacy store-only link. Click{' '}
                  <span className="font-semibold text-foreground">
                    Upgrade to MetaApi
                  </span>{' '}
                  and reconnect the same MT5 login for live balance.
                </p>
              ) : account.balanceNote ? (
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {account.balanceNote}
                </p>
              ) : null}

                <div className="flex flex-col gap-2 pt-1">
                {account.canManage !== false && (
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
                )}
                <div className="flex items-center gap-2">
                  {account.canManage !== false && (
                    <button
                      type="button"
                      onClick={() => handleReconnect(account)}
                      disabled={disconnectingId === account.id}
                      className="flex-1 h-8 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-1"
                    >
                      {account.status === 'SYNCING' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-3 w-3" />
                      )}
                      {account.storeOnly ? 'Upgrade to MetaApi' : 'Reconnect'}
                    </button>
                  )}
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
                {!account.isPaperTrading && account.storeOnly && account.canManage !== false && (
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
                {!account.sharedAccess && (
                  <button
                    type="button"
                    onClick={() => openShareDialog(account)}
                    className="w-full h-8 rounded-lg border border-[color-mix(in_srgb,var(--primary)_28%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] text-[11px] font-bold uppercase tracking-wide text-primary hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Users className="h-3 w-3" />
                    Share with teammate
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      { }
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
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {bot.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => pauseMut.mutate(bot.id)}
                                disabled={pauseMut.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
                              >
                                {pauseMut.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Pause className="h-3 w-3" />
                                )}
                                Pause
                              </button>
                            )}
                            {(bot.status === 'PAUSED' || bot.status === 'INACTIVE') && (
                              <button
                                type="button"
                                onClick={() => resumeMut.mutate(bot.id)}
                                disabled={resumeMut.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/25 bg-primary/10 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
                              >
                                {resumeMut.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                                Resume
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleViewBot(bot)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      { }
      {sharesQuery.data &&
        (sharesQuery.data.owned.length > 0 || sharesQuery.data.received.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="dashboard-card p-5 space-y-5"
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Team Access</h2>
            </div>

            {sharesQuery.data.received.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shared with you</p>
                {sharesQuery.data.received.map((share: any) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] bg-muted/20 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">
                        {share.owner?.fullName || share.owner?.email} — {share.brokerAccount?.brokerName} ···{share.brokerAccount?.accountNumberLast4}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{share.status}</p>
                    </div>
                    {share.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => acceptShareMut.mutate(share.id)}
                          className="h-8 w-8 rounded-lg bg-chart-3/10 text-chart-3 border border-chart-3/20 flex items-center justify-center hover:bg-chart-3/15"
                          aria-label="Accept"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => declineShareMut.mutate(share.id)}
                          className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center hover:bg-destructive/15"
                          aria-label="Decline"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : share.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => revokeShareMut.mutate(share.id)}
                        className="h-8 px-3 rounded-lg border border-[var(--card-border)] bg-card text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-destructive shrink-0"
                      >
                        Leave
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {sharesQuery.data.owned.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shared by you</p>
                {sharesQuery.data.owned.map((share: any) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] bg-muted/20 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">
                        {share.member?.fullName || share.inviteEmail} — {share.brokerAccount?.brokerName} ···{share.brokerAccount?.accountNumberLast4}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{share.status}</p>
                    </div>
                    {(share.status === 'PENDING' || share.status === 'ACTIVE') && (
                      <button
                        type="button"
                        onClick={() => revokeShareMut.mutate(share.id)}
                        className="h-8 px-3 rounded-lg border border-[var(--card-border)] bg-card text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-destructive shrink-0"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      { }
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
