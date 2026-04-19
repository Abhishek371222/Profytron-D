'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, ArrowRight, Network, Gift, Sparkles, Share2, TrendingUp, Users, RefreshCcw, WalletCards, Medal, Link2, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { affiliatesApi, type AffiliateDashboardResponse, type AffiliateRecordResponse } from '@/lib/api/affiliates';
import { toast } from 'sonner';
import {
  affiliateTreeNodes,
  demoAffiliateDashboard,
  type AffiliateDashboardData,
} from './_lib/affiliateData';
import { AffiliateTreeScene } from './_components/AffiliateTreeScene';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const metricCards = [
  { label: 'Clicks', icon: Users, key: 'clicks' as const },
  { label: 'Signups', icon: Share2, key: 'signups' as const },
  { label: 'Conversions', icon: Gift, key: 'conversions' as const },
  { label: 'Conversion Rate', icon: TrendingUp, key: 'conversionRate' as const },
];

const shareTargets = [
  { label: 'Copy link', icon: Copy },
  { label: 'Open share flow', icon: Send },
  { label: 'Track click', icon: Link2 },
];

export default function AffiliatePage() {
  const router = useRouter();
  const [origin, setOrigin] = React.useState('');
  const [shareState, setShareState] = React.useState<'idle' | 'copied' | 'tracked'>('idle');
  const dashboardQuery = useQuery<AffiliateDashboardResponse>({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => affiliatesApi.getDashboard(),
  });
  const profileQuery = useQuery<AffiliateRecordResponse>({
    queryKey: ['affiliate-profile'],
    queryFn: () => affiliatesApi.getMine(),
  });

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const data = dashboardQuery.data ?? demoAffiliateDashboard;
  const profile = profileQuery.data;
  const stats = data.stats;
  const referralCode = data.referralCode || profile?.referralCode || demoAffiliateDashboard.referralCode;
  const referralLink = origin ? `${origin}/signup?ref=${referralCode}` : '';
  const isLoading = dashboardQuery.isLoading || profileQuery.isLoading;
  const livePace = Math.max(0, Math.min(100, (stats.conversionRate / 10) * 100));
  const ownMetrics = React.useMemo(() => [
    { label: 'Referral tier', value: data.tier, tone: 'text-cyan-200' },
    { label: 'Click quality', value: `${stats.conversionRate}%`, tone: 'text-emerald-200' },
    { label: 'Open payout', value: formatCurrency(stats.pendingPayout), tone: 'text-amber-200' },
  ], [data.tier, stats.conversionRate, stats.pendingPayout]);

  React.useEffect(() => {
    if (dashboardQuery.isError || profileQuery.isError) {
      toast.error('Affiliate dashboard unavailable', {
        description: 'Showing cached affiliate metrics while the API recovers.',
      });
    }
  }, [dashboardQuery.isError, profileQuery.isError]);

  const copyReferralLink = async () => {
    if (!referralLink) {
      toast.error('Referral link not ready');
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setShareState('copied');
      toast.success('Referral link copied', {
        description: 'Share it with your network or partners.',
      });
    } catch {
      toast.error('Could not copy referral link');
    }
  };

  const shareReferral = async () => {
    if (!referralLink) {
      toast.error('Referral link not ready');
      return;
    }

    try {
      const message = `Join me on Profytron with my referral link: ${referralLink}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Profytron referral',
          text: message,
          url: referralLink,
        });
      } else {
        await navigator.clipboard.writeText(message);
        toast.message('Share text copied');
      }

      setShareState('tracked');
      await affiliatesApi.trackClick(referralCode);
      toast.success('Share tracked', {
        description: 'Backend click counter updated for your referral code.',
      });
    } catch {
      toast.error('Share flow failed', {
        description: 'Try copy link if native share is unavailable.',
      });
    }
  };

  return (
    <main className="space-y-8 p-6 md:p-8 text-white">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[#070814] px-6 py-7 md:px-8 md:py-8 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
        <motion.div className="absolute -left-10 top-0 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl" animate={{ x: [0, 16, 0], y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute right-0 top-20 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" animate={{ x: [0, -12, 0], y: [0, 14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_34%)]" />

        <div className="relative mb-6 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
            <Network className="h-3.5 w-3.5" />
            Affiliate tree
          </div>
          <div className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]', isLoading ? 'border-amber-400/20 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/5 text-white/50')}>
            {isLoading ? 'Syncing live data' : 'Backend synced'}
          </div>
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">Grow a referral tree that feels alive, premium, and tied to real performance data.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                Your live dashboard data drives the core numbers here, while the motion system turns clicks, signups, and payouts into a clear visual path for partners and creators.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={copyReferralLink} disabled={!referralLink} className="gap-2 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-50">
                <Copy className="h-4 w-4" />
                Copy referral link
              </Button>
              <Button
                onClick={shareReferral}
                variant="outline"
                disabled={!referralLink}
                className="gap-2 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Share with tracking
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/affiliate/best')}
                className="gap-2 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                Best affiliates
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => dashboardQuery.refetch()}
                className="gap-2 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh data
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
              {shareTargets.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    className={cn('flex items-center gap-2 rounded-full border px-3 py-2', shareState === 'tracked' && index === 2 ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-white/8 bg-white/4 text-white/45')}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </motion.div>
                );
              })}
              {shareState !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-cyan-200"
                >
                  <Check className="h-3.5 w-3.5" />
                  {shareState === 'copied' ? 'Copied locally' : 'Tracked in backend'}
                </motion.div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AnimatePresence>
                {metricCards.map((card, index) => {
                  const Icon = card.icon;
                  const value = card.key === 'clicks'
                    ? stats.clicks
                    : card.key === 'signups'
                      ? stats.signups
                      : card.key === 'conversions'
                        ? stats.conversions
                        : `${stats.conversionRate}%`;

                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -5 }}
                      className="rounded-[24px] border border-white/8 bg-white/4 p-4 backdrop-blur-sm min-h-[144px] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-3 text-white/55">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">{card.label}</span>
                        <Icon className="h-4 w-4 text-p" />
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
                      <div className="mt-2 text-[11px] leading-5 text-white/35">
                        {card.key === 'clicks' && 'Every visit contributes to the network signal.'}
                        {card.key === 'signups' && 'New users from your link are registered here.'}
                        {card.key === 'conversions' && 'Paid activations update commissions and tier progress.'}
                        {card.key === 'conversionRate' && 'Quality metric based on signups divided by tracked clicks.'}
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          className={cn('h-full rounded-full bg-gradient-to-r', index === 0 ? 'from-p via-cyan-400 to-emerald-400' : index === 1 ? 'from-emerald-400 via-teal-400 to-cyan-400' : index === 2 ? 'from-amber-400 via-orange-400 to-rose-400' : 'from-violet-400 via-fuchsia-400 to-cyan-400')}
                          initial={{ width: '20%' }}
                          animate={{ width: [`${20 + index * 8}%`, `${70 - index * 4}%`, `${20 + index * 8}%`] }}
                          transition={{ duration: 5 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {ownMetrics.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="rounded-[22px] border border-white/8 bg-[#0b0d18] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] min-h-[118px]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">{item.label}</p>
                  <p className={cn('mt-3 text-2xl font-semibold', item.tone)}>{item.value}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-white/8">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-p via-cyan-400 to-emerald-400"
                      initial={{ width: '18%' }}
                      animate={{ width: ['18%', '76%', '18%'] }}
                      transition={{ duration: 4.2 + index * 0.25, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/8 bg-white/4 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Your referral code</p>
                  <div className="mt-2 flex items-center gap-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-white">{referralCode}</h2>
                    <span className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]', data.tier === 'ELITE' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : data.tier === 'PRO' ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200' : 'border-white/10 bg-white/5 text-white/50')}>
                      {data.tier}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">{profile ? 'Live user record loaded from backend.' : 'Fallback metrics are active.'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white/55">
                  <WalletCards className="h-5 w-5 text-p" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Commission rate</p>
                  <p className="mt-2 text-xl font-semibold text-white">{Math.round(data.commissionRate * 100)}%</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Pending payout</p>
                  <p className="mt-2 text-xl font-semibold text-amber-300">{formatCurrency(stats.pendingPayout)}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Earned</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-300">{formatCurrency(stats.totalEarned)}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Paid</p>
                  <p className="mt-2 text-xl font-semibold text-sky-300">{formatCurrency(stats.totalPaid)}</p>
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-[28px] border border-white/8 bg-white/4 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Tree activity</p>
                  <p className="mt-2 text-sm text-white/60">Animated network flow for clicks, signups, and conversions.</p>
                </div>
                <Sparkles className="h-5 w-5 text-amber-300" />
              </div>
              <div className="mt-4">
                <AffiliateTreeScene
                  title="Affiliate network"
                  subtitle="A moving tree that shows your referral flow from the root node down to active conversions."
                  nodes={affiliateTreeNodes}
                />
              </div>
            </motion.div>

            <div className="rounded-[28px] border border-white/8 bg-[#0b0d18] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Live funnel pulse</p>
                  <p className="mt-2 text-sm text-white/60">Tracked from backend data and visualized as a weighted flow.</p>
                </div>
                <Medal className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Traffic quality', value: stats.clicks, max: 22000, tone: 'from-cyan-400 to-cyan-200' },
                  { label: 'Signup momentum', value: stats.signups, max: 1600, tone: 'from-emerald-400 to-emerald-200' },
                  { label: 'Payout runway', value: stats.pendingPayout, max: 6000, tone: 'from-amber-400 to-orange-300' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-white/35">
                      <span>{row.label}</span>
                      <span>{typeof row.value === 'number' ? row.value.toLocaleString() : row.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        className={cn('h-full rounded-full bg-gradient-to-r', row.tone)}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (Number(row.value) / row.max) * 100)}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/65">
                <span>Live pace</span>
                <span className="font-semibold text-emerald-300">{Math.round(livePace)}%</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/4 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30">Compact widget</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Referral code', value: referralCode },
                  { label: 'Pending payout', value: formatCurrency(stats.pendingPayout) },
                  { label: 'Tier', value: data.tier },
                ].map((item, index) => (
                  <div key={item.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{item.label}</p>
                    <p className={cn('mt-2 text-sm font-semibold', index === 0 ? 'text-white' : index === 1 ? 'text-amber-300' : 'text-cyan-200')}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Clicks', value: stats.clicks, tone: 'text-cyan-300' },
          { label: 'Signups', value: stats.signups, tone: 'text-emerald-300' },
          { label: 'Conversions', value: stats.conversions, tone: 'text-amber-300' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -4 }}
            className="rounded-[24px] border border-white/8 bg-[#0b0d18] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">{item.label}</p>
            <p className={cn('mt-3 text-3xl font-semibold', item.tone)}>{item.value.toLocaleString()}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className={cn('h-full rounded-full', index === 0 ? 'bg-cyan-400' : index === 1 ? 'bg-emerald-400' : 'bg-amber-400')}
                initial={{ width: '18%' }}
                animate={{ width: ['18%', '88%', '18%'] }}
                transition={{ duration: 4.8 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
