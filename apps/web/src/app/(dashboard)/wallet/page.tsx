'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { walletApi } from '@/lib/api/wallet';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawSheet } from '@/components/wallet/WithdrawSheet';
import { demoWalletBalance, demoWalletTransactions } from '@/lib/api/demoData';
import { RefreshCcw } from 'lucide-react';

type TxFilterType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'SUBSCRIPTION_PAYMENT';
type TxFilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'FAILED';

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
    if (!token) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const socket: Socket = io(`${wsUrl}/trading`, {
      auth: { token },
      transports: ['websocket'],
    });

    const onTransactionUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    };

    socket.on('transaction_update', onTransactionUpdate);

    return () => {
      socket.off('transaction_update', onTransactionUpdate);
      socket.disconnect();
    };
  }, [queryClient, token]);

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.getBalance(),
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
  });

  const transactions = React.useMemo(() => {
    const apiTxs = transactionsQuery.data?.pages.flatMap((page) => page.transactions);
    return (apiTxs && apiTxs.length > 0) ? apiTxs : demoWalletTransactions;
  }, [transactionsQuery.data]);

  const hasLiveBalance = Boolean(balanceQuery.data);
  const hasLiveTransactions = Boolean(transactionsQuery.data?.pages.some((page) => page.transactions.length > 0));
  const isFallbackMode = !hasLiveBalance || !hasLiveTransactions;

  React.useEffect(() => {
    if (balanceQuery.isError || transactionsQuery.isError) {
      toast.error('Wallet live feed unavailable', {
        description: 'Showing fallback wallet data while services recover.',
      });
    }
  }, [balanceQuery.isError, transactionsQuery.isError]);

  const refreshWallet = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    toast.success('Wallet refresh queued');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Wallet</h1>
          <p className="text-sm text-white/60">Ledger, deposits, withdrawals, and monthly statements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshWallet} className="inline-flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsDepositOpen(true)}>Deposit</Button>
          <Button variant="outline" onClick={() => setIsWithdrawOpen(true)}>
            Withdraw
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
        Data Mode: <span className={isFallbackMode ? 'text-amber-300' : 'text-emerald-300'}>{isFallbackMode ? 'Fallback' : 'Live'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Total</p>
          <p className="text-xl font-semibold text-white">${Number(balanceQuery.data?.total ?? demoWalletBalance.totalBalance).toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Available</p>
          <p className="text-xl font-semibold text-emerald-400">${Number(balanceQuery.data?.available ?? demoWalletBalance.availableBalance).toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Reserved</p>
          <p className="text-xl font-semibold text-amber-300">${Number(hasLiveBalance ? (balanceQuery.data?.pendingIn ?? 0) + (balanceQuery.data?.pendingOut ?? 0) : demoWalletBalance.reservedBalance).toFixed(2)}</p>
        </Card>
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Currency</p>
          <p className="text-xl font-semibold text-orange-400">{balanceQuery.data?.currency || demoWalletBalance.currency}</p>
        </Card>
      </div>

      <Card className="p-4 bg-black/40 border-white/10 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-white/60 mb-1">Type</p>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TxFilterType)}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            >
              <option value="ALL">All</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="SUBSCRIPTION_PAYMENT">Subscription</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Status</p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TxFilterStatus)}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">From</p>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">To</p>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/60 border-b border-white/10">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5">
                  <td className="py-2">{new Date(('createdAt' in tx ? tx.createdAt : tx.timestamp) as string).toLocaleString()}</td>
                  <td className="py-2">{tx.type}</td>
                  <td className="py-2">{tx.status}</td>
                  <td className="py-2">{('description' in tx ? tx.description : undefined) || tx.reference || '-'}</td>
                  <td className="py-2 text-right">
                    {('direction' in tx && tx.direction === 'OUT') ? '-' : '+'}INR {Number(tx.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactionsQuery.hasNextPage && (
          <Button
            variant="outline"
            onClick={() => transactionsQuery.fetchNextPage()}
            disabled={transactionsQuery.isFetchingNextPage}
          >
            {transactionsQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </Card>

      <Card className="p-4 bg-black/40 border-white/10">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-white/60 mb-1">Year</p>
            <input
              type="number"
              value={statementYear}
              onChange={(e) => setStatementYear(Number(e.target.value || new Date().getFullYear()))}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Month</p>
            <input
              type="number"
              min={1}
              max={12}
              value={statementMonth}
              onChange={(e) => setStatementMonth(Number(e.target.value || 1))}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            />
          </div>
          <Button onClick={downloadStatement}>Download Statement</Button>
        </div>
      </Card>

      <DepositModal open={isDepositOpen} onOpenChange={setIsDepositOpen} />
      <WithdrawSheet
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        availableBalance={Number(balanceQuery.data?.available ?? demoWalletBalance.availableBalance)}
      />
    </div>
  );
}
