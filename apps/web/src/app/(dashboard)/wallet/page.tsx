'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { walletApi } from '@/lib/api/wallet';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawSheet } from '@/components/wallet/WithdrawSheet';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Download, Filter, RefreshCcw, TrendingUp, Clock, Plus } from 'lucide-react';
import { Wallet } from '@/components/ui/icons';

type TxFilterType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'SUBSCRIPTION_PAYMENT';
type TxFilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'FAILED';

function Counter({ to, decimals = 2 }: { to: number; decimals?: number }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    const duration = 900;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(to * ease);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

const TYPE_STYLES: Record<string, string> = {
  DEPOSIT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  WITHDRAWAL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  SUBSCRIPTION_PAYMENT: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  SUBSCRIPTION_PAYMENT: 'Subscription',
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const [typeFilter, setTypeFilter] = React.useState<TxFilterType>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<TxFilterStatus>('ALL');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [statementYear, setStatementYear] = React.useState(new Date().getFullYear());
  const [statementMonth, setStatementMonth] = React.useState(new Date().getMonth() + 1);
  const [isDepositOpen, setIsDepositOpen] = React.useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.profytron.example';
    const socket: Socket = io(`${wsUrl}/trading`, { auth: { token }, transports: ['websocket'] });
    const onUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    };
    socket.on('transaction_update', onUpdate);
    return () => { socket.off('transaction_update', onUpdate); socket.disconnect(); };
  }, [queryClient, token]);

  const balanceQuery = useQuery({ queryKey: ['wallet-balance'], queryFn: () => walletApi.getBalance() });

  const transactionsQuery = useInfiniteQuery({
    queryKey: ['wallet-transactions', typeFilter, statusFilter, dateFrom, dateTo],
    queryFn: ({ pageParam }) => walletApi.getTransactions({
      cursor: pageParam || undefined,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 15,
    }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const transactions = React.useMemo(
    () => transactionsQuery.data?.pages.flatMap((p) => p.transactions) ?? [],
    [transactionsQuery.data]
  );

  React.useEffect(() => {
    if (balanceQuery.isError || transactionsQuery.isError) {
      toast.error('Wallet service unavailable');
    }
  }, [balanceQuery.isError, transactionsQuery.isError]);

  const refreshWallet = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    toast.success('Wallet refreshed');
  };

  const downloadStatement = async () => {
    try {
      const blob = await walletApi.getStatement(statementYear, statementMonth);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profytron_statement_${statementYear}_${statementMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to download statement');
    }
  };

  const total = Number(balanceQuery.data?.total ?? 0);
  const available = Number(balanceQuery.data?.available ?? 0);
  const reserved = Number((balanceQuery.data?.pendingIn ?? 0) + (balanceQuery.data?.pendingOut ?? 0));
  const currency = balanceQuery.data?.currency ?? 'INR';

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Wallet</h1>
            <p className="text-xs text-white/30 uppercase tracking-[0.3em] font-semibold mt-0.5">Ledger · Deposits · Withdrawals</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshWallet}
            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDepositOpen(true)}
            className="h-10 px-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Deposit
          </button>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative rounded-2xl bg-gradient-to-br from-cyan-500/8 to-indigo-500/8 border border-cyan-500/15 p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/8 blur-[60px] rounded-full pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Total Balance</p>
          <p className="text-3xl font-bold text-white">
            <span className="text-sm font-semibold text-white/40 mr-1">{currency}</span>
            {balanceQuery.isLoading ? <span className="animate-pulse text-white/20">—</span> : <Counter to={total} />}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-widest">Live Balance</span>
          </div>
        </div>

        <div className="relative rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/6 blur-[40px] rounded-full pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Available</p>
          <p className="text-3xl font-bold text-emerald-400">
            {balanceQuery.isLoading ? <span className="animate-pulse text-white/20">—</span> : <Counter to={available} />}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <TrendingUp className="w-3 h-3 text-emerald-400/50" />
            <span className="text-[10px] text-white/25 font-semibold uppercase tracking-widest">Ready to Trade</span>
          </div>
        </div>

        <div className="relative rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/6 blur-[40px] rounded-full pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-3">Reserved</p>
          <p className="text-3xl font-bold text-amber-400">
            {balanceQuery.isLoading ? <span className="animate-pulse text-white/20">—</span> : <Counter to={reserved} />}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Clock className="w-3 h-3 text-amber-400/50" />
            <span className="text-[10px] text-white/25 font-semibold uppercase tracking-widest">Pending Settlement</span>
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 py-4 border-b border-white/[0.05] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-white/20">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Filter</span>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'SUBSCRIPTION_PAYMENT'] as TxFilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                  typeFilter === t
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-white/3 border-white/5 text-white/25 hover:border-white/10 hover:text-white/50'
                )}
              >
                {t === 'ALL' ? 'All' : t === 'SUBSCRIPTION_PAYMENT' ? 'Subs' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            {(['ALL', 'PENDING', 'CONFIRMED', 'FAILED'] as TxFilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                  statusFilter === s
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/3 border-white/5 text-white/25 hover:border-white/10 hover:text-white/50'
                )}
              >
                {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-7 rounded-lg bg-white/5 border border-white/10 px-2 text-[11px] text-white/50 outline-none focus:border-white/20 transition-colors"
            />
            <span className="text-white/15 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-7 rounded-lg bg-white/5 border border-white/10 px-2 text-[11px] text-white/50 outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Date', 'Type', 'Status', 'Description', 'Amount'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-6 py-3 text-[10px] font-bold uppercase tracking-[0.26em] text-white/25',
                      i === 4 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {transactionsQuery.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-3 bg-white/5 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : transactions.map((tx, idx) => {
                    const isOut = tx.direction === 'OUT';
                    const date = new Date(tx.createdAt);
                    const typeStyle = TYPE_STYLES[tx.type] ?? 'bg-white/5 text-white/40 border-white/10';
                    const statusStyle = STATUS_STYLES[tx.status] ?? 'bg-white/5 text-white/40 border-white/10';
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-white/[0.015] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-white/70">{date.toLocaleDateString()}</p>
                          <p className="text-[10px] text-white/25 mt-0.5">{date.toLocaleTimeString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border', typeStyle)}>
                            {TYPE_LABELS[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border', statusStyle)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-white/40 font-mono">
                            {tx.description || tx.reference || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn('text-sm font-bold font-mono', isOut ? 'text-rose-400' : 'text-emerald-400')}>
                            {isOut ? '−' : '+'}{currency} {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!transactionsQuery.isLoading && transactions.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white/10" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-white/25 uppercase tracking-widest">No Transactions Yet</p>
              <p className="text-xs text-white/15">Make your first deposit to get started</p>
            </div>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="h-10 px-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
            >
              Make a Deposit
            </button>
          </div>
        )}

        {/* Load More */}
        {transactionsQuery.hasNextPage && (
          <div className="px-5 py-4 border-t border-white/[0.05]">
            <button
              onClick={() => transactionsQuery.fetchNextPage()}
              disabled={transactionsQuery.isFetchingNextPage}
              className="w-full h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-bold text-white/30 uppercase tracking-widest hover:bg-white/[0.06] transition-all disabled:opacity-40"
            >
              {transactionsQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Statement Download */}
      <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-4">Monthly Statement</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] text-white/20 block mb-1.5">Year</label>
            <input
              type="number"
              value={statementYear}
              onChange={(e) => setStatementYear(Number(e.target.value || new Date().getFullYear()))}
              className="w-24 h-9 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/20 block mb-1.5">Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={statementMonth}
              onChange={(e) => setStatementMonth(Number(e.target.value || 1))}
              className="w-20 h-9 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <button
            onClick={downloadStatement}
            className="h-9 px-5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/50 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <DepositModal open={isDepositOpen} onOpenChange={setIsDepositOpen} />
      <WithdrawSheet open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen} availableBalance={available} />
    </div>
  );
}
