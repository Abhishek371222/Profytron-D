'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Copy,
  Share2,
  Users,
  Gift,
  TrendingUp,
  Network,
  Check,
  Wallet,
  MousePointerClick,
  UserPlus,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashButton,
  DashStatCard,
  DashErrorState,
} from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';
import { affiliatesApi } from '@/lib/api/affiliates';
import { toast } from 'sonner';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const CHART_DATA = [
  { day: 'Mon', clicks: 120, signups: 18, conversions: 4 },
  { day: 'Tue', clicks: 180, signups: 24, conversions: 6 },
  { day: 'Wed', clicks: 150, signups: 20, conversions: 5 },
  { day: 'Thu', clicks: 210, signups: 32, conversions: 9 },
  { day: 'Fri', clicks: 260, signups: 38, conversions: 11 },
  { day: 'Sat', clicks: 190, signups: 28, conversions: 7 },
  { day: 'Sun', clicks: 170, signups: 22, conversions: 6 },
];

export default function AffiliatePage() {
  const [origin, setOrigin] = React.useState('');

  const dashboardQuery = useQuery({
    queryKey: ['affiliate-dashboard'],
    queryFn: () => affiliatesApi.getDashboard(),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const profileQuery = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => affiliatesApi.getMine(),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const data = dashboardQuery.data;
  const profile = profileQuery.data;
  const stats = data?.stats;
  const tier = data?.tier ?? profile?.tier ?? 'Starter';
  const commissionRate = data?.commissionRate ?? profile?.commissionRate ?? 0.3;
  const referralCode = data?.referralCode || profile?.referralCode || '—';
  const referralLink = origin && referralCode !== '—' ? `${origin}/signup?ref=${referralCode}` : '';

  const copyReferralLink = async () => {
    if (!referralLink) {
      toast.error('Referral link not ready');
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareReferral = async () => {
    if (!referralLink) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Profytron', text: 'Join me on Profytron', url: referralLink });
      } else {
        await navigator.clipboard.writeText(referralLink);
        toast.message('Link copied for sharing');
      }
    } catch {
      /* user cancelled share */
    }
  };

  const statCards = [
    {
      label: 'Clicks',
      value: stats?.clicks ?? 0,
      sub: 'Tracked visits from your link',
      icon: MousePointerClick,
      color: 'text-primary',
      bar: 'bg-primary',
    },
    {
      label: 'Signups',
      value: stats?.signups ?? 0,
      sub: 'Users who registered',
      icon: UserPlus,
      color: 'text-chart-3',
      bar: 'bg-chart-3',
    },
    {
      label: 'Conversions',
      value: stats?.conversions ?? 0,
      sub: 'Paid activations',
      icon: Gift,
      color: 'text-chart-4',
      bar: 'bg-chart-4',
    },
    {
      label: 'Conversion Rate',
      value: stats ? `${stats.conversionRate}%` : '0%',
      sub: 'Signups ÷ clicks',
      icon: TrendingUp,
      color: 'text-chart-5',
      bar: 'bg-chart-5',
    },
  ];

  const funnel = [
    { label: 'Clicks', value: stats?.clicks ?? 0, pct: 100, color: 'bg-primary' },
    { label: 'Signups', value: stats?.signups ?? 0, pct: stats?.clicks ? Math.min(100, (stats.signups / stats.clicks) * 100) : 0, color: 'bg-chart-3' },
    { label: 'Conversions', value: stats?.conversions ?? 0, pct: stats?.signups ? Math.min(100, (stats.conversions / stats.signups) * 100) : 0, color: 'bg-chart-4' },
    { label: 'Payouts', value: stats ? formatCurrency(stats.pendingPayout) : '$0', pct: 42, color: 'bg-chart-2' },
  ];

  if (dashboardQuery.isLoading) {
    return (
      <DashboardPage>
        <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Affiliate' }]} />
        <div className="space-y-5 animate-pulse">
          <div className="dashboard-card h-48" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dashboard-card h-28" />
            ))}
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <DashboardPage>
        <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Affiliate' }]} />
        <DashErrorState
          message="Couldn't load your affiliate dashboard."
          onRetry={() => dashboardQuery.refetch()}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Affiliate' }]} />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="dashboard-card p-6 md:p-8 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-3/5 pointer-events-none" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] items-start">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <Network className="h-3.5 w-3.5" />
              Affiliate Program
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Grow your network. Earn real rewards.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share your referral link, track signups and conversions, and earn commissions on every active subscriber you bring in.
            </p>
            <div className="flex flex-wrap gap-3">
              <DashButton onClick={copyReferralLink} disabled={!referralLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Referral Link
              </DashButton>
              <DashButton variant="outline" onClick={shareReferral} disabled={!referralLink} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share & Earn
              </DashButton>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              {['Real-time tracking', 'Lifetime commissions', 'Secure & transparent', 'Instant payouts'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-chart-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Network illustration */}
          <div className="hidden lg:flex items-center justify-center w-48 h-48 shrink-0">
            <svg viewBox="0 0 160 160" className="w-full h-full text-primary/30">
              <circle cx="80" cy="40" r="14" fill="currentColor" className="text-primary" />
              <circle cx="40" cy="100" r="10" fill="currentColor" opacity="0.6" />
              <circle cx="120" cy="100" r="10" fill="currentColor" opacity="0.6" />
              <circle cx="60" cy="140" r="8" fill="currentColor" opacity="0.4" />
              <circle cx="100" cy="140" r="8" fill="currentColor" opacity="0.4" />
              <line x1="80" y1="54" x2="40" y2="90" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <line x1="80" y1="54" x2="120" y2="90" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <line x1="40" y1="110" x2="60" y2="132" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
              <line x1="120" y1="110" x2="100" y2="132" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
            </svg>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-4 min-w-0">
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {statCards.map((card) => (
              <DashStatCard
                key={card.label}
                label={card.label}
                value={typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                hint={card.sub}
              />
            ))}
          </div>

          {/* Referral activity chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
            className="dashboard-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Referral Activity</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Clicks, signups & conversions this week</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground border border-[var(--card-border)] rounded-lg px-2.5 py-1">
                This Month
              </span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="affClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="affSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--card-border)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="clicks" stroke="var(--primary)" fill="url(#affClicks)" strokeWidth={2} />
                  <Area type="monotone" dataKey="signups" stroke="var(--chart-5)" fill="url(#affSignups)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
            className="dashboard-card p-5"
          >
            <h2 className="text-base font-semibold text-foreground mb-4">Live Funnel Pulse</h2>
            <div className="space-y-3">
              {funnel.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {typeof row.value === 'number' ? row.value.toLocaleString() : row.value}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700', row.color)} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column — referral code */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
            className="dashboard-card p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Your Referral Code</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xl font-bold text-foreground font-mono break-all">{referralCode}</p>
                </div>
              </div>
              <span className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                dashboardQuery.isSuccess ? 'bg-chart-3/10 text-chart-3 border-chart-3/20' : 'bg-muted text-muted-foreground border-[var(--card-border)]',
              )}>
                {dashboardQuery.isSuccess ? 'Backend synced' : 'Loading…'}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--card-border)] bg-muted/30 p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Referral link</p>
              <p className="text-xs font-mono text-foreground break-all">{referralLink || '—'}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Zap className="h-3 w-3" />
              {tier} Tier · {Math.round(commissionRate * 100)}% commission
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Commission Rate', value: `${Math.round(commissionRate * 100)}%` },
                { label: 'Pending Payout', value: stats ? formatCurrency(stats.pendingPayout) : '$0.00' },
                { label: 'Earned', value: stats ? formatCurrency(stats.totalEarned) : '$0.00' },
                { label: 'Paid', value: stats ? formatCurrency(stats.totalPaid) : '$0.00' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-base font-bold text-foreground mt-1 tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>

            <DashButton onClick={copyReferralLink} disabled={!referralLink} className="w-full mt-4 gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </DashButton>
          </motion.div>

          {/* Network tree */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
            className="dashboard-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Affiliate Network</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your referral tree</p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">YOU</div>
              <div className="flex gap-8">
                {['Clicks', 'Signups', 'Conversions'].map((n, i) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div className={cn('w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold', i === 0 ? 'border-primary/40 bg-primary/10 text-primary' : i === 1 ? 'border-chart-3/40 bg-chart-3/10 text-chart-3' : 'border-chart-4/40 bg-chart-4/10 text-chart-4')}>
                      {i === 0 ? stats?.clicks ?? 0 : i === 1 ? stats?.signups ?? 0 : stats?.conversions ?? 0}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/30 border border-[var(--card-border)] px-3 py-2.5 text-xs text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary shrink-0" />
              Pending: {stats ? formatCurrency(stats.pendingPayout) : '$0.00'}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardPage>
  );
}
