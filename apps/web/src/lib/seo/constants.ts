/**
 * Canonical site origin. Must match the domain that actually serves the app —
 * per render.yaml, the bare apex (profytron.com) redirects to www and 404s on
 * every other path, so this defaults to www to keep canonical/OG/JSON-LD URLs
 * resolvable. Override via NEXT_PUBLIC_SITE_URL if the serving domain changes.
 */
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.profytron.com';

// Keep URL composition stable when an environment value includes a trailing
// slash (for example, avoid `https://www.profytron.com//pricing`).
export const SITE_URL = configuredSiteUrl.replace(/\/+$/, '');
export const SITE_NAME = 'Profytron';
export const SITE_TAGLINE = "India's algorithmic trading platform";
export const DEFAULT_OG_IMAGE = '/hero/hero-trading-3d.png';
export const DEFAULT_OG_IMAGE_ALT =
  'Profytron trading dashboard showing AI analytics, copy trading, and live portfolio performance';
export const TWITTER_HANDLE = '@profytron';
export const SUPPORT_EMAIL = 'support@profytron.com';
export const CONTACT_EMAIL = 'support@profytron.com';

export const DEFAULT_KEYWORDS = [
  'algorithmic trading India',
  'copy trading platform',
  'forex trading bots',
  'MT4 MT5 copy trading',
  'AI trading coach',
  'trading strategy marketplace',
  'automated trading India',
  'algo trading platform',
  'portfolio analytics',
  'prop trading platform',
] as const;
