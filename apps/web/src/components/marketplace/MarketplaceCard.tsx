'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Star, Zap, Activity, Users, ArrowRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MarketplaceCardProps {
  strategy: any;
  onSubscribe: (strategy: any) => void;
}

const RISK_COLORS: Record<string, string> = {
  Low:    'text-emerald-400',
  Medium: 'text-amber-400',
  High:   'text-rose-400',
};

const RISK_BG: Record<string, string> = {
  Low:    'bg-emerald-500/10 border-emerald-500/20',
  Medium: 'bg-amber-500/10 border-amber-500/20',
  High:   'bg-rose-500/10 border-rose-500/20',
};

export function MarketplaceCard({ strategy, onSubscribe }: MarketplaceCardProps) {
  const subscribers = Number(strategy.subscribers || 0);
  const returns     = Number(strategy.returns || 0);
  const price       = Number(strategy.price || 0);
  const sharpe      = Number(strategy.sharpe || 0);
  const risk        = String(strategy.risk || 'Medium');

  const isTrending = subscribers > 2000;
  const isTopRated = sharpe > 2.0;
  const isHot      = returns > 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      className={cn(
        'group relative rounded-[24px] overflow-hidden',
        'bg-[#0d0d14] border border-white/[0.08]',
        'hover:border-indigo-400/25',
        'transition-[border-color,box-shadow] duration-300',
        'hover:shadow-[0_16px_56px_rgba(0,0,0,0.45),0_0_0_1px_rgba(99,102,241,0.12)]',
      )}
    >
      {/* ── Ambient top glow (hidden until hover) ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* ── Beam sweep on hover ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
        <div className="absolute inset-y-0 -inset-x-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.045] to-transparent skew-x-[-18deg] translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-700 ease-in-out" />
      </div>

      {/* ── Corner accent glow ── */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* ─────────── HEADER ─────────── */}
      <div className="relative p-5 pb-3">
        <div className="flex items-start justify-between gap-3">

          {/* Icon + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-400/20 transition-all duration-300">
              <Activity className="w-5 h-5 text-white/35 group-hover:text-indigo-400 transition-colors duration-300" />
              {isHot && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <Flame className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] mb-0.5">{strategy.category}</p>
              <h3 className="text-sm font-bold text-white leading-tight truncate">{strategy.name}</h3>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {isTrending && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-[0.14em]">
                <TrendingUp className="w-2.5 h-2.5" /> Hot
              </span>
            )}
            {isTopRated && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-[0.14em]">
                <Star className="w-2.5 h-2.5 fill-current" /> Top
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────── STATS ─────────── */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-2">
        {[
          {
            label: '30D Return',
            value: `+${returns}%`,
            color: 'text-emerald-400',
          },
          {
            label: 'Sharpe',
            value: sharpe > 0 ? sharpe.toFixed(2) : '—',
            color: sharpe >= 2 ? 'text-cyan-400' : 'text-white/50',
          },
          {
            label: 'Risk',
            value: risk,
            color: RISK_COLORS[risk] ?? 'text-white/50',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col gap-1"
          >
            <span className="text-[9px] text-white/22 font-bold uppercase tracking-widest leading-none">{label}</span>
            <span className={cn('text-xs font-bold font-mono tabular-nums leading-none', color)}>{value}</span>
          </div>
        ))}
      </div>

      {/* ─────────── DIVIDER ─────────── */}
      <div className="mx-5 h-px bg-white/[0.05]" />

      {/* ─────────── FOOTER ─────────── */}
      <div className="p-5 space-y-4">

        {/* Price + trial row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white tracking-tight font-mono">
                {price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'FREE'}
              </span>
              {price > 0 && (
                <span className="text-[10px] font-bold text-white/25 uppercase">/mo</span>
              )}
            </div>
            {price > 0 && (
              <p className="text-[10px] font-bold text-emerald-400/55 mt-0.5">Save 20% yearly</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-white/25">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold tabular-nums">
              {subscribers > 1000 ? `${(subscribers / 1000).toFixed(1)}k` : subscribers}
            </span>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] overflow-hidden shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${strategy.creator}&backgroundColor=3730a3`}
              alt={strategy.creator}
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white/70 truncate">{strategy.creator}</span>
              {strategy.verified && (
                <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-amber-400/50">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn('w-2.5 h-2.5', s <= 4 ? 'fill-current' : '')} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSubscribe(strategy)}
            className={cn(
              'relative w-full h-10 rounded-xl overflow-hidden',
              'bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500',
              'text-white text-[11px] font-bold uppercase tracking-[0.16em]',
              'flex items-center justify-center gap-2',
              'hover:brightness-110 active:scale-[0.98]',
              'transition-all duration-200',
              'shadow-[0_4px_20px_rgba(99,102,241,0.35)]',
              'hover:shadow-[0_4px_28px_rgba(99,102,241,0.55)]',
              'before:absolute before:inset-0',
              'before:bg-gradient-to-r before:from-white/0 before:via-white/15 before:to-white/0',
              'before:translate-x-[-100%] hover:before:translate-x-[100%]',
              'before:transition-transform before:duration-600 before:ease-in-out',
            )}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            Subscribe
            <ArrowRight className="w-3 h-3 shrink-0" />
          </button>

          <Link
            href={`/marketplace/${strategy.id}`}
            className="text-center text-[10px] font-bold text-white/20 hover:text-white/50 uppercase tracking-[0.22em] transition-colors py-1"
          >
            View Details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
