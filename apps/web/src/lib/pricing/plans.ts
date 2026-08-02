export const ANNUAL_SAVE_PERCENT = 17;
export const ANNUAL_SAVE_LABEL = `Save up to ${ANNUAL_SAVE_PERCENT}%`;

export const PRICING_TRUST_ITEMS = [
  '7-day free trial on paid plans',
  'Cancel anytime — no fees',
  'Paper trading on Free',
  'Prices in INR · GST at checkout',
] as const;

export const PRICING_FAQ_ITEMS = [
  {
    question: 'Is there a free trial?',
    answer:
      'Yes. Every paid plan includes a 7-day trial. The Free plan lets you explore paper trading without a subscription. Checkout shows any payment requirement before a paid plan starts.',
  },
  {
    question: 'What happens when I cancel?',
    answer:
      'You keep full access until the end of your current billing period. There are no cancellation fees. After that, your account moves to the Free plan.',
  },
  {
    question: 'Monthly or annual — which should I choose?',
    answer:
      'Annual billing is charged once per year and includes two months free (about 17% less than paying monthly). You can switch at the next renewal from Billing settings.',
  },
  {
    question: 'What does Enterprise include?',
    answer:
      'Enterprise covers white-label dashboards, colocation options, on-premise deployment, custom SLAs, and a dedicated solutions architect. Pricing is custom — contact sales for a scoped proposal.',
  },
  {
    question: 'How does GST work?',
    answer:
      'Indian customers see GST applied at checkout. Downloadable tax invoices are being rolled out; contact support if you need a payment record sooner.',
  },
] as const;

/** Feature matrix for the /pricing comparison table (values must match plan limits). */
export const PLAN_COMPARISON_ROWS = [
  {
    label: 'Paper trading',
    values: {
      free: 'Yes',
      starter: 'Yes',
      pro: 'Yes',
      business: 'Yes',
      enterprise: 'Yes',
    },
  },
  {
    label: 'Live trading bots',
    values: {
      free: '—',
      starter: '2',
      pro: '4',
      business: '6',
      enterprise: 'Custom',
    },
  },
  {
    label: 'Broker accounts (MT5)',
    values: {
      free: '—',
      starter: '1',
      pro: '3',
      business: '5',
      enterprise: 'Custom',
    },
  },
  {
    label: 'Strategy deployments',
    values: {
      free: '—',
      starter: '1',
      pro: 'Unlimited',
      business: 'Unlimited',
      enterprise: 'Unlimited',
    },
  },
  {
    label: 'Alpha Coach sessions',
    values: {
      free: '5 / mo',
      starter: '25 / mo',
      pro: 'Unlimited',
      business: 'Unlimited',
      enterprise: 'Unlimited',
    },
  },
  {
    label: 'VPS bot slot',
    values: {
      free: '—',
      starter: '—',
      pro: '—',
      business: '1',
      enterprise: 'Custom',
    },
  },
  {
    label: 'Support',
    values: {
      free: 'Community',
      starter: 'Email · 48h',
      pro: 'Chat · 24h',
      business: 'Priority + onboarding',
      enterprise: 'Dedicated architect',
    },
  },
] as const;

export const COMPARISON_PLAN_COLUMNS = [
  { slug: 'free', name: 'Free' },
  { slug: 'starter', name: 'Starter' },
  { slug: 'pro', name: 'Pro' },
  { slug: 'business', name: 'Business' },
  { slug: 'enterprise', name: 'Enterprise' },
] as const;

export const PLATFORM_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Explore the marketplace and practice with paper trading.',
    monthlyPrice: 0,
    annualPrice: 0,
    previousPlanName: undefined as string | undefined,
    features: [
      '1 paper trading bot',
      'Paper trading account',
      'Basic analytics (30 days)',
      '5 Alpha Coach sessions/month',
      'Community support',
    ],
    recommended: false,
    cta: 'Start free',
    ctaHref: '/register?plan=free',
  },
  {
    slug: 'starter',
    name: 'Starter',
    description: 'Go live on MT5 with clear limits built for new traders.',
    monthlyPrice: 799,
    annualPrice: 7990,
    previousPlanName: undefined as string | undefined,
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
    cta: 'Start 7-day trial',
    ctaHref: '/register?plan=starter',
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'More bots, unlimited coaching, and priority support for active desks.',
    monthlyPrice: 999,
    annualPrice: 9990,
    previousPlanName: 'Starter',
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
    cta: 'Start 7-day trial',
    ctaHref: '/register?plan=pro',
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Multi-account portfolios with VPS capacity and hands-on onboarding.',
    monthlyPrice: 1299,
    annualPrice: 12990,
    previousPlanName: 'Pro',
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
    cta: 'Start 7-day trial',
    ctaHref: '/register?plan=business',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'White-label, colocation, and on-premise options for institutions.',
    monthlyPrice: -1,
    annualPrice: -1,
    previousPlanName: 'Business' as string | undefined,
    features: [
      'NY4/LD4 colocation options',
      'Dedicated solutions architect',
      'White-label client dashboard',
      'On-premise deployment',
      'Custom SLAs',
    ],
    recommended: false,
    cta: 'Talk to sales',
    ctaHref: 'mailto:support@profytron.com',
  },
] as const;

export { formatInr, formatMoney } from '@/lib/currency';
import { formatInr } from '@/lib/currency';

export function planPriceLabel(
  plan: (typeof PLATFORM_PLANS)[number],
  cycle: 'monthly' | 'yearly',
) {
  if (plan.monthlyPrice < 0) return 'Custom';
  if (plan.monthlyPrice === 0) return 'Free';
  const amount = cycle === 'yearly' ? plan.annualPrice / 12 : plan.monthlyPrice;
  return `${formatInr(Math.round(amount))}/mo`;
}
