'use client';

import React from 'react';
import { Zap, TrendingUp, Users, ShieldCheck, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceHeroProps {
  totalStrategies?: number;
  totalSubscribers?: number;
  verifiedCreators?: number;
}

export function MarketplaceHero({
  totalStrategies = 0,
  totalSubscribers = 0,
  verifiedCreators = 0,
}: MarketplaceHeroProps) {
  const stats = [
    {
      label: 'Total Strategies',
      value: totalStrategies > 0 ? totalStrategies.toLocaleString() : '—',
      icon: BarChart3,
      color: 'text-primary',
    },
    {
      label: 'Active Subscribers',
      value: totalSubscribers >= 1000 ? `${(totalSubscribers / 1000).toFixed(1)}K+` : totalSubscribers > 0 ? totalSubscribers.toLocaleString() : '—',
      icon: Users,
      color: 'text-chart-3',
    },
    {
      label: 'Verified Creators',
      value: verifiedCreators > 0 ? String(verifiedCreators) : '—',
      icon: ShieldCheck,
      color: 'text-[#47a7aa]',
    },
  ];

  return (
    <section className="relative w-full overflow-hidden border-b border-[var(--card-border)]" style={{ minHeight: 168 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0e1244] via-[#121a5c] to-[#1a1040]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="pointer-events-none absolute -top-20 right-1/4 h-64 w-96 rounded-full bg-primary/20 blur-[80px]" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 px-5 py-6 md:px-6 md:py-7">
        <div className="space-y-3 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Marketplace
          </span>
          <h1 className="text-2xl md:text-[32px] font-bold text-white tracking-tight leading-tight">
            Discover Proven{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8BA3FF] to-[#47a7aa]">
              Strategies
            </span>
          </h1>
          <p className="text-sm text-white/60 max-w-lg">
            Access algorithmic strategies built by top traders. Subscribe, backtest, and deploy in minutes.
          </p>
          <div className="flex flex-wrap items-center gap-5 pt-1">
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <div className="flex items-center gap-2">
                  <stat.icon className={cn('h-4 w-4 shrink-0', stat.color)} />
                  <div>
                    <p className="text-base font-bold text-white tabular-nums leading-none">{stat.value}</p>
                    <p className="text-[10px] font-semibold text-white/45 uppercase tracking-wide mt-0.5">{stat.label}</p>
                  </div>
                </div>
                {i < stats.length - 1 && <div className="hidden sm:block h-8 w-px bg-white/15" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Decorative chart stack */}
        <div className="hidden xl:flex relative h-28 w-36 shrink-0 items-end justify-center" aria-hidden>
          <div className="absolute bottom-0 left-0 h-20 w-24 rounded-xl border border-primary/30 bg-primary/20 rotate-[-6deg] shadow-lg p-2 flex flex-col justify-between">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold text-chart-3">+42%</span>
          </div>
          <div className="absolute bottom-2 left-10 h-24 w-20 rounded-xl border border-white/20 bg-white/10 rotate-[4deg] shadow-xl backdrop-blur-sm" />
          <div className="absolute bottom-4 right-0 h-14 w-14 rounded-lg border border-primary/25 bg-primary/15 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
