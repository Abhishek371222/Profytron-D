/** Authenticated application areas that must never appear in search results. */
export const PRIVATE_ROUTE_PREFIXES = [
  '/dashboard',
  '/strategies',
  '/marketplace',
  '/markets',
  '/analytics',
  '/alpha-coach',
  '/wallet',
  '/affiliate',
  '/creator',
  '/settings',
  '/admin',
  '/journal',
  '/history',
  '/leaderboard',
  '/bots',
  '/my-bots',
  '/notifications',
  '/get-bots',
  '/copy-trading',
  '/builder',
  '/social',
  '/support',
  '/vps',
  '/billing',
  '/subscriptions',
  '/team-plans',
  '/connected-accounts',
] as const;

/** Non-content flows and endpoints that crawlers do not need to visit. */
export const UTILITY_ROUTE_PREFIXES = [
  '/onboarding',
  '/auth',
  '/api',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
] as const;

export const ROBOTS_DISALLOW_PREFIXES = [
  ...PRIVATE_ROUTE_PREFIXES,
  ...UTILITY_ROUTE_PREFIXES,
] as const;

/** Pages that should also return an HTTP-level noindex directive. */
export const NOINDEX_ROUTE_PREFIXES = [
  ...ROBOTS_DISALLOW_PREFIXES,
  '/login',
] as const;
