'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Server, TrendingUp, TrendingDown, Pause, Play, X, BarChart2,
  ShoppingBag, CalendarClock, DollarSign, Zap, AlertCircle,
  RefreshCw, ChevronRight, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { useCurrency } from '@/lib/hooks/useCurrency';

type BotStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'INACTIVE';

interface UserBot {
  id: string;
  name: string;
  category?: string;
  status: BotStatus;
  monthlyPrice?: number;
  planType?: string;
  expiresAt?: string;
  subscribedAt?: string;
  riskLevel?: string;
  creator?: { fullName?: string; username?: string };
  brokerAccount?: { accountName?: string; broker?: string } | null;
  currentPnl?: number;
}

const STATUS_CFG: Record<BotStatus, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  PAUSED:    { label: 'Paused',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     dot: 'bg-amber-400' },
  EXPIRED:   { label: 'Expired',   color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       dot: 'bg-rose-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',     dot: 'bg-slate-400' },
  INACTIVE:  { label: 'Inactive',  color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',     dot: 'bg-slate-400' },
};

const TABS: Array<{ key: BotStatus | 'ALL'; label: string }> = [
  { key: 'ALL',       label: 'All'       },
  { key: 'ACTIVE',    label: 'Active'    },
  { key: 'PAUSED',    label: 'Paused'    },
  { key: 'EXPIRED',   label: 'Expired'   },
  { key: 'CANCELLED', label: 'Cancelled' },
];

async function fetchMyBots(): Promise<UserBot[]> {
  const res = await apiClient.get('/strategies/my');
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export default function MyBotsPage() {
  const qc = useQueryClient();
  const { formatPrice } = useCurrency();
  const [tab, setTab] = React.useState<BotStatus | 'ALL'>('ALL');

  const { data: bots = [], isLoading, isError } = useQuery<UserBot[]>({
    queryKey: ['my-bots'],
    queryFn: fetchMyBots,
    staleTime: 30_000,
  });

  const pauseMut  = useMutation({ mutationFn: (id: string) => apiClient.post(`/strategies/${id}/pause`),      onSuccess: () => { toast.success('Bot paused');    qc.invalidateQueries({ queryKey: ['my-bots'] }); }, onError: () => toast.error('Could not pause bot') });
  const resumeMut = useMutation({ mutationFn: (id: string) => apiClient.post(`/strategies/${id}/resume`),     onSuccess: () => { toast.success('Bot resumed');   qc.invalidateQueries({ queryKey: ['my-bots'] }); }, onError: () => toast.error('Could not resume bot') });
  const cancelMut = useMutation({ mutationFn: (id: string) => apiClient.post(`/strategies/${id}/deactivate`), onSuccess: () => { toast.success('Subscription cancelled'); qc.invalidateQueries({ queryKey: ['my-bots'] }); }, onError: () => toast.error('Could not cancel') });

  const filtered   = tab === 'ALL' ? bots : bots.filter(b => b.status === tab);
  const activeBots = bots.filter(b => b.status === 'ACTIVE');
  const monthlyCost = activeBots.reduce((s, b) => s + (b.monthlyPrice ?? 0), 0);
  const totalPnl    = bots.reduce((s, b) => s + (b.currentPnl ?? 0), 0);
  const nextRenewal = activeBots.filter(b => b.expiresAt).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0];

  const counts: Record<string, number> = { ALL: bots.length };
  for (const b of bots) counts[b.status] = (counts[b.status] ?? 0) + 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" /> My Bots
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your active trading bots and subscriptions</p>
        </div>
        <Link href="/marketplace"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
          <Plus className="w-4 h-4" /> Browse Marketplace
        </Link>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Bots',    value: String(activeBots.length),  Icon: Zap,          color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Monthly Cost',   value: monthlyCost > 0 ? formatPrice(monthlyCost) : '—', Icon: DollarSign,  color: 'text-primary',    bg: 'bg-primary/10' },
          { label: 'Total P&L',      value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}%`, Icon: totalPnl >= 0 ? TrendingUp : TrendingDown, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
          { label: 'Next Renewal',   value: nextRenewal?.expiresAt ? new Date(nextRenewal.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', Icon: CalendarClock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className="dashboard-card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
              <s.Icon className={cn('w-4 h-4', s.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={cn('text-base font-bold truncate', s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              tab === t.key ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-foreground/5 border-transparent text-muted-foreground hover:text-foreground')}>
            {t.label}{counts[t.key] ? <span className="ml-1 opacity-60">({counts[t.key]})</span> : null}
          </button>
        ))}
      </motion.div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="dashboard-card p-5 h-52 animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="dashboard-card p-10 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="font-semibold text-foreground">Failed to load bots</p>
          <p className="text-sm text-muted-foreground mt-1">Check your connection and try again</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-card p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No bots here</h3>
          <p className="text-sm text-muted-foreground mb-5">Browse the marketplace to subscribe to trading bots</p>
          <Link href="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#1e6d48] text-white text-sm font-semibold hover:brightness-110 transition-all">
            <ShoppingBag className="w-4 h-4" /> Go to Marketplace
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((bot, i) => {
            const st  = STATUS_CFG[bot.status] ?? STATUS_CFG.INACTIVE;
            const pnl = bot.currentPnl ?? 0;
            return (
              <motion.div key={bot.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="dashboard-card p-5 flex flex-col gap-4 border border-[var(--card-border)] hover:border-primary/20 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <Server className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{bot.category ?? 'BOT'}</p>
                      <h3 className="text-sm font-bold text-foreground truncate">{bot.name}</h3>
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0', st.bg, st.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{st.label}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">P&L</p>
                    <p className={cn('text-sm font-bold', pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost/mo</p>
                    <p className="text-sm font-bold text-foreground">{bot.monthlyPrice ? formatPrice(bot.monthlyPrice) : 'FREE'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Renewal</p>
                    <p className="text-sm font-bold text-foreground">{bot.expiresAt ? new Date(bot.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
                  </div>
                </div>

                {/* Broker */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-[var(--card-border)] pt-3">
                  <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{bot.brokerAccount?.broker ?? bot.brokerAccount?.accountName ?? 'No broker linked'}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {bot.status === 'ACTIVE' && (
                    <button onClick={() => pauseMut.mutate(bot.id)} disabled={pauseMut.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                  )}
                  {(bot.status === 'PAUSED' || bot.status === 'INACTIVE') && (
                    <button onClick={() => resumeMut.mutate(bot.id)} disabled={resumeMut.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                      <Play className="w-3 h-3" /> Resume
                    </button>
                  )}
                  {bot.status === 'EXPIRED' && (
                    <Link href="/marketplace" className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Renew
                    </Link>
                  )}
                  {(bot.status === 'ACTIVE' || bot.status === 'PAUSED') && (
                    <button onClick={() => { if (confirm('Cancel this bot subscription?')) cancelMut.mutate(bot.id); }} disabled={cancelMut.isPending}
                      className="h-8 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors disabled:opacity-50">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <Link href={`/marketplace/${bot.id}`}
                    className="h-8 px-3 rounded-lg bg-foreground/5 border border-[var(--card-border)] text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-colors">
                    Details <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
