'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrentSubscription {
  plan?: { name?: string };
  planName?: string;
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    monthlyPrice: 0,
    icon: Bot,
    iconBg: 'bg-muted/60 text-muted-foreground',
    highlight: false,
    badge: null,
    description: 'Get started with bot trading at zero cost.',
    features: [
      'Max 1 active bot',
      'View up to 10 bots in marketplace',
      'Basic analytics dashboard',
      'Email support',
      'Demo trading mode',
    ],
    notIncluded: [
      'AI-powered bots',
      'Advanced analytics',
      'API access',
      'Priority support',
    ],
    cta: 'Continue Free',
    ctaHref: '/dashboard',
  },
  {
    id: 'BASIC',
    name: 'Basic',
    monthlyPrice: 999,
    icon: Zap,
    iconBg: 'bg-chart-5/10 text-chart-5',
    highlight: false,
    badge: '7-day free trial',
    badgeClass: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
    description: 'For individual traders building consistency.',
    features: [
      'Max 5 active bots',
      'Full marketplace access',
      'Standard analytics',
      'Priority email support',
      'Bot performance tracking',
      'Copy-trading (1 signal)',
    ],
    notIncluded: [
      'AI-powered bots',
      'API access',
      'White-label options',
    ],
    cta: 'Get Started',
    ctaHref: '#',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    monthlyPrice: 2999,
    icon: Sparkles,
    iconBg: 'bg-primary/10 text-primary',
    highlight: true,
    badge: 'MOST POPULAR',
    badgeClass: 'bg-primary/10 text-primary border-primary/30',
    description: 'For serious traders who want an edge.',
    features: [
      'Unlimited active bots',
      'AI-powered bots access',
      'Advanced analytics',
      'Priority support (24/7)',
      'Custom risk controls',
      'API access',
      'White-label options',
      'Copy-trading (unlimited)',
    ],
    notIncluded: [],
    cta: 'Get Started',
    ctaHref: '#',
  },
  {
    id: 'TEAM',
    name: 'Team',
    monthlyPrice: 7999,
    icon: Users,
    iconBg: 'bg-chart-2/10 text-chart-2',
    highlight: false,
    badge: 'For firms',
    badgeClass: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
    description: 'For prop firms, funds and trading teams.',
    features: [
      'Everything in Premium',
      'Multi-account trading',
      'Team member access (up to 5)',
      'Creator access — publish bots',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9% uptime)',
      'Priority onboarding',
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    ctaHref: 'mailto:sales@profytron.com',
  },
] as const;

// ─── Feature comparison matrix ────────────────────────────────────────────────

type FeatureAvailability = boolean | string;

