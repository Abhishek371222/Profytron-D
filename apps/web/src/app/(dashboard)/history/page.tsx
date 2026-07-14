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
 Box,
 Brain,
 X
} from '@/components/ui/icons';
import {
 HistoryDateRangePicker,
 isTradeWithinHistoryRange,
 type HistoryDateRange,
} from '@/components/history/HistoryDateRangePicker';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { strategiesApi } from '@/lib/api/strategies';
import { formatBotName } from '@/lib/bot-labels';
import { toast } from 'sonner';


const mapRangeToAnalytics = (range: HistoryDateRange): AnalyticsRange => {
 if (range.type === 'custom') return 'all';
 if (range.preset === '30D') return '1m';
 if (range.preset === '60D') return '3m';
 return '3m';
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

/** Compact page list without duplicate last-page numbers (e.g. 9 10 10 … 10). */
function getHistoryPageItems(current: number, total: number): Array<number | 'ellipsis'> {
 if (total <= 1) return [1];
 if (total <= 5) {
  return Array.from({ length: total }, (_, i) => i + 1);
 }

 const items: Array<number | 'ellipsis'> = [1];
 let windowStart = Math.max(2, current - 1);
 let windowEnd = Math.min(total - 1, current + 1);

 if (current <= 3) {
  windowStart = 2;
  windowEnd = 4;
 }
 if (current >= total - 2) {
  windowStart = total - 3;
  windowEnd = total - 1;
 }

 windowStart = Math.max(2, windowStart);
 windowEnd = Math.min(total - 1, windowEnd);

 if (windowStart > 2) items.push('ellipsis');
 for (let page = windowStart; page <= windowEnd; page += 1) {
  items.push(page);
 }
 if (windowEnd < total - 1) items.push('ellipsis');
 items.push(total);
 return items;
}


export default function HistoryPage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [isPhone, setIsPhone] = useState(false);
 const [selectedStrategy, setSelectedStrategy] = useState('All bots');
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
 const [selectedRange, setSelectedRange] = useState<HistoryDateRange>({ type: 'preset', preset: '30D' });

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
   return payload.rows.map((row, index) => {
    const occurredAt = row.closedAt ?? row.openedAt;
    const direction = String(row.direction || '').toUpperCase();
    return {
    id: row.id || String(index + 1),
    asset: row.symbol,
    type: direction === 'LONG' || direction === 'BUY' ? 'Long' : 'Short',
    amount: String(row.volume),
    entry: formatPrice(row.openPrice),
    exit: formatPrice(row.closePrice),
    pnl: row.profit ?? 0,
    status: row.status === 'CLOSED' ? 'Closed' : row.status === 'OPEN' ? 'Open' : 'Canceled',
    occurredAt,
    time: new Date(occurredAt).toISOString().slice(0, 16).replace('T', ' '),
    strategy: (() => {
      const raw = String(row.strategyName || '').trim();
      if (!raw || /^copyfactory$/i.test(raw) || /^copy factory$/i.test(raw)) {
        return 'Your bot';
      }
      return formatBotName(raw);
    })(),
   };
   });
  },
 });

 const historyRows = liveHistory ?? [];

 const { data: myBots = [] } = useQuery({
  queryKey: ['history-my-bots'],
  queryFn: async () => {
   const rows = await strategiesApi.getMyStrategies();
   return (Array.isArray(rows) ? rows : [])
    .map((b: any) => formatBotName(String(b.name || b.strategy?.name || '')))
    .filter(Boolean);
  },
  staleTime: 60_000,
 });

 // Prefer real purchased bot name over generic "Your bot" / CopyFactory leftovers.
 const preferredBotName = useMemo(() => {
  const fromSubs = myBots.find((n) => n && !/^your bot$/i.test(n));
  return fromSubs || myBots[0] || null;
 }, [myBots]);

 const displayRows = useMemo(() => {
  if (!preferredBotName) return historyRows;
  return historyRows.map((row) => {
   const name = formatBotName(row.strategy);
   if (!name || /^your bot$/i.test(name) || /^copyfactory$/i.test(name) || /^copy factory$/i.test(name)) {
    return { ...row, strategy: preferredBotName };
   }
   return { ...row, strategy: name };
  });
 }, [historyRows, preferredBotName]);

 React.useEffect(() => {
  if (isError) {
   toast.error('Couldn’t load your trades', {
    description: 'Please refresh the page and try again.',
   });
  }
 }, [isError]);

 const purchasedBots = useMemo(() => {
  const clean = (n: string) => {
   const label = formatBotName(n);
   if (!label) return null;
   if (/^manual trade$/i.test(label)) return null;
   if (/^your bot$/i.test(label)) return null;
   if (/^copyfactory$/i.test(label) || /^copy factory$/i.test(label)) return null;
   return label;
  };
  const fromHistory = displayRows.map((t) => clean(t.strategy)).filter(Boolean) as string[];
  const fromSubs = myBots.map((n) => clean(n)).filter(Boolean) as string[];
  return Array.from(new Set([...fromSubs, ...fromHistory]));
 }, [myBots, displayRows]);

 const strategyOptions = useMemo(() => {
  return ['All bots', ...purchasedBots];
 }, [purchasedBots]);

 // Default filter to the bot they bought when they only have one.
 React.useEffect(() => {
  if (selectedStrategy !== 'All bots') return;
  if (purchasedBots.length === 1) {
   setSelectedStrategy(purchasedBots[0]);
  }
 }, [purchasedBots, selectedStrategy]);

 // Short placeholders on phone so long bot names in (…) don’t clip.
 React.useEffect(() => {
  if (typeof window === 'undefined') return;
  const mq = window.matchMedia('(max-width: 639px)');
  const sync = () => setIsPhone(mq.matches);
  sync();
  mq.addEventListener('change', sync);
  return () => mq.removeEventListener('change', sync);
 }, []);

 const searchPlaceholder = useMemo(() => {
  if (isPhone) {
   return purchasedBots.length > 0 ? 'Search your bots…' : 'Search trades…';
  }
  if (purchasedBots.length === 1) {
   return `Search ${purchasedBots[0]} trades…`;
  }
  if (purchasedBots.length > 1) {
   return `Search your bots (${purchasedBots.slice(0, 2).join(', ')})…`;
  }
  return 'Search your bot trades…';
 }, [purchasedBots, isPhone]);

 const filteredHistory = useMemo(() => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
   return displayRows.filter((trade) => {
   const botLabel = formatBotName(trade.strategy);
   if (selectedStrategy !== 'All bots' && botLabel !== selectedStrategy) {
	return false;
   }

   if (!isTradeWithinHistoryRange(trade.occurredAt, selectedRange)) {
    return false;
   }

   if (!normalizedQuery) {
	return true;
   }

   const haystack = `${trade.id} ${trade.asset} ${trade.type} ${botLabel} ${trade.time}`.toLowerCase();
   return haystack.includes(normalizedQuery);
   });
 }, [displayRows, searchQuery, selectedRange, selectedStrategy]);

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

 const handleExport = () => {
  const header = ['Trade', 'Pair', 'Bot', 'Side', 'Size', 'Profit', 'Status', 'Closed'];
  const rows = filteredHistory.map((trade) => [
   trade.id.slice(0, 12),
   trade.asset,
   trade.strategy,
   trade.type,
   trade.amount,
   trade.pnl.toFixed(2),
   trade.status,
   trade.time,
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const rangeSlug = selectedRange.type === 'preset'
   ? selectedRange.preset.toLowerCase()
   : `${selectedRange.start}_to_${selectedRange.end}`;
  anchor.download = `trade-history-${rangeSlug}-${Date.now()}.csv`;
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
  description="Every closed trade from your account — search, filter, and download anytime."
  icon={History}
  actions={
   <DashButton variant="primary" onClick={handleExport} className="gap-2">
    <Download className="w-3.5 h-3.5" />
    Download CSV
   </DashButton>
  }
 />

 <div className="dashboard-card flex flex-wrap items-center gap-4 p-4">
  <div className="flex items-center gap-2">
   <span className="dash-eyebrow">Total profit</span>
   <span className={cn('text-lg font-bold tabular-nums', aggregatePnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
    {aggregatePnl >= 0 ? '+' : '-'}${Math.abs(aggregatePnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
   </span>
  </div>
  <div className="h-4 w-px bg-[var(--card-border)]" />
  <div className="flex items-center gap-2">
   <div className={cn('w-2 h-2 rounded-full', isFetching ? 'bg-chart-4' : 'bg-chart-3')} />
   <span className="dash-eyebrow">{isFetching ? 'Updating…' : 'Up to date'}</span>
  </div>
 </div>

 {/* Filter bar — icon sits beside text (no absolute overlap) */}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
  <label
   className={cn(
    'group flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[var(--card-border)] bg-card px-3.5',
    'transition-[border-color,box-shadow,outline-color]',
    // Full-control focus ring (icon + field), not the inner input only.
    'focus-within:border-primary/50',
    'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
    'focus-within:outline-[color-mix(in_srgb,var(--ring)_70%,transparent)]',
   )}
  >
   <Search className="h-4 w-4 shrink-0 text-muted-foreground group-focus-within:text-primary/70" aria-hidden />
   <input
    type="text"
    inputMode="search"
    enterKeyHint="search"
    autoComplete="off"
    autoCorrect="off"
    spellCheck={false}
    placeholder={searchPlaceholder}
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="h-full w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm text-foreground shadow-none ring-0 placeholder:text-muted-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:!outline-none [&:focus]:!outline-none [&:focus-visible]:!outline-none"
    style={{ outline: 'none', boxShadow: 'none' }}
    aria-label="Search your bot trades"
   />
  </label>

  <div className="relative w-full shrink-0 sm:w-[13rem]">
   <select
    value={selectedStrategy}
    onChange={(e) => setSelectedStrategy(e.target.value)}
    className="h-11 w-full appearance-none rounded-xl border border-[var(--card-border)] bg-card py-0 pl-3.5 pr-10 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus:border-[color-mix(in_srgb,var(--primary)_35%,var(--card-border))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
    aria-label="Your bots"
   >
    {strategyOptions.map((strategy) => (
     <option key={strategy} value={strategy}>
      {strategy}
     </option>
    ))}
   </select>
   <Filter className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>

  <HistoryDateRangePicker
   className="w-full shrink-0 sm:w-[13.5rem]"
   value={selectedRange}
   onChange={(range) => {
    setSelectedRange(range);
    setCurrentPage(1);
   }}
  />
 </div>

 {/* Main Table */}
 <div className="dash-table-wrap overflow-hidden">
 <div className="responsive-table-shell">
 <table className="w-full max-md:min-w-[48rem] border-collapse">
 <thead>
 <tr className="border-b border-[var(--card-border)] bg-muted/50">
 {['Trade', 'Pair', 'Bot', 'Side', 'Size', 'Profit', 'Closed', 'Status'].map((head) => (
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
 <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
  #{String(trade.id).replace(/^meta:/, '').slice(0, 8)}
 </span>
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
 <span className="text-sm font-medium text-foreground/70 tracking-tight">{formatBotName(trade.strategy)}</span>
 </div>
 </td>
 <td className="px-5 py-4">
 <span className={cn(
"text-xs font-semibold px-3 py-1 rounded-full border tracking-wide",
 trade.type === 'Long' ?"bg-chart-3/10 text-chart-3 border-chart-3/20" :"bg-destructive/10 text-destructive border-destructive/20"
 )}>
 {trade.type === 'Long' ? 'Buy' : 'Sell'}
 </span>
 </td>
 <td className="px-5 py-4 text-sm tabular-nums text-foreground/70">
 {trade.amount} lots
 </td>
 <td className="px-5 py-4">
 <div className="flex flex-col">
 <span className={cn(
"text-sm font-semibold tabular-nums tracking-tight",
 trade.pnl > 0 ?"text-chart-3" :"text-destructive"
 )}>
 {trade.pnl > 0 ? '+' : ''}${Math.abs(trade.pnl).toLocaleString()}
 </span>
 <div className="flex items-center gap-1 mt-1">
 {trade.pnl > 0 ? <ArrowUpRight className="w-3 h-3 text-chart-3/40" /> : <ArrowDownRight className="w-3 h-3 text-destructive/40" />}
 <span className="text-xs text-muted-foreground">Closed</span>
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

 {!isLoading && filteredHistory.length === 0 && (
 <div className="py-24 flex flex-col items-center justify-center space-y-4">
 <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center">
 <Brain className="w-8 h-8 text-foreground/15" />
 </div>
 <div className="text-center space-y-1">
  <p className="text-sm font-medium text-foreground">No trades in this range</p>
  <p className="text-xs text-muted-foreground">Try another date range or clear your search.</p>
 </div>
 </div>
 )}
 </div>

 {selectedTrade && (
  <div className="dashboard-card p-6 space-y-4">
   <div className="flex items-center justify-between">
	<h3 className="text-base font-semibold text-foreground">Trade details</h3>
	<button onClick={() => setSelectedTradeId(null)} className="relative w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring before:absolute before:-inset-1.5 before:content-['']" aria-label="Close">
	 <X className="w-4 h-4" />
	</button>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Trade</p>
	 <p className="text-sm font-medium text-foreground">#{String(selectedTrade.id).replace(/^meta:/, '').slice(0, 10)}</p>
	</div>
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Open → Close</p>
   <p className="text-xs font-semibold text-foreground">{selectedTrade.entry} → {selectedTrade.exit}</p>
	</div>
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Side / Size</p>
	 <p className="text-xs font-semibold text-foreground">{selectedTrade.type === 'Long' ? 'Buy' : 'Sell'} · {selectedTrade.amount} lots</p>
	</div>
	<div className="rounded-xl border border-border bg-foreground/5 p-3">
	 <p className="text-xs font-medium text-muted-foreground">Profit</p>
	 <p className={cn('text-xs font-semibold', selectedTrade.pnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
	  {selectedTrade.pnl >= 0 ? '+' : '-'}${Math.abs(selectedTrade.pnl).toLocaleString()}
	 </p>
	</div>
   </div>
  </div>
 )}

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
  Previous
 </button>
 <div className="flex items-center gap-2">
  {getHistoryPageItems(currentPage, totalPages).map((item, index) =>
   item === 'ellipsis' ? (
    <span key={`ellipsis-${index}`} className="px-0.5 text-foreground/30">
     …
    </span>
   ) : (
    <button
     key={item}
     type="button"
     onClick={() => setCurrentPage(item)}
     className={cn(
      'min-w-[1.25rem] transition-colors hover:text-primary',
      item === currentPage ? 'font-semibold text-foreground' : 'text-foreground/30',
     )}
     aria-current={item === currentPage ? 'page' : undefined}
    >
     {item}
    </button>
   ),
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
