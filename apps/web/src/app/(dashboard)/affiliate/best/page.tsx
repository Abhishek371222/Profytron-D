'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Medal, Star, TrendingUp, Users, Award, Flame, Sparkles, Filter, MapPin, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { affiliateLeaders, affiliateRegionFilters, affiliateTierFilters } from '../_lib/affiliateData';
import { AffiliateTreeScene } from '../_components/AffiliateTreeScene';
import { affiliatesApi, type AffiliateDashboardResponse } from '@/lib/api/affiliates';

export default function BestAffiliatesPage() {
  const router = useRouter();
  const dashboardQuery = useQuery<AffiliateDashboardResponse>({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => affiliatesApi.getDashboard(),
  });
  const leaders = affiliateLeaders.slice(0, 5);
  const dashboard = dashboardQuery.data;
  const stats = dashboard?.stats;
  const commissionRate = dashboard?.commissionRate ?? 0;
  const [activeTier, setActiveTier] = React.useState<(typeof affiliateTierFilters)[number]>('ALL');
  const [activeRegion, setActiveRegion] = React.useState<(typeof affiliateRegionFilters)[number]>('ALL');

  const filteredLeaders = React.useMemo(() => {
    return leaders.filter((leader) => {
      const matchesTier = activeTier === 'ALL' || leader.tier === activeTier;
      const matchesRegion = activeRegion === 'ALL' || leader.region === activeRegion;
      return matchesTier && matchesRegion;
    });
  }, [activeRegion, activeTier, leaders]);

  const leaderSummary = React.useMemo(() => ({
    totalClicks: filteredLeaders.reduce((sum, leader) => sum + leader.clicks, 0),
    totalEarnings: filteredLeaders.reduce((sum, leader) => sum + leader.earnings, 0),
    topGrowth: filteredLeaders[0]?.growth ?? 0,
  }), [filteredLeaders]);

  return (
    <main className="space-y-8 p-6 md:p-8 text-foreground">
      <section className="relative overflow-hidden rounded-[38px] border border-border bg-card px-6 py-7 md:px-8 md:py-8 shadow-card">
        <motion.div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-chart-4/15 blur-3xl" animate={{ x: [0, -14, 0], y: [0, 10, 0] }} transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" animate={{ x: [0, 12, 0], y: [0, -12, 0] }} transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_color-mix(in_srgb,var(--chart-4)_18%,transparent),_transparent_40%),radial-gradient(circle_at_bottom_left,_color-mix(in_srgb,var(--primary)_18%,transparent),_transparent_45%)]" />

        <div className="relative mb-6 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-chart-4/20 bg-chart-4/10 px-3 py-1 text-micro font-semibold uppercase tracking-[0.26em] text-chart-4">
            <Medal className="h-3.5 w-3.5" />
            Best affiliates
          </div>
          <div className="rounded-full border border-border bg-foreground/5 px-3 py-1 text-micro font-semibold uppercase tracking-[0.22em] text-foreground/50">
            Live leaderboard
          </div>
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-5">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Leaderboard-grade affiliate performance with motion-first ranking cards.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60">
                Compare the strongest referral engines in the network. Each row highlights scale, conversion quality, and growth, with a polished moving layout that mirrors the tree view.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/affiliate')}
                className="gap-2 rounded-2xl border-border bg-foreground/5 text-foreground hover:bg-foreground/10"
              >
                Back to affiliate tree
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Top converters', value: stats ? `${stats.conversions.toLocaleString()} conversions` : 'No data', tone: 'text-chart-3', icon: Flame },
                { label: 'Total earned', value: stats ? `$${stats.totalEarned.toLocaleString()}` : 'No data', tone: 'text-chart-5', icon: Award },
                { label: 'Network growth', value: dashboard ? `${Math.round(commissionRate * 100)}%` : 'No data', tone: 'text-chart-4', icon: Sparkles },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                    whileHover={{ y: -4 }}
                    className="rounded-[24px] border border-border bg-foreground/4 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3 text-foreground/55">
                      <p className="text-micro font-semibold uppercase tracking-[0.22em]">{item.label}</p>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className={cn('mt-3 text-2xl font-semibold', item.tone)}>{item.value}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/8">
                      <motion.div
                        className={cn('h-full rounded-full bg-gradient-to-r', index === 0 ? 'from-chart-3 via-chart-5 to-primary' : index === 1 ? 'from-chart-5 via-chart-1 to-chart-2' : 'from-chart-4 via-chart-5 to-destructive')}
                        initial={{ width: '20%' }}
                        animate={{ width: ['20%', '86%', '20%'] }}
                        transition={{ duration: 4.8 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="rounded-[28px] border border-border bg-foreground/4 p-5 backdrop-blur-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-micro font-semibold uppercase tracking-[0.28em] text-foreground/30">Animated filters</p>
                  <p className="mt-2 text-sm text-foreground/60">Switch tiers and regions to reshape the leaderboard instantly.</p>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-foreground/35">
                  <Filter className="h-4 w-4 text-primary" />
                  Filters active
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.24em] text-foreground/30">
                    <ChevronRight className="h-3.5 w-3.5 text-chart-5" />
                    Tier
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {affiliateTierFilters.map((tier, index) => (
                      <motion.button
                        key={tier}
                        onClick={() => setActiveTier(tier)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'rounded-full border px-4 py-2 text-micro font-semibold uppercase tracking-[0.22em] transition-all',
                          activeTier === tier
                            ? 'border-chart-5/30 bg-chart-5/15 text-chart-5 shadow-[0_0_24px_color-mix(in_srgb,var(--chart-5)_35%,transparent)]'
                            : 'border-border bg-foreground/4 text-foreground/40 hover:border-border hover:text-foreground/70',
                        )}
                        transition={{ delay: index * 0.03 }}
                      >
                        {tier}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.24em] text-foreground/30">
                    <MapPin className="h-3.5 w-3.5 text-chart-4" />
                    Region
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {affiliateRegionFilters.map((region, index) => (
                      <motion.button
                        key={region}
                        onClick={() => setActiveRegion(region)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'rounded-full border px-4 py-2 text-micro font-semibold uppercase tracking-[0.22em] transition-all',
                          activeRegion === region
                            ? 'border-chart-3/30 bg-chart-3/15 text-chart-3 shadow-[0_0_24px_color-mix(in_srgb,var(--chart-3)_35%,transparent)]'
                            : 'border-border bg-foreground/4 text-foreground/40 hover:border-border hover:text-foreground/70',
                        )}
                        transition={{ delay: index * 0.03 }}
                      >
                        {region}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Clicks filtered', value: leaderSummary.totalClicks.toLocaleString(), tone: 'text-chart-5' },
                { label: 'Earnings filtered', value: `$${leaderSummary.totalEarnings.toLocaleString()}`, tone: 'text-chart-3' },
                { label: 'Top growth', value: `${leaderSummary.topGrowth}%`, tone: 'text-chart-4' },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-border bg-foreground/5 p-4">
                  <p className="text-micro font-semibold uppercase tracking-[0.22em] text-foreground/30">{item.label}</p>
                  <p className={cn('mt-2 text-xl font-semibold', item.tone)}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-border bg-foreground/4 p-5 backdrop-blur-sm">
              <p className="text-micro font-semibold uppercase tracking-[0.28em] text-foreground/30">Your live position</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-foreground/5 p-4">
                  <p className="text-micro uppercase tracking-[0.22em] text-foreground/30">Referral code</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{dashboard?.referralCode ?? '—'}</p>
                </div>
                <div className="rounded-2xl border border-border bg-foreground/5 p-4">
                  <p className="text-micro uppercase tracking-[0.22em] text-foreground/30">Commission rate</p>
                  <p className="mt-2 text-2xl font-semibold text-chart-3">{Math.round(commissionRate * 100)}%</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Clicks', value: stats?.clicks ?? 0, tone: 'text-chart-5' },
                  { label: 'Signups', value: stats?.signups ?? 0, tone: 'text-chart-3' },
                  { label: 'Conversions', value: stats?.conversions ?? 0, tone: 'text-chart-4' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-foreground/5 p-4">
                    <p className="text-micro uppercase tracking-[0.22em] text-foreground/30">{item.label}</p>
                    <p className={cn('mt-2 text-xl font-semibold', item.tone)}>{item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AffiliateTreeScene
              title="Top affiliate tree"
              subtitle="A live-style rank map that shows how the strongest performers are distributed across regions and funnel stages."
              nodes={[
                { label: 'Top rank', value: stats ? `${stats.conversions.toLocaleString()} conversions` : 'No data yet', tone: 'text-chart-3' },
                { label: 'Elite branch', value: dashboard ? `${dashboard.tier} tier` : 'No data', tone: 'text-chart-5' },
                { label: 'Growth branch', value: stats ? `${stats.signups.toLocaleString()} signups` : 'No data', tone: 'text-chart-4' },
                { label: 'Payout pool', value: stats ? `$${stats.pendingPayout.toLocaleString()}` : 'No data', tone: 'text-chart-2' },
                { label: 'Momentum', value: dashboard ? 'Live now' : 'No data', tone: 'text-chart-5' },
              ]}
              accentClassName="from-chart-4/16 via-chart-2/10 to-transparent"
            />

            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: 'API feed', value: dashboardQuery.isError ? 'Fallback' : 'Live', tone: dashboardQuery.isError ? 'text-chart-4' : 'text-chart-3' },
                { label: 'Payout pool', value: stats ? stats.pendingPayout.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }) : '—', tone: 'text-foreground' },
                { label: 'Tier', value: dashboard?.tier ?? '—', tone: 'text-chart-5' },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -4 }}
                  className="rounded-[24px] border border-border bg-bg-secondary p-4 shadow-card"
                >
                  <p className="text-micro font-semibold uppercase tracking-[0.22em] text-foreground/30">{item.label}</p>
                  <p className={cn('mt-2 text-xl font-semibold', item.tone)}>{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredLeaders.map((leader, index) => (
          <motion.div
            key={leader.handle}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className={cn('relative overflow-hidden rounded-[28px] border border-border bg-bg-secondary p-5 shadow-card min-h-[360px] flex flex-col justify-between', index === 0 && 'md:col-span-2 xl:col-span-1')}
          >
            <div className={cn('absolute inset-0 bg-gradient-to-r opacity-60', leader.color)} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_35%)]" />
            <div className="relative grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-foreground/5 text-xl font-semibold text-foreground">
                    #{leader.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{leader.name}</h3>
                      <span className={cn('rounded-full border px-2 py-0.5 text-micro font-semibold uppercase tracking-[0.22em]', leader.tier === 'ELITE' ? 'border-chart-3/20 bg-chart-3/10 text-chart-3' : 'border-chart-5/20 bg-chart-5/10 text-chart-5')}>
                        {leader.tier}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/45">{leader.handle} · {leader.region}</p>
                    <p className="mt-2 text-sm text-foreground/60">{leader.note}</p>
                  </div>
                </div>
                <div className="rounded-full border border-border bg-foreground/4 px-3 py-1 text-micro font-semibold uppercase tracking-[0.22em] text-foreground/50">
                  Rank #{leader.rank}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Clicks', leader.clicks],
                  ['Signups', leader.signups],
                  ['Conversions', leader.conversions],
                  ['Earnings', `$${leader.earnings.toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-border bg-foreground/4 p-4">
                    <p className="text-micro font-semibold uppercase tracking-[0.22em] text-foreground/30">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full border border-chart-3/20 bg-chart-3/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-chart-3">
                  <TrendingUp className="h-4 w-4" />
                  +{leader.growth}%
                </div>
                <div className="rounded-full border border-border bg-foreground/4 p-3 text-foreground/60">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="rounded-[30px] border border-border bg-foreground/4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.28em] text-foreground/30">Ranking pulse</p>
            <p className="mt-2 text-sm text-foreground/60">A quick view of how the top affiliate tier is progressing this cycle.</p>
          </div>
          <Star className="h-5 w-5 text-chart-4" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            'Strong click-through from content channels.',
            'Most elite accounts maintain high conversion quality.',
            'New affiliates are climbing quickly with referral traffic.',
          ].map((item, index) => (
            <div key={item} className="rounded-2xl border border-border bg-foreground/5 p-4 text-sm text-foreground/60">
              <span className="mr-2 text-primary">0{index + 1}.</span>
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
