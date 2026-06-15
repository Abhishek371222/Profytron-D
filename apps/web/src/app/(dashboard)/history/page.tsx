'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
 History, 
 Search, 
 Download, 
 Filter, 
 ArrowUpRight, 
 ArrowDownRight, 
 Calendar,
 Box,
 Brain,
 X
} from '@/components/ui/icons';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
  DashFilterPill,
} from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { toast } from 'sonner';


const mapRangeToAnalytics = (range: 'ALL' | '7D' | '30D' | '90D'): AnalyticsRange => {
 if (range === '7D') return '1w';
 if (range === '30D') return '1m';
 if (range === '90D') return '3m';
 return 'all';
};

const formatPrice = (value: number | null) => {
 if (value === null || Number.isNaN(value)) {
  return '--';
 }
 if (Math.abs(value) >= 1000) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
 }
 return value.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
};

export default function HistoryPage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedStrategy, setSelectedStrategy] = useState('All Strategies');
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
 const [selectedRange, setSelectedRange] = useState<'ALL' | '7D' | '30D' | '90D'>('ALL');

 const pageSize = 5;

 const {
  data: liveHistory,
  isFetching,
  isLoading,
  isError,
 } = useQuery({
  queryKey: ['history-export', selectedRange],
  queryFn: async () => {
   const payload = await analyticsApi.getTradeExport(mapRangeToAnalytics(selectedRange));
   return payload.rows.map((row, index) => ({
    id: row.id || String(index + 1),
    asset: row.symbol,
    type: row.direction === 'BUY' ? 'Long' : 'Short',
    amount: String(row.volume),
    entry: formatPrice(row.openPrice),
    exit: formatPrice(row.closePrice),
    pnl: row.profit ?? 0,
    status: row.status === 'CLOSED' ? 'Closed' : row.status === 'OPEN' ? 'Open' : 'Canceled',
    time: new Date(row.closedAt ?? row.openedAt).toISOString().slice(0, 16).replace('T', ' '),
    strategy: row.strategyName ?? 'Manual Trades',
   }));
  },
 });

 const historyRows = liveHistory ?? [];

 React.useEffect(() => {
  if (isError) {
   toast.error('Live history unavailable', {
    description: 'Could not fetch trade history from the server.',
   });
  }
 }, [isError]);

 const strategyOptions = useMemo(() => {
  const unique = Array.from(new Set(historyRows.map((trade) => trade.strategy)));
  return ['All Strategies', ...unique];
 }, [historyRows]);

 const filteredHistory = useMemo(() => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const now = new Date();

   return historyRows.filter((trade) => {
   if (selectedStrategy !== 'All Strategies' && trade.strategy !== selectedStrategy) {
	return false;
   }

   if (selectedRange !== 'ALL') {
	const tradeDate = new Date(trade.time.replace(' ', 'T'));
	const diffMs = now.getTime() - tradeDate.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);
	const limit = selectedRange === '7D' ? 7 : selectedRange === '30D' ? 30 : 90;
	if (diffDays > limit) {
	 return false;
	}
   }

   if (!normalizedQuery) {
	return true;
   }

   const haystack = `${trade.id} ${trade.asset} ${trade.type} ${trade.strategy} ${trade.time}`.toLowerCase();
   return haystack.includes(normalizedQuery);
  });
 }, [historyRows, searchQuery, selectedRange, selectedStrategy]);

 const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

 const pagedHistory = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return filteredHistory.slice(start, end);
 }, [currentPage, filteredHistory]);

 const selectedTrade = useMemo(
  () => filteredHistory.find((trade) => trade.id === selectedTradeId) || null,
  [filteredHistory, selectedTradeId]
 );

 const aggregatePnl = useMemo(
  () => filteredHistory.reduce((total, trade) => total + trade.pnl, 0),
  [filteredHistory]
 );

 const rangeButtonLabel = useMemo(() => {
  if (selectedRange === 'ALL') return 'Select Custom Range';
  return `Range: Last ${selectedRange}`;
 }, [selectedRange]);

 const cycleRange = () => {
  const order: Array<'ALL' | '7D' | '30D' | '90D'> = ['ALL', '7D', '30D', '90D'];
  const index = order.indexOf(selectedRange);
  setSelectedRange(order[(index + 1) % order.length]);
  setCurrentPage(1);
 };

 const handleExport = () => {
  const header = ['Execution ID', 'Asset', 'Strategy', 'Type', 'Volume', 'PnL', 'Status', 'Timestamp'];
  const rows = filteredHistory.map((trade) => [
   `TR_${trade.id}X77_${trade.id.slice(-3).toUpperCase()}`,
   trade.asset,
   trade.strategy,
   trade.type,
   `${trade.amount} Lots`,
   trade.pnl.toFixed(2),
   trade.status,
   trade.time,
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `execution-vault-${selectedRange.toLowerCase()}-${Date.now()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
 };

 React.useEffect(() => {
  setCurrentPage(1);
 }, [searchQuery, selectedRange, selectedStrategy]);

 React.useEffect(() => {
  if (currentPage > totalPages) {
   setCurrentPage(totalPages);
  }
 }, [currentPage, totalPages]);

 return (
 <DashboardPage>
 <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'History' }]} />

 <DashboardPageHeader
  title="Trade History"
  description="Immutable ledger of all executions, exports, and performance."
  icon={History}
  actions={
   <DashButton variant="primary" onClick={handleExport} className="gap-2">
    <Download className="w-3.5 h-3.5" />
    Export CSV
   </DashButton>
  }
 />

 <div className="dashboard-card flex flex-wrap items-center gap-4 p-4">
  <div className="flex items-center gap-2">
   <span className="dash-eyebrow">Aggregate P&amp;L</span>
   <span className={cn('text-lg font-bold tabular-nums', aggregatePnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
    {aggregatePnl >= 0 ? '+' : '-'}${Math.abs(aggregatePnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
   </span>
  </div>
  <div className="h-4 w-px bg-[var(--card-border)]" />
  <div className="flex items-center gap-2">
   <div className={cn('w-2 h-2 rounded-full', isFetching ? 'bg-chart-4' : 'bg-chart-3')} />
   <span className="dash-eyebrow">{isFetching ? 'Syncing' : 'Synced'}</span>
  </div>
 </div>

 {/* Filter Bar */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 <div className="lg:col-span-2 relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Filter by asset or ID…"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="dash-input h-11 pl-11"
 />
 </div>
 <div className="relative">
 <select 
 value={selectedStrategy}
 onChange={(e) => setSelectedStrategy(e.target.value)}
 className="dash-input h-11 appearance-none cursor-pointer pr-10"
 >
 {strategyOptions.map((strategy) => (
  <option key={strategy} value={strategy}>{strategy}</option>
 ))}
 </select>
 <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
 </div>
 <DashButton onClick={cycleRange} variant="outline" className="gap-2 h-11">
 <Calendar className="w-4 h-4" />
 {rangeButtonLabel}
 </DashButton>
 </div>

 {/* Main Table */}
 <div className="dash-table-wrap overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full border-collapse">
 <thead>
 <tr className="border-b border-[var(--card-border)] bg-muted/50">
 {['Execution ID', 'Asset', 'Strategy', 'Type', 'Volume', 'Performance', 'Timestamp', 'Status'].map((head) => (
 <th key={head} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
 {head}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--card-border)]">
 {isLoading ? (
  Array.from({ length: pageSize }).map((_, i) => (
   <tr key={i} className="animate-pulse">
    {Array.from({ length: 8 }).map((__, j) => (
     <td key={j} className="px-5 py-4">
      <div className="h-4 rounded bg-foreground/5" />
     </td>
    ))}
   </tr>
  ))
 ) : pagedHistory.map((trade, i) => (
 <motion.tr
 key={trade.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.05 }}
 className="group hover:bg-foreground/2 transition-all cursor-pointer"
 onClick={() => setSelectedTradeId(trade.id)}
 >
 <td className="px-5 py-4">
 <span className="text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors">TR_{trade.id}</span>
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
 <Box className="w-4 h-4 text-foreground/40" />
 </div>
 <span className="text-sm font-semibold text-foreground tracking-tight">{trade.asset}</span>
 </div>
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
 <span className="text-sm font-bold text-foreground/60 tracking-tight">{trade.strategy}</span>
 </div>
 </td>
 <td className="px-5 py-4">
 <span className={cn(
"text-xs font-semibold px-3 py-1 rounded-full border tracking-widest uppercase",
 trade.type === 'Long' ?"bg-chart-3/10 text-chart-3 border-chart-3/20" :"bg-destructive/10 text-destructive border-destructive/20"
 )}>
 {trade.type}
 </span>
 </td>
 <td className="px-5 py-4 font-mono text-xs text-foreground/60">
 {trade.amount} Lots
 </td>
 <td className="px-5 py-4">
 <div className="flex flex-col">
 <span className={cn(
"text-sm font-semibold font-mono tracking-tight",
 trade.pnl > 0 ?"text-chart-3" :"text-destructive"
 )}>
 {trade.pnl > 0 ? '+' : ''}${Math.abs(trade.pnl).toLocaleString()}
 </span>
 <div className="flex items-center gap-1 mt-1">
 {trade.pnl > 0 ? <ArrowUpRight className="w-3 h-3 text-chart-3/40" /> : <ArrowDownRight className="w-3 h-3 text-destructive/40" />}
 <span className="text-xs text-muted-foreground">Settled</span>
 </div>
 </div>
 </td>
 <td className="px-5 py-4">
 <span className="text-sm text-muted-foreground">{trade.time}</span>
 </td>
 <td className="px-5 py-4">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-chart-3" />
 <span className="text-sm font-medium text-foreground">{trade.status}</span>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Empty State */}
 {!isLoading && filteredHistory.length === 0 && (
 <div className="py-32 flex flex-col items-center justify-center space-y-6">
 <div className="w-20 h-20 rounded-3xl bg-foreground/5 border border-border flex items-center justify-center animate-pulse">
 <Brain className="w-10 h-10 text-foreground/10" />
 </div>
 <p className="text-sm font-medium text-muted-foreground">Vault memory: empty</p>
 </div>
 )}
 </div>

 {selectedTrade && (
  <div className="dashboard-card p-6 space-y-4">
   <div className="flex items-center justify-between">
	<h3 className="text-base font-semibold text-foreground">Execution Detail</h3>
	<button onClick={() => setSelectedTradeId(null)} className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors">
	 <X className="w-4 h-4" />
	</button>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Execution ID</p>
	 <p className="text-sm font-mono text-foreground">TR_{selectedTrade.id}</p>
	</div>
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Entry / Exit</p>
   <p className="text-xs font-semibold text-foreground">{selectedTrade.entry}{' -> '}{selectedTrade.exit}</p>
	</div>
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Type / Volume</p>
	 <p className="text-xs font-semibold text-foreground">{selectedTrade.type} / {selectedTrade.amount} Lots</p>
	</div>
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Settlement</p>
	 <p className={cn('text-xs font-semibold', selectedTrade.pnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
	  {selectedTrade.pnl >= 0 ? '+' : '-'}${Math.abs(selectedTrade.pnl).toLocaleString()}
	 </p>
	</div>
   </div>
  </div>
 )}

 {/* Pagination / Status */}
 <div className="flex justify-between items-center text-sm text-muted-foreground">
 <span>
  Showing {filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
  – {Math.min(currentPage * pageSize, filteredHistory.length)} of {filteredHistory.length} trades
 </span>
 <div className="flex items-center gap-4">
 <button
  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
  disabled={currentPage === 1}
  className="hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
 >
  Prev
 </button>
 <div className="flex gap-2">
 {Array.from({ length: Math.min(3, totalPages) }).map((_, index) => {
  const page = Math.min(totalPages, Math.max(1, currentPage - 1) + index);
  return (
   <button
	key={page}
	onClick={() => setCurrentPage(page)}
	className={cn('transition-colors hover:text-primary', page === currentPage ? 'text-foreground' : 'text-foreground/30')}
   >
	{page}
   </button>
  );
 })}
 {totalPages > 3 && <span>...</span>}
 {totalPages > 3 && (
  <button onClick={() => setCurrentPage(totalPages)} className={cn('transition-colors hover:text-primary', totalPages === currentPage ? 'text-foreground' : 'text-foreground/30')}>
   {totalPages}
  </button>
 )}
 </div>
 <button
  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
  disabled={currentPage === totalPages}
  className="hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
 >
  Next
 </button>
 </div>
 </div>
 </DashboardPage>
 );
}
