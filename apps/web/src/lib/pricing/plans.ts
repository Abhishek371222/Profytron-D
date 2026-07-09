/** Unified Profytron pricing — mirrors API PLATFORM_PLANS (INR). */
export const PLATFORM_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Paper trading and marketplace exploration.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '1 paper copy subscription',
      'Paper trading account',
      'Basic analytics (30 days)',
      '5 Alpha Coach sessions/month',
      'Community support',
    ],
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
    features: [
      '3 live copy subscriptions',
      '2 strategy deployments',
      '2 broker accounts',
      '50 Alpha Coach sessions/month',
      '1 year trade history',
      'Email support (48h)',
    ],
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
    features: [
      'Unlimited copy subscriptions',
      'Unlimited strategy deployments',
      '5 broker accounts',
      'Unlimited Alpha Coach',
      '1 VPS bot slot',
      'Priority chat support (24h)',
    ],
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
    features: [
      'Everything in Pro',
      '5 team seats',
      '20 broker accounts',
      '5 VPS bot slots',
      'Dedicated CSM',
    ],
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
    features: [
      'NY4/LD4 colocation options',
      'Dedicated solutions architect',
      'White-label client dashboard',
      'On-premise deployment',
      'Custom SLAs',
    ],
    recommended: false,
    cta: 'Contact Engineering',
    ctaHref: 'mailto:enterprise@profytron.com',
  },
] as const;

export function formatInr(amount: number) {
  if (amount < 0) return 'Custom';
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function planPriceLabel(
  plan: (typeof PLATFORM_PLANS)[number],
  cycle: 'monthly' | 'yearly',
) {
  if (plan.monthlyPrice < 0) return 'Custom';
  if (plan.monthlyPrice === 0) return 'Free';
  const amount = cycle === 'yearly' ? plan.annualPrice / 12 : plan.monthlyPrice;
  return `${formatInr(Math.round(amount))}/mo`;
}