const COMPARE_FEATURES: { label: string; free: FeatureAvailability; basic: FeatureAvailability; premium: FeatureAvailability; team: FeatureAvailability }[] = [
  { label: 'Active bots', free: '1', basic: '5', premium: 'Unlimited', team: 'Unlimited' },
  { label: 'Marketplace access', free: '10 bots', basic: 'Full', premium: 'Full', team: 'Full' },
  { label: 'AI-powered bots', free: false, basic: false, premium: true, team: true },
  { label: 'Analytics', free: 'Basic', basic: 'Standard', premium: 'Advanced', team: 'Advanced' },
  { label: 'Copy-trading signals', free: false, basic: '1', premium: 'Unlimited', team: 'Unlimited' },
  { label: 'Custom risk controls', free: false, basic: false, premium: true, team: true },
  { label: 'API access', free: false, basic: false, premium: true, team: true },
  { label: 'White-label options', free: false, basic: false, premium: true, team: true },
  { label: 'Multi-account trading', free: false, basic: false, premium: false, team: true },
  { label: 'Team members', free: false, basic: false, premium: false, team: 'Up to 5' },
  { label: 'Creator access', free: false, basic: false, premium: false, team: true },
  { label: 'Dedicated manager', free: false, basic: false, premium: false, team: true },
  { label: 'SLA guarantee', free: false, basic: false, premium: false, team: true },
  { label: 'Support', free: 'Email', basic: 'Priority email', premium: '24/7 priority', team: 'Dedicated' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function annualPrice(monthly: number) {
  return Math.round(monthly * 12 * 0.8);
}

function CellValue({ value }: { value: FeatureAvailability }) {
  if (value === true) return <Check className="h-4 w-4 text-chart-3 mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPlansPage() {
  const [annual, setAnnual] = React.useState(false);

  const currentQuery = useQuery({
    queryKey: ['subscription-current'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/current');
      return unwrapApiResponse<CurrentSubscription>(res.data);
    },
  });

  const current = currentQuery.data;
  const activePlan = (current?.plan?.name ?? current?.planName ?? 'FREE').toUpperCase();

  const handleGetStarted = (planId: string, planName: string) => {
    if (planId === 'FREE') return;
    if (planId === 'TEAM') return; // handled by mailto href
    toast.info(`Redirecting to checkout for ${planName} plan…`);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Team Plans</span>
      </div>

      {/* Header */}
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

        {/* Monthly / Annual toggle */}
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
              SAVE 20%
            </span>
          </button>
        </motion.div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((plan, idx) => {
          const isActive = activePlan === plan.id;
          const price = plan.monthlyPrice === 0
            ? 0
            : annual
            ? annualPrice(plan.monthlyPrice)
            : plan.monthlyPrice;

          const Icon = plan.icon;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.06, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
              className={cn(
                'dashboard-card flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]',
                plan.highlight
                  ? 'border-primary/40 bg-gradient-to-b from-primary/[0.07] to-primary/[0.02] shadow-lg shadow-primary/10'
                  : '',
                isActive && !plan.highlight ? 'border-primary/30' : '',
              )}
            >
              {/* Popular ribbon */}
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                  MOST POPULAR
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col">
                {/* Icon + badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', plan.iconBg)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {plan.badge && !plan.highlight && (
                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border', plan.badgeClass)}>
                      {plan.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-chart-3/10 text-chart-3 border border-chart-3/20">
                      CURRENT
                    </span>
                  )}
                </div>

                {/* Name + price */}
                <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-xs mt-1 mb-3">{plan.description}</p>

                <div className="mb-4">
                  {price === 0 ? (
                    <p className="text-3xl font-black text-foreground">Free</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-black text-foreground tabular-nums">
                        {formatInr(price)}
                        <span className="text-sm font-normal text-muted-foreground">/{annual ? 'yr' : 'mo'}</span>
                      </p>
                      {annual && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatInr(Math.round(price / 12))}/mo billed annually
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                      <Check className="h-3.5 w-3.5 text-chart-3 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/50">
                      <Minus className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-5">
                  {plan.id === 'TEAM' ? (
                    <a
                      href={plan.ctaHref}
                      className={cn(
                        'w-full inline-flex items-center justify-center h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors',
                        'border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground hover:border-primary/30',
                      )}
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
                  ) : plan.id === 'FREE' ? (
                    <Link
                      href={plan.ctaHref}
                      className="w-full inline-flex items-center justify-center h-10 rounded-xl text-xs font-bold uppercase tracking-wide border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGetStarted(plan.id, plan.name)}
                      className={cn(
                        'w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors',
                        plan.highlight
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

      {/* Guarantees bar */}
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

      {/* Compare Plans Table */}
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
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-muted/20">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-1/3">
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th key={p.id} className={cn('px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider', p.highlight ? 'text-primary' : 'text-muted-foreground')}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {COMPARE_FEATURES.map((row, i) => (
                <tr key={row.label} className={cn('transition-colors hover:bg-muted/10', i % 2 === 0 ? '' : 'bg-muted/5')}>
                  <td className="px-5 py-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-center"><CellValue value={row.free} /></td>
                  <td className="px-4 py-3 text-center"><CellValue value={row.basic} /></td>
                  <td className="px-4 py-3 text-center bg-primary/[0.03]"><CellValue value={row.premium} /></td>
                  <td className="px-4 py-3 text-center"><CellValue value={row.team} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
