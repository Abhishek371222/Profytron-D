'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { plansApi, type PlatformPlan } from '@/lib/api/plans';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  Bot,
  Check,
  ChevronRight,
  Crown,
  Minus,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

const TIER_ICON: Record<string, React.ElementType> = {
  FREE: Bot,
  PRO: Zap,
  ELITE: Sparkles,
  BUSINESS: Users,
  INSTITUTIONAL: Crown,
};

const TIER_ICON_BG: Record<string, string> = {
  FREE: 'bg-muted/60 text-muted-foreground',
  PRO: 'bg-chart-5/10 text-chart-5',
  ELITE: 'bg-primary/10 text-primary',
  BUSINESS: 'bg-chart-2/10 text-chart-2',
  INSTITUTIONAL: 'bg-chart-4/10 text-chart-4',
};

function formatInr(amount: number) {
  if (amount < 0) return 'Custom';
  return `₹${amount.toLocaleString('en-IN')}`;
}

function annualEquivalentMonthly(annualPrice: number) {
  return Math.round(annualPrice / 12);
}

function CellValue({ value }: { value: number | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-chart-3 mx-auto" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
    );
  }
  return (
    <span className="text-xs font-medium text-foreground">
      {value >= 999 ? 'Unlimited' : value}
    </span>
  );
}

export default function TeamPlansPage() {
  const [annual, setAnnual] = React.useState(false);

  const plansQuery = useQuery({
    queryKey: ['platform-plans'],
    queryFn: () => plansApi.getPlans(),
  });

  const { data: currentUser } = useCurrentUser();

  const plans = plansQuery.data ?? [];
  const activeTier = String(currentUser?.subscriptionTier ?? 'FREE').toUpperCase();

  const handleGetStarted = (plan: PlatformPlan) => {
    if (plan.tier === 'FREE') return;
    if (plan.ctaHref.startsWith('mailto:')) return;
    toast.info(`Redirecting to checkout for ${plan.name} plan…`);
  };

  return (
    <div className="space-y-10 pb-12">
      { }
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Team Plans</span>
      </div>

      { }
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Crown className="h-5 w-5" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
        >
          Choose Your Plan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base text-muted-foreground"
        >
          Scale your bot trading with the right plan. Cancel or upgrade anytime.
        </motion.p>

        { }
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex mt-2 rounded-full border border-[var(--card-border)] bg-card p-1 gap-1"
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              'px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all',
              !annual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              'px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5',
              annual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Annual
            <span className={cn(
              'text-[9px] font-black px-1.5 py-0.5 rounded-full border transition-colors',
              annual ? 'bg-white/20 text-white border-white/30' : 'bg-chart-3/10 text-chart-3 border-chart-3/20',
            )}>
              SAVE
            </span>
          </button>
        </motion.div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {plans.map((plan, idx) => {
          const isActive = activeTier === plan.tier;
          const isCustom = plan.monthlyPrice < 0;
          const price = isCustom ? 0 : plan.monthlyPrice === 0 ? 0 : annual ? plan.annualPrice : plan.monthlyPrice;
          const Icon = TIER_ICON[plan.tier] ?? Bot;
          const isMailto = plan.ctaHref.startsWith('mailto:');

          return (
            <motion.div
              key={plan.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.06, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
              className={cn(
                'dashboard-card flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]',
                plan.recommended
                  ? 'border-primary/40 bg-gradient-to-b from-primary/[0.07] to-primary/[0.02] shadow-lg shadow-primary/10'
                  : '',
                isActive && !plan.recommended ? 'border-primary/30' : '',
              )}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                  MOST POPULAR
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', TIER_ICON_BG[plan.tier] ?? TIER_ICON_BG.FREE)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isActive && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-chart-3/10 text-chart-3 border border-chart-3/20">
                      CURRENT
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-xs mt-1 mb-3">{plan.description}</p>

                <div className="mb-4">
                  {isCustom ? (
                    <p className="text-2xl font-black text-foreground">Custom</p>
                  ) : price === 0 ? (
                    <p className="text-3xl font-black text-foreground">Free</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-black text-foreground tabular-nums">
                        {formatInr(price)}
                        <span className="text-sm font-normal text-muted-foreground">/{annual ? 'yr' : 'mo'}</span>
                      </p>
                      {annual && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatInr(annualEquivalentMonthly(price))}/mo billed annually
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                      <Check className="h-3.5 w-3.5 text-chart-3 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isMailto ? (
                    <a
                      href={plan.ctaHref}
                      className="w-full inline-flex items-center justify-center h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                    >
                      {plan.cta}
                    </a>
                  ) : isActive ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wide border border-primary/30 bg-primary/10 text-primary cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : plan.tier === 'FREE' ? (
                    <Link
                      href={plan.ctaHref}
                      className="w-full inline-flex items-center justify-center h-10 rounded-xl text-xs font-bold uppercase tracking-wide border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGetStarted(plan)}
                      className={cn(
                        'w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors',
                        plan.recommended
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                          : 'border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground hover:border-primary/30',
                      )}
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      { }
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground"
      >
        {[
          { icon: Shield, text: '30-day money-back guarantee' },
          { icon: Zap, text: 'Cancel anytime, no lock-in' },
          { icon: Bot, text: 'Instant bot access after payment' },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {text}
          </span>
        ))}
      </motion.div>

      { }
      {plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="dashboard-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--card-border)]">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Compare Plans</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Full feature comparison across all tiers</p>
          </div>

          <div className="responsive-table-shell">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-muted/20">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-1/3">
                    Feature
                  </th>
                  {plans.map((p) => (
                    <th key={p.slug} className={cn('px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider', p.recommended ? 'text-primary' : 'text-muted-foreground')}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {[
                  { label: 'Live trading bots', key: 'maxStrategies' as const },
                  { label: 'Copy-trades', key: 'maxCopyTrades' as const },
                  { label: 'Broker accounts', key: 'maxBrokerAccounts' as const },
                  { label: 'Shared teammates', key: 'maxTeamMembers' as const },
                ].map((row, i) => (
                  <tr key={row.label} className={cn('transition-colors hover:bg-muted/10', i % 2 === 0 ? '' : 'bg-muted/5')}>
                    <td className="px-5 py-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                    {plans.map((p) => (
                      <td key={p.slug} className="px-4 py-3 text-center">
                        <CellValue value={p[row.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="transition-colors hover:bg-muted/10 bg-muted/5">
                  <td className="px-5 py-3 text-xs font-medium text-muted-foreground">Priority support</td>
                  {plans.map((p) => (
                    <td key={p.slug} className="px-4 py-3 text-center">
                      <CellValue value={p.prioritySupport} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
