'use client';

import React from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { walletApi } from '@/lib/api/wallet';
import { formatWalletAmount as formatCurrency } from '@/lib/currency';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useUIStore } from '@/lib/stores/useUIStore';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawSheet } from '@/components/wallet/WithdrawSheet';
import { WalletDatePicker } from '@/components/wallet/WalletDatePicker';
import { TransactionDetailModal } from '@/components/wallet/TransactionDetailModal';
import type { WalletTransaction } from '@/lib/api/wallet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ChevronRight,
  Clock,
  Download,
  Filter,
  List,
  Lock,
  Plus,
  RefreshCcw,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react';

type TxFilterType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'SUBSCRIPTION_PAYMENT';
type TxFilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'FAILED';

function formatWalletInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WALLET_DATE_MAX = formatWalletInputDate(new Date());

const TYPE_STYLES: Record<string, string> = {
  DEPOSIT: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  WITHDRAWAL: 'bg-destructive/10 text-destructive border-destructive/20',
  SUBSCRIPTION_PAYMENT: 'bg-primary/10 text-primary border-primary/20',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  CONFIRMED: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  SUBSCRIPTION_PAYMENT: 'Subscription',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function BalanceCard({
  label,
  value,
  footer,
  footerIcon: FooterIcon,
  footerClass,
  valueClass,
  gradient,
  decorIcon: DecorIcon,
  decorClass,
  loading,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  footer: string;
  footerIcon: React.ElementType;
  footerClass: string;
  valueClass?: string;
  gradient: string;
  decorIcon: React.ElementType;
  decorClass: string;
  loading?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={cn(
        'dashboard-card relative overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]',
        'p-3 sm:p-4',
        gradient,
      )}
    >
      <div className={cn('absolute -right-1 -bottom-1 sm:-right-2 sm:-bottom-2 opacity-[0.12] pointer-events-none', decorClass)}>
        <DecorIcon className="h-12 w-12 sm:h-24 sm:w-24" strokeWidth={1.25} />
      </div>
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground relative z-10 leading-tight">
        {label}
      </p>
      <p className={cn('text-lg sm:text-3xl font-bold tabular-nums mt-1 sm:mt-2 relative z-10 leading-tight', valueClass ?? 'text-foreground')}>
        {loading ? <span className="inline-block h-6 w-16 sm:h-9 sm:w-28 rounded-lg bg-muted animate-pulse" /> : value}
      </p>
      <div className={cn('flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-3 relative z-10', footerClass)}>
        <FooterIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
        <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide truncate">{footer}</span>
      </div>
    </motion.div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-colors',
        active
          ? 'bg-primary/10 text-primary border border-primary/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent',
      )}
    >
      {children}
    </button>
  );
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = React.useState<TxFilterType>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<TxFilterStatus>('ALL');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [dateRangeError, setDateRangeError] = React.useState<string | null>(null);

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (!value) {
      setDateRangeError(null);
      return;
    }
    if (dateTo && value > dateTo) {
      setDateTo(value);
      setDateRangeError('End date was adjusted to match the start date.');
      return;
    }
    setDateRangeError(null);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    if (!value) {
      setDateRangeError(null);
      return;
    }
    if (dateFrom && value < dateFrom) {
      setDateFrom(value);
      setDateRangeError('Start date was adjusted to match the end date.');
      return;
    }
    setDateRangeError(null);
  };

  React.useEffect(() => {
    if (!dateRangeError) return;
    const timer = window.setTimeout(() => setDateRangeError(null), 4000);
    return () => window.clearTimeout(timer);
  }, [dateRangeError]);
  const [statementYear, setStatementYear] = React.useState(new Date().getFullYear());
  const [statementMonth, setStatementMonth] = React.useState(new Date().getMonth() + 1);
  const [summaryMonth, setSummaryMonth] = React.useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = React.useState(new Date().getFullYear());
  const [isDepositOpen, setIsDepositOpen] = React.useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<WalletTransaction | null>(null);

  const depositIntent = useUIStore((s) => s.depositIntent);
  const setDepositIntent = useUIStore((s) => s.setDepositIntent);
  React.useEffect(() => {
    if (depositIntent) {
      setIsDepositOpen(true);
      setDepositIntent(false);
    }
  }, [depositIntent, setDepositIntent]);

  // Previously opened a second, unpooled `io(.../trading)` connection here to
  // listen for `transaction_update` — an event the backend never emits
  // (confirmed repo-wide). It was 100% dead code that still paid the full
  // cost of a duplicate WebSocket handshake + reconnection loop on every
  // Wallet page visit. Removed; balance/transactions refresh via the
  // existing React Query polling and the manual refresh button below.


  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.getBalance(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const transactionsQuery = useInfiniteQuery({
    queryKey: ['wallet-transactions', typeFilter, statusFilter, dateFrom, dateTo],
    queryFn: ({ pageParam }) =>
      walletApi.getTransactions({
        cursor: pageParam || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 15,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });

  const summaryRange = React.useMemo(() => {
    const start = new Date(summaryYear, summaryMonth - 1, 1);
    const end = new Date(summaryYear, summaryMonth, 0);
    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    };
  }, [summaryMonth, summaryYear]);

  const summaryQuery = useQuery({
    queryKey: ['wallet-summary', summaryRange.dateFrom, summaryRange.dateTo],
    queryFn: () =>
      walletApi.getTransactions({
        ...summaryRange,
        limit: 200,
      }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const statementRange = React.useMemo(() => {
    const start = new Date(statementYear, statementMonth - 1, 1);
    const end = new Date(statementYear, statementMonth, 0);
    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    };
  }, [statementMonth, statementYear]);

  const statementAvailabilityQuery = useQuery({
    queryKey: ['wallet-statement-availability', statementRange.dateFrom, statementRange.dateTo],
    queryFn: () =>
      walletApi.getTransactions({
        ...statementRange,
        status: 'CONFIRMED',
        limit: 1,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const statementTransactionCount = statementAvailabilityQuery.data?.total ?? 0;
  const canDownloadStatement =
    !statementAvailabilityQuery.isLoading && statementTransactionCount > 0;

  const transactions = React.useMemo(
    () => transactionsQuery.data?.pages.flatMap((p) => p.transactions) ?? [],
    [transactionsQuery.data],
  );

  const summaryStats = React.useMemo(() => {
    const rows = summaryQuery.data?.transactions ?? [];
    let totalDeposit = 0;
    let totalWithdrawal = 0;
    rows.forEach((tx) => {
      if (tx.status !== 'CONFIRMED') return;
      const amt = Number(tx.amount);
      if (tx.direction === 'IN') totalDeposit += amt;
      else totalWithdrawal += amt;
    });
    return {
      totalDeposit,
      totalWithdrawal,
      netFlow: totalDeposit - totalWithdrawal,
      count: rows.length,
    };
  }, [summaryQuery.data]);

  const refreshWallet = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
    toast.success('Wallet refreshed');
  };

  const balanceError =
    balanceQuery.isError && !balanceQuery.isFetching
      ? ((balanceQuery.error as { response?: { status?: number }; message?: string })
          ?.response?.status === 401
          ? 'Session expired — sign in again to load your wallet.'
          : 'Could not load wallet balance. Check that the API is running, then refresh.')
      : null;

  const downloadStatement = async () => {
    if (!canDownloadStatement) {
      toast.message('No transactions this month', {
        description: 'There are no confirmed transactions for the selected month, so the PDF statement cannot be downloaded.',
      });
      return;
    }

    try {
      const blob = await walletApi.getStatement(statementYear, statementMonth);
      if (!blob || blob.size === 0) {
        toast.error('Statement unavailable', {
          description: 'The PDF for this month could not be generated.',
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profytron_statement_${statementYear}_${statementMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const err = error as { response?: { data?: Blob | { message?: string } } };
      const data = err?.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text) as { message?: string };
          toast.error(parsed.message || 'Failed to download statement');
          return;
        } catch {
          toast.error('Failed to download statement');
          return;
        }
      }
      toast.error(
        (typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
          ? data.message
          : null) || 'Failed to download statement',
      );
    }
  };

  const total = Number(balanceQuery.data?.total ?? 0);
  const available = Number(balanceQuery.data?.available ?? 0);
  const reserved = Number((balanceQuery.data?.pendingIn ?? 0) + (balanceQuery.data?.pendingOut ?? 0));
  const currency = balanceQuery.data?.currency ?? 'INR';
  const loading = balanceQuery.isLoading;

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - i);
  }, []);

  return (
    <div className="space-y-5 pb-8">
      { }
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Wallet</span>
      </div>

      { }
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Wallet</h1>
            <p className="text-sm text-muted-foreground mt-1">Ledger • Deposits • Withdrawals</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
          <button
            type="button"
            onClick={refreshWallet}
            className="btn-premium-ghost inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground"
            aria-label="Refresh wallet"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <Button
            type="button"
            onClick={() => setIsDepositOpen(true)}
            data-tour="wallet-deposit-cta"
            className="btn-premium h-9 flex-1 sm:flex-none px-3 sm:px-4 gap-1 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold uppercase tracking-wide"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Deposit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsWithdrawOpen(true)}
            className="btn-premium-ghost h-9 flex-1 sm:flex-none px-3 sm:px-4 gap-1 rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card text-[11px] sm:text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30"
          >
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Withdraw
          </Button>
        </div>
      </motion.div>

      {balanceError ? (
        <div
          role="alert"
          className="rounded-[var(--radius-button)] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">{balanceError}</p>
          <button
            type="button"
            onClick={() => void balanceQuery.refetch()}
            className="mt-2 text-xs font-semibold uppercase tracking-wide underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : null}

      { }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <BalanceCard
          label="Total Balance"
          value={formatCurrency(total, currency)}
          footer="Live Balance"
          footerIcon={() => <span className="h-1.5 w-1.5 rounded-full bg-primary block" />}
          footerClass="text-primary"
          gradient="bg-gradient-to-br from-primary/[0.08] to-primary/[0.02]"
          decorIcon={WalletIcon}
          decorClass="text-primary"
          loading={loading}
        />
        <BalanceCard
          label="Available"
          value={formatCurrency(available, currency)}
          footer="Ready to trade"
          footerIcon={TrendingUp}
          footerClass="text-chart-3"
          valueClass="text-chart-3"
          gradient="bg-gradient-to-br from-chart-3/[0.08] to-chart-3/[0.02]"
          decorIcon={WalletIcon}
          decorClass="text-chart-3"
          loading={loading}
          delay={0.05}
        />
        <BalanceCard
          label="Reserved"
          value={formatCurrency(reserved, currency)}
          footer="Pending settlement"
          footerIcon={Clock}
          footerClass="text-chart-4"
          valueClass="text-chart-4"
          gradient="bg-gradient-to-br from-chart-4/[0.08] to-chart-4/[0.02]"
          decorIcon={Lock}
          decorClass="text-chart-4"
          loading={loading}
          delay={0.1}
        />
      </div>

      { }
      <div className="dashboard-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Filter</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'SUBSCRIPTION_PAYMENT'] as TxFilterType[]).map((t) => (
              <FilterPill key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                {t === 'ALL' ? 'All' : t === 'SUBSCRIPTION_PAYMENT' ? 'Subs' : t.charAt(0) + t.slice(1).toLowerCase()}
              </FilterPill>
            ))}
          </div>

          <div className="hidden sm:block h-4 w-px bg-[var(--card-border)]" />

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'PENDING', 'CONFIRMED', 'FAILED'] as TxFilterStatus[]).map((s) => (
              <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
              </FilterPill>
            ))}
          </div>

          <div className="hidden sm:block h-4 w-px bg-[var(--card-border)]" />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <WalletDatePicker
                value={dateFrom}
                max={dateTo || WALLET_DATE_MAX}
                onChange={handleDateFromChange}
                ariaLabel="Start date"
                placeholder="Start date"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <WalletDatePicker
                value={dateTo}
                min={dateFrom || undefined}
                max={WALLET_DATE_MAX}
                onChange={handleDateToChange}
                ariaLabel="End date"
                placeholder="End date"
              />
            </div>
            {dateRangeError && (
              <p className="text-[11px] text-destructive">{dateRangeError}</p>
            )}
          </div>
        </div>

        <div className="responsive-table-shell">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-muted/20">
                {['Date', 'Type', 'Status', 'Description', 'Amount'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                      i === 4 ? 'text-right' : 'text-left',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {transactionsQuery.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${55 + j * 12}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : transactions.map((tx, idx) => {
                    const isOut = tx.direction === 'OUT';
                    const date = new Date(tx.createdAt);
                    const typeStyle = TYPE_STYLES[tx.type] ?? 'bg-muted text-muted-foreground border-[var(--card-border)]';
                    const statusStyle = STATUS_STYLES[tx.status] ?? 'bg-muted text-muted-foreground border-[var(--card-border)]';
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View payment details for ${TYPE_LABELS[tx.type] ?? tx.type}`}
                        onClick={() => setSelectedTx(tx)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedTx(tx);
                          }
                        }}
                        className="group cursor-pointer hover:bg-[color-mix(in_srgb,var(--primary)_4%,var(--muted))] transition-colors duration-200 focus-visible:outline-none focus-visible:bg-[color-mix(in_srgb,var(--primary)_6%,var(--muted))]"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-foreground">{date.toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{date.toLocaleTimeString()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border', typeStyle)}>
                            {TYPE_LABELS[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border', statusStyle)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-muted-foreground">{tx.description || tx.reference || '—'}</span>
                          {tx.billingId && (
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80 truncate max-w-[14rem]">
                              {tx.billingId}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={cn('text-sm font-bold tabular-nums', isOut ? 'text-destructive' : 'text-chart-3')}>
                            {isOut ? '−' : '+'}
                            {formatCurrency(Number(tx.amount), currency)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!transactionsQuery.isLoading && transactions.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-[var(--card-border)]">
              <WalletIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground">Make your first deposit to get started</p>
            </div>
            <Button
              type="button"
              onClick={() => setIsDepositOpen(true)}
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide hover:bg-primary/90"
            >
              Make a Deposit
            </Button>
          </div>
        )}

        {transactionsQuery.hasNextPage && (
          <div className="px-5 py-4 border-t border-[var(--card-border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => transactionsQuery.fetchNextPage()}
              disabled={transactionsQuery.isFetchingNextPage}
              className="w-full h-9 rounded-xl border border-[var(--card-border)] bg-card text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {transactionsQuery.isFetchingNextPage ? 'Loading…' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      { }
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="dashboard-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Monthly Statement</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Year</label>
              <select
                value={statementYear}
                onChange={(e) => setStatementYear(Number(e.target.value))}
                aria-label="Statement year"
                className="h-9 min-w-[100px] rounded-xl border border-[var(--card-border)] bg-card px-3 text-sm text-foreground outline-none focus:border-primary/40"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Month</label>
              <select
                value={statementMonth}
                onChange={(e) => setStatementMonth(Number(e.target.value))}
                aria-label="Statement month"
                className="h-9 min-w-[130px] rounded-xl border border-[var(--card-border)] bg-card px-3 text-sm text-foreground outline-none focus:border-primary/40"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={downloadStatement}
              disabled={statementAvailabilityQuery.isLoading || !canDownloadStatement}
              title={
                !statementAvailabilityQuery.isLoading && !canDownloadStatement
                  ? 'No confirmed transactions for this month'
                  : undefined
              }
              className="h-9 px-4 rounded-xl border border-[var(--card-border)] bg-card text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
          {!statementAvailabilityQuery.isLoading && !canDownloadStatement && (
            <p className="mt-2 text-xs text-muted-foreground">
              No confirmed transactions this month, so the PDF statement is unavailable.
            </p>
          )}
        </div>

        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction Summary</p>
            <select
              value={`${summaryYear}-${summaryMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setSummaryYear(y);
                setSummaryMonth(m);
              }}
              aria-label="Transaction summary period"
              className="h-8 rounded-lg border border-[var(--card-border)] bg-card px-2.5 text-xs text-foreground outline-none focus:border-primary/40"
            >
              {yearOptions.flatMap((y) =>
                MONTH_NAMES.map((name, i) => (
                  <option key={`${y}-${i + 1}`} value={`${y}-${i + 1}`}>
                    {name} {y}
                  </option>
                )),
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Deposit', value: formatCurrency(summaryStats.totalDeposit, currency), icon: ArrowDownLeft, iconBg: 'bg-chart-3/10 text-chart-3' },
              { label: 'Total Withdrawal', value: formatCurrency(summaryStats.totalWithdrawal, currency), icon: ArrowUpRight, iconBg: 'bg-destructive/10 text-destructive' },
              { label: 'Net Flow', value: formatCurrency(summaryStats.netFlow, currency), icon: ArrowLeftRight, iconBg: 'bg-chart-5/10 text-chart-5' },
              { label: 'Transactions', value: summaryQuery.isLoading ? '—' : String(summaryStats.count), icon: List, iconBg: 'bg-primary/10 text-primary' },
            ].map(({ label, value, icon: Icon, iconBg }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-muted/20 p-3">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', iconBg)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{label}</p>
                  <p className="text-sm font-bold tabular-nums text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DepositModal open={isDepositOpen} onOpenChange={setIsDepositOpen} />
      <WithdrawSheet open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen} availableBalance={available} />
      <TransactionDetailModal
        open={Boolean(selectedTx)}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null);
        }}
        transaction={selectedTx}
        currency={currency}
      />
    </div>
  );
}
