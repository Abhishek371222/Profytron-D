'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Hammer, Sparkles, Layers, GitBranch, BarChart3 } from 'lucide-react';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashButton,
} from '@/components/dashboard/DashboardPrimitives';

export default function StrategyBuilderPage() {
  return (
    <DashboardPage className="!gap-0 !pb-0">
      <div className="flex h-[calc(100dvh-68px-1rem)] min-h-[520px] overflow-hidden rounded-2xl border border-[var(--card-border)] bg-bg-secondary">
        {/* Preview sidebar — matches mockup */}
        <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-[var(--card-border)] bg-card text-foreground">
          <div className="p-4 border-b border-[var(--card-border)] space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">Component Library</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Strategy Builder</p>
            </div>
            <div className="h-9 rounded-lg bg-foreground/5 border border-[var(--card-border)]" />
            <div className="flex gap-1.5">
              <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold">Signals</span>
              <span className="px-2 py-1 rounded-md bg-foreground/5 text-[10px] text-muted-foreground">Logic</span>
            </div>
          </div>
          <div className="p-3 space-y-2 opacity-60 pointer-events-none">
            {['RSI Oscillator', 'MACD', 'EMA Crossover'].map((n) => (
              <div key={n} className="p-3 rounded-xl border border-[var(--card-border)] bg-foreground/5 text-xs font-medium text-foreground">{n}</div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 shrink-0 border-b border-[var(--card-border)] bg-card px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/strategies" className="w-9 h-9 rounded-lg border border-[var(--card-border)] flex items-center justify-center text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <div>
                <p className="text-sm font-semibold text-foreground">New Strategy</p>
                <p className="text-xs text-amber-600 font-medium">Draft · Builder preview</p>
              </div>
            </div>
            <DashButton disabled className="opacity-50 cursor-not-allowed">Run Backtest</DashButton>
          </div>

          <div className="flex-1 relative bg-bg-secondary flex items-center justify-center p-6">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="relative max-w-md w-full text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Hammer className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Strategy Builder</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drag-and-drop strategy design, visual backtesting, and one-click deployment are on the way.
                  You&apos;ll be able to build, test, and publish strategies without writing code.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-4 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Coming soon
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-left">
                {[
                  { icon: Layers, label: 'Node library', desc: 'Indicators & logic blocks' },
                  { icon: GitBranch, label: 'Visual canvas', desc: 'Connect rules visually' },
                  { icon: BarChart3, label: 'Backtest', desc: 'Test before you deploy' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-xl border border-[var(--card-border)] bg-card p-3">
                    <Icon className="h-4 w-4 text-primary mb-2" />
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/strategies">
                <DashButton variant="outline" className="mt-2">
                  Browse strategies
                </DashButton>
              </Link>
            </div>

            {/* Preview system panel */}
            <div className="hidden lg:block absolute top-5 right-5 w-52 dashboard-card p-4 opacity-60 pointer-events-none">
              <p className="text-sm font-bold text-foreground">Backtest Preview</p>
              <p className="text-xs text-chart-3 font-medium mt-1">Available at launch</p>
              <div className="mt-4 space-y-2 text-center">
                <p className="text-xl font-bold text-foreground">—</p>
                <p className="text-[10px] text-muted-foreground uppercase">Expected return</p>
              </div>
            </div>
          </div>

          <div className="h-11 shrink-0 border-t border-[var(--card-border)] bg-card px-4 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Strategy Builder launches in a future update · Use Marketplace or Copy Trading today</p>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
