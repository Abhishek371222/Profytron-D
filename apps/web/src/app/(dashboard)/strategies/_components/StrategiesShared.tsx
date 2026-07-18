'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight, Plus } from 'lucide-react';

export const STRATEGY_CATEGORIES = [
  'ALL',
  'TREND',
  'RANGE',
  'SCALPING',
  'VOLATILITY',
  'ARBITRAGE',
  'MEAN REVERT',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  TREND: 'bg-primary/15 text-primary border-primary/25',
  RANGE: 'bg-chart-2/15 text-chart-2 border-chart-2/25',
  SCALPING: 'bg-chart-4/15 text-chart-4 border-chart-4/25',
  VOLATILITY: 'bg-destructive/15 text-destructive border-destructive/25',
  ARBITRAGE: 'bg-chart-5/15 text-chart-5 border-chart-5/25',
  'MEAN REVERT': 'bg-chart-3/15 text-chart-3 border-chart-3/25',
};

export function StrategiesBreadcrumbs({ current }: { current?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
      <Link href="/dashboard" className="hover:underline">
        Dashboard
      </Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      {current ? (
        <>
          <Link href="/strategies" className="text-muted-foreground hover:text-primary hover:underline">
            Bots
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground truncate max-w-[200px]">{current}</span>
        </>
      ) : (
        <span className="text-foreground">Bots</span>
      )}
    </div>
  );
}

export function StrategiesPageHeader({
  activeTab,
  onTabChange,
  onDeploy,
}: {
  activeTab: 'library' | 'my-strategies';
  onTabChange: (tab: 'library' | 'my-strategies') => void;
  onDeploy: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col xl:flex-row xl:items-end justify-between gap-6"
    >
      <div className="flex items-start gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">Bots</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Bot Library
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Discover, compare, and activate trading bots from verified creators.
          </p>
        </div>
        { }
        <div className="hidden lg:flex relative h-24 w-28 shrink-0 items-end justify-center" aria-hidden>
          <motion.div
            className="absolute bottom-0 left-2 h-14 w-16 rounded-xl bg-primary/20 border border-primary/30 shadow-lg"
            initial={{ rotate: -8 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-2 left-8 h-16 w-14 rounded-xl bg-primary/30 border border-primary/40 shadow-lg"
            initial={{ rotate: 6 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.div
            className="absolute bottom-4 right-0 h-12 w-12 rounded-lg bg-primary/15 border border-primary/25"
            initial={{ rotate: 12 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="flex items-center p-1 rounded-xl border border-[var(--card-border)] bg-card shadow-sm">
          {(['library', 'my-strategies'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors',
                activeTab === tab
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'library' ? 'Browse' : 'My bots'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onDeploy}
          className="btn-premium inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide"
        >
          <Plus className="h-4 w-4" />
          Open Builder
        </button>
      </div>
    </motion.div>
  );
}

export function FilterPill({
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
        'px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-colors shrink-0',
        active
          ? 'bg-primary/10 text-primary border border-primary/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent',
      )}
    >
      {children}
    </button>
  );
}
