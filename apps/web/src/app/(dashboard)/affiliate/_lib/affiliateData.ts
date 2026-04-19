export type AffiliateDashboardData = {
  referralCode: string;
  tier: 'STARTER' | 'PRO' | 'ELITE';
  commissionRate: number;
  stats: {
    clicks: number;
    signups: number;
    conversions: number;
    conversionRate: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
  };
};

export type AffiliateLeader = {
  rank: number;
  name: string;
  handle: string;
  region: string;
  clicks: number;
  signups: number;
  conversions: number;
  earnings: number;
  growth: number;
  tier: 'STARTER' | 'PRO' | 'ELITE';
  color: string;
  note: string;
};

export const affiliateTierFilters = ['ALL', 'STARTER', 'PRO', 'ELITE'] as const;

export const affiliateRegionFilters = ['ALL', 'APAC', 'EU', 'US', 'LATAM', 'UK', 'MENA'] as const;

export const compactAffiliateWidget = {
  title: 'Affiliate pulse',
  subtitle: 'A quick read on your network and pending payout.',
};

export const demoAffiliateDashboard: AffiliateDashboardData = {
  referralCode: 'PROFYTRON-X7A9',
  tier: 'PRO',
  commissionRate: 0.35,
  stats: {
    clicks: 18420,
    signups: 1260,
    conversions: 312,
    conversionRate: 6.84,
    totalEarned: 8640.5,
    totalPaid: 4120.25,
    pendingPayout: 4520.25,
  },
};

export const affiliateLeaders: AffiliateLeader[] = [
  {
    rank: 1,
    name: 'Alex Quantum',
    handle: '@alexquant',
    region: 'APAC',
    clicks: 48210,
    signups: 3620,
    conversions: 782,
    earnings: 28420,
    growth: 18.4,
    tier: 'ELITE',
    color: 'from-emerald-400/35 via-cyan-400/20 to-transparent',
    note: 'Largest conversion tree and highest retention.',
  },
  {
    rank: 2,
    name: 'Sarah Markets',
    handle: '@sarahm',
    region: 'EU',
    clicks: 36120,
    signups: 2840,
    conversions: 630,
    earnings: 19680,
    growth: 15.1,
    tier: 'ELITE',
    color: 'from-indigo-400/35 via-violet-400/20 to-transparent',
    note: 'Balanced funnel with exceptional signup velocity.',
  },
  {
    rank: 3,
    name: 'Nina AI Trader',
    handle: '@ninaai',
    region: 'US',
    clicks: 30110,
    signups: 2210,
    conversions: 514,
    earnings: 15840,
    growth: 12.9,
    tier: 'PRO',
    color: 'from-amber-400/35 via-orange-400/20 to-transparent',
    note: 'Strong referral quality from product-led channels.',
  },
  {
    rank: 4,
    name: 'Marcus Volatility',
    handle: '@marcusvol',
    region: 'LATAM',
    clicks: 22400,
    signups: 1680,
    conversions: 401,
    earnings: 12490,
    growth: 11.2,
    tier: 'PRO',
    color: 'from-rose-400/35 via-pink-400/20 to-transparent',
    note: 'Strong short-form content and webinar conversion.',
  },
  {
    rank: 5,
    name: 'Emily Institutions',
    handle: '@emilyinst',
    region: 'UK',
    clicks: 18920,
    signups: 1450,
    conversions: 344,
    earnings: 10120,
    growth: 9.7,
    tier: 'PRO',
    color: 'from-sky-400/35 via-cyan-400/20 to-transparent',
    note: 'Enterprise referrals with high average order value.',
  },
  {
    rank: 6,
    name: 'David CryptoArb',
    handle: '@davidarb',
    region: 'MENA',
    clicks: 15620,
    signups: 1110,
    conversions: 266,
    earnings: 7820,
    growth: 8.1,
    tier: 'STARTER',
    color: 'from-teal-400/35 via-emerald-400/20 to-transparent',
    note: 'Emerging affiliate with fast network growth.',
  },
];

export const affiliateTreeNodes = [
  { label: 'You', value: 'Root node', tone: 'text-white' },
  { label: 'Warm leads', value: '42 active', tone: 'text-cyan-300' },
  { label: 'Qualified signups', value: '18 this week', tone: 'text-emerald-300' },
  { label: 'Paid conversions', value: '7 pending', tone: 'text-amber-300' },
  { label: 'Elite referrals', value: '3 strategic', tone: 'text-violet-300' },
];
