'use client';

import React from 'react';
import Link from 'next/link';
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
  RANGE: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  SCALPING: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  VOLATILITY: 'bg-destructive/15 text-destructive border-destructive/25',
  ARBITRAGE: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'MEAN REVERT': 'bg-teal-500/15 text-teal-400 border-teal-500/25',
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
            Strategies
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground truncate max-w-[200px]">{current}</span>
        </>
      ) : (
        <span className="text-foreground">Strategies</span>
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
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
      <div className="flex items-start gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">Strategies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Strategy Library
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Discover, compare, and activate trading strategies from verified creators.
          </p>
        </div>
        {/* Decorative illustration */}
        <div className="hidden lg:flex relative h-24 w-28 shrink-0 items-end justify-center" aria-hidden>
          <div className="absolute bottom-0 left-2 h-14 w-16 rounded-xl bg-primary/20 border border-primary/30 rotate-[-8deg] shadow-lg" />
          <div className="absolute bottom-2 left-8 h-16 w-14 rounded-xl bg-primary/30 border border-primary/40 rotate-[6deg] shadow-lg" />
          <div className="absolute bottom-4 right-0 h-12 w-12 rounded-lg bg-primary/15 border border-primary/25 rotate-[12deg]" />
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
              {tab === 'library' ? 'Browse' : 'My strategies'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onDeploy}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Open Builder
        </button>
      </div>
    </div>
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
