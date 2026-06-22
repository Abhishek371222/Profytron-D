/** Canonical Profytron platform pricing — single source of truth for seed + API. */
export const PLATFORM_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Paper trading and marketplace exploration.',
    monthlyPrice: 0,
    annualPrice: 0,
    tier: 'FREE' as const,
    features: [
      '1 paper copy subscription',
      'Paper trading account',
      'Basic analytics (30 days)',
      '5 AI Coach sessions/month',
      'Community support',
    ],
    maxStrategies: 0,
    maxCopyTrades: 1,
    maxBrokerAccounts: 1,
    prioritySupport: false,
    recommended: false,
    cta: 'Start Free',
    ctaHref: '/register?plan=free',
  },
  {
    slug: 'starter',
    name: 'Starter',
    description: 'For retail copy traders getting started with live execution.',
    monthlyPrice: 3999,
    annualPrice: 39990,
    tier: 'PRO' as const,
    features: [
      '3 live copy subscriptions',
      '2 strategy deployments',
      '2 broker accounts',
      '50 AI Coach sessions/month',
      '1 year trade history',
      'Email support (48h)',
    ],
    maxStrategies: 2,
    maxCopyTrades: 3,
    maxBrokerAccounts: 2,
    prioritySupport: false,
    recommended: false,
    cta: 'Start 7-Day Trial',
    ctaHref: '/register?plan=starter',
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'For active traders and strategy builders.',
    monthlyPrice: 11999,
    annualPrice: 119990,
    tier: 'ELITE' as const,
    features: [
      'Unlimited copy subscriptions',
      'Unlimited strategy deployments',
      '5 broker accounts',
      'Unlimited AI Coach',
      '1 VPS bot slot',
      'Priority chat support (24h)',
      '14-day marketplace trials',
    ],
    maxStrategies: 999,
    maxCopyTrades: 999,
    maxBrokerAccounts: 5,
    prioritySupport: true,
    recommended: true,
    cta: 'Start 7-Day Trial',
    ctaHref: '/register?plan=pro',
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'For prop desks and small funds (5 seats).',
    monthlyPrice: 29999,
    annualPrice: 299990,
    tier: 'INSTITUTIONAL' as const,
    features: [
      'Everything in Pro',
      '5 team seats',
      '20 broker accounts',
      '5 VPS bot slots',
      '100K API calls/day',
      'Dedicated CSM',
      'Custom SLAs',
    ],
    maxStrategies: 999,
    maxCopyTrades: 999,
    maxBrokerAccounts: 20,
    prioritySupport: true,
    recommended: false,
    cta: 'Contact Sales',
    ctaHref: '/register?plan=business',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'White-label, colocation, and on-premise deployment.',
    monthlyPrice: -1,
    annualPrice: -1,
    tier: 'INSTITUTIONAL' as const,
    features: [
      'NY4/LD4 colocation options',
      'FIX/WebSocket direct TCP',
      'Dedicated solutions architect',
      'White-label client dashboard',
      'On-premise deployment',
      'Custom contracts & SLAs',
    ],
    maxStrategies: 9999,
    maxCopyTrades: 9999,
    maxBrokerAccounts: 9999,
    prioritySupport: true,
    recommended: false,
    cta: 'Contact Engineering',
    ctaHref: 'mailto:enterprise@profytron.com',
  },
] as const;

export const REFERRAL_DEPOSIT_BONUS_INR = 500;
export const REFERRAL_MIN_DEPOSIT_INR = 1000;

export type PlanLimits = {
  maxStrategies: number;
  maxCopyTrades: number;
  maxBrokerAccounts: number;
};

/**
 * Resolve the quota limits for a user's subscription tier. Multiple plans can
 * share a tier (e.g. both Business and Enterprise are INSTITUTIONAL); we take
 * the most generous limit at the tier so paying customers are never
 * under-provisioned. Unknown tiers fall back to FREE.
 */
export function getTierLimits(tier: string | null | undefined): PlanLimits {
  const matches = PLATFORM_PLANS.filter((p) => p.tier === tier);
  const source = matches.length
    ? matches
    : PLATFORM_PLANS.filter((p) => p.tier === 'FREE');
  return source.reduce<PlanLimits>(
    (acc, p) => ({
      maxStrategies: Math.max(acc.maxStrategies, p.maxStrategies),
      maxCopyTrades: Math.max(acc.maxCopyTrades, p.maxCopyTrades),
      maxBrokerAccounts: Math.max(acc.maxBrokerAccounts, p.maxBrokerAccounts),
    }),
    { maxStrategies: 0, maxCopyTrades: 0, maxBrokerAccounts: 0 },
  );
}
