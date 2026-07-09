/** Unified Profytron pricing — mirrors API PLATFORM_PLANS (INR). */
export const PLATFORM_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Paper trading and marketplace exploration.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '1 paper trading bot',
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
    description: 'For new traders starting with live MT5 copy execution.',
    monthlyPrice: 799,
    annualPrice: 7990,
    features: [
      '2 live trading bots',
      '1 strategy deployment',
      '1 broker account (MT5)',
      '25 Alpha Coach sessions/month',
      '90-day trade history',
      'Email support (48h)',
      'Add extra bots anytime',
    ],
    recommended: false,
    cta: 'Start 7-Day Trial',
    ctaHref: '/register?plan=starter',
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'For active traders building and deploying strategies.',
    monthlyPrice: 999,
    annualPrice: 9990,
    features: [
      '4 live trading bots',
      'Unlimited strategy deployments',
      '3 broker accounts',
      'Unlimited Alpha Coach',
      'AI risk management',
      'Priority chat support (24h)',
      'Add extra bots anytime',
    ],
    recommended: true,
    cta: 'Start 7-Day Trial',
    ctaHref: '/register?plan=pro',
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'For power traders running multiple bots and portfolios.',
    monthlyPrice: 1299,
    annualPrice: 12990,
    features: [
      '6 live trading bots',
      'Unlimited strategy builder',
      '5 broker accounts',
      '1 VPS bot slot',
      'Advanced analytics & exports',
      'Priority support + onboarding',
      'Add extra bots anytime',
    ],
    recommended: false,
    cta: 'Start 7-Day Trial',
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
    ctaHref: 'mailto:support@profytron.com',
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
