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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { toast } from 'sonner';

const MOCK_HISTORY = [
 { id: '1', asset: 'EUR/USD', type: 'Long', amount: '2.5', entry: '1.08420', exit: '1.08950', pnl: 1325.50, status: 'Closed', time: '2026-04-10 14:22', strategy: 'MomentumApex v2' },
 { id: '2', asset: 'BTC/USDT', type: 'Short', amount: '0.15', entry: '64,250', exit: '63,120', pnl: 485.20, status: 'Closed', time: '2026-04-10 12:45', strategy: 'Scalp Pro' },
 { id: '3', asset: 'ETH/USDT', type: 'Long', amount: '4.2', entry: '3,450', exit: '3,410', pnl: -168.00, status: 'Closed', time: '2026-04-10 11:15', strategy: 'Deltra Trend' },
 { id: '4', asset: 'GBP/JPY', type: 'Long', amount: '1.8', entry: '191.45', exit: '192.10', pnl: 842.15, status: 'Closed', time: '2026-04-10 09:30', strategy: 'Your VWAP' },
 { id: '5', asset: 'GOLD', type: 'Short', amount: '10', entry: '2,345', exit: '2,352', pnl: -320.00, status: 'Closed', time: '2026-04-09 18:20', strategy: 'Metal Guard' },
 { id: '6', asset: 'USD/JPY', type: 'Long', amount: '3.0', entry: '151.20', exit: '151.85', pnl: 650.40, status: 'Closed', time: '2026-04-09 16:45', strategy: 'MomentumApex v1' },
 { id: '7', asset: 'SOL/USDT', type: 'Long', amount: '50', entry: '174.20', exit: '182.10', pnl: 395.00, status: 'Closed', time: '2026-04-09 14:10', strategy: 'Scalp Pro' },
];

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

 const historyRows = liveHistory && liveHistory.length > 0 ? liveHistory : MOCK_HISTORY;
 const isFallbackData = !liveHistory || liveHistory.length === 0;

 React.useEffect(() => {
  if (isError) {
   toast.error('Live history unavailable', {
    description: 'Showing local fallback data until API sync recovers.',
   });
  }
 }, [isError]);

 const strategyOptions = useMemo(() => {
  const unique = Array.from(new Set(historyRows.map((trade) => trade.strategy)));
  return ['All Strategies', ...unique];
 }, [historyRows]);

 const filteredHistory = useMemo(() => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const now = new Date('2026-04-10T23:59:59');

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
 <div className="p-8 space-y-10">
 {/* Header Section */}
 <div className="flex flex-col md:flex-row justify-between items-end gap-6">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
 <History className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h1 className="text-3xl font-semibold text-white uppercase tracking-tight">Execution_Vault</h1>
 <p className="text-xs text-white/30 font-bold uppercase tracking-[0.4em] mt-1">Immutable Transaction Ledger</p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="h-14 flex items-center gap-3 glass-strong px-6 rounded-2xl border border-white/5">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Aggregate Earnings</span>
 <span className={cn("text-xl font-semibold font-mono tracking-tight", aggregatePnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
 {aggregatePnl >= 0 ? '+' : '-'}${Math.abs(aggregatePnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
 </span>
 <div className="w-1 h-4 bg-white/10 mx-2" />
 <div className="flex items-center gap-2">
 <div className={cn('w-2 h-2 rounded-full', isFallbackData ? 'bg-amber-500' : 'bg-emerald-500')} />
 <span className="text-xs font-bold text-white/40 uppercase">{isFetching ? 'Syncing' : isFallbackData ? 'Fallback' : 'Synced'}</span>
 </div>
 </div>
 <Button onClick={handleExport} className="h-14 px-8 bg-white text-black hover:bg-white/90 rounded-2xl font-semibold uppercase tracking-widest gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
 <Download className="w-4 h-4" />
 Export Terminal Log
 </Button>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 <div className="lg:col-span-2 relative">
 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
 <input 
 type="text" 
 placeholder="FILTER BY ASSET OR ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-sm font-semibold tracking-[0.2em] text-white placeholder:text-white/10 focus:border-primary/30 transition-all outline-none"
 />
 </div>
 <div className="relative">
 <select 
 value={selectedStrategy}
 onChange={(e) => setSelectedStrategy(e.target.value)}
 className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm font-semibold tracking-widest text-white/60 appearance-none focus:text-white focus:border-primary/30 transition-all outline-none cursor-pointer"
 >
 {strategyOptions.map((strategy) => (
  <option key={strategy} value={strategy}>{strategy}</option>
 ))}
 </select>
 <Filter className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
 </div>
 <Button onClick={cycleRange} variant="ghost" className="h-14 border border-white/5 bg-white/2 rounded-2xl text-sm font-semibold uppercase tracking-widest text-white/40 hover:text-white gap-3">
 <Calendar className="w-4 h-4" />
 {rangeButtonLabel}
 </Button>
 </div>

 {/* Main Table */}
 <div className="glass-ultra rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
 {/* Table Background Glows */}
 <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
 <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

 <div className="overflow-x-auto relative z-10">
 <table className="w-full border-collapse">
 <thead>
 <tr className="border-b border-white/5 bg-white/1">
 {['Execution_ID', 'Asset_Token', 'Logic_System', 'Type', 'Volume', 'Performance', 'Timestamp', 'Status'].map((head) => (
 <th key={head} className="px-8 py-6 text-left text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">
 {head}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-white/3">
 {pagedHistory.map((trade, i) => (
 <motion.tr 
 key={trade.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.05 }}
 className="group hover:bg-white/2 transition-all cursor-pointer"
 onClick={() => setSelectedTradeId(trade.id)}
 >
 <td className="px-8 py-6">
 <span className="text-xs font-mono text-white/30 uppercase group-hover:text-primary transition-colors">TR_{trade.id}X77_{trade.id.slice(-3).toUpperCase()}</span>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
 <Box className="w-4 h-4 text-white/40" />
 </div>
 <span className="text-sm font-semibold text-white tracking-tight">{trade.asset}</span>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
 <span className="text-sm font-bold text-white/60 tracking-tight">{trade.strategy}</span>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className={cn(
"text-xs font-semibold px-3 py-1 rounded-full border tracking-widest uppercase",
 trade.type === 'Long' ?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :"bg-rose-500/10 text-rose-400 border-rose-500/20"
 )}>
 {trade.type}
 </span>
 </td>
 <td className="px-8 py-6 font-mono text-xs text-white/60">
 {trade.amount} Lots
 </td>
 <td className="px-8 py-6">
 <div className="flex flex-col">
 <span className={cn(
"text-sm font-semibold font-mono tracking-tight",
 trade.pnl > 0 ?"text-emerald-400" :"text-rose-400"
 )}>
 {trade.pnl > 0 ? '+' : ''}${Math.abs(trade.pnl).toLocaleString()}
 </span>
 <div className="flex items-center gap-1 mt-1">
 {trade.pnl > 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500/40" /> : <ArrowDownRight className="w-3 h-3 text-rose-500/40" />}
 <span className="text-xs font-bold text-white/20 uppercase">Settled Terminal</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <span className="text-xs font-bold text-white/30 tracking-widest">{trade.time}</span>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">{trade.status}</span>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Empty State Mock */}
 {filteredHistory.length === 0 && (
 <div className="py-32 flex flex-col items-center justify-center space-y-6">
 <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
 <Brain className="w-10 h-10 text-white/10" />
 </div>
 <p className="text-xs font-semibold text-white/20 uppercase tracking-[0.4em]">Vault Memory: Empty</p>
 </div>
 )}
 </div>

 {selectedTrade && (
  <div className="glass-ultra rounded-3xl border border-white/10 p-6 space-y-4">
   <div className="flex items-center justify-between">
	<h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Execution Detail</h3>
	<button onClick={() => setSelectedTradeId(null)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
	 <X className="w-4 h-4" />
	</button>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
	<div className="rounded-xl border border-white/10 bg-white/5 p-3">
	 <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Execution ID</p>
	 <p className="text-xs font-mono text-white">TR_{selectedTrade.id}X77_{selectedTrade.id.slice(-3).toUpperCase()}</p>
	</div>
	<div className="rounded-xl border border-white/10 bg-white/5 p-3">
	 <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Entry / Exit</p>
   <p className="text-xs font-semibold text-white">{selectedTrade.entry}{' -> '}{selectedTrade.exit}</p>
	</div>
	<div className="rounded-xl border border-white/10 bg-white/5 p-3">
	 <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Type / Volume</p>
	 <p className="text-xs font-semibold text-white">{selectedTrade.type} / {selectedTrade.amount} Lots</p>
	</div>
	<div className="rounded-xl border border-white/10 bg-white/5 p-3">
	 <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Settlement</p>
	 <p className={cn('text-xs font-semibold', selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
	  {selectedTrade.pnl >= 0 ? '+' : '-'}${Math.abs(selectedTrade.pnl).toLocaleString()}
	 </p>
	</div>
   </div>
  </div>
 )}

 {/* Pagination / Status */}
 <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-[0.2em] text-white/20">
 <span>
  Displaying {filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
  -{Math.min(currentPage * pageSize, filteredHistory.length)} of {filteredHistory.length} transmissions
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
	className={cn('transition-colors hover:text-primary', page === currentPage ? 'text-white' : 'text-white/30')}
   >
	{page}
   </button>
  );
 })}
 {totalPages > 3 && <span>...</span>}
 {totalPages > 3 && (
  <button onClick={() => setCurrentPage(totalPages)} className={cn('transition-colors hover:text-primary', totalPages === currentPage ? 'text-white' : 'text-white/30')}>
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
 </div>
 );
}
