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
export const SITE_TAGLINE = 'Forex trading bots for MT4/MT5';
export const DEFAULT_OG_IMAGE = '/hero/hero-trading-3d.webp';
export const DEFAULT_OG_IMAGE_ALT =
  'Profytron forex trading dashboard with automated bots, live charts, and portfolio performance';
export const TWITTER_HANDLE = '@profytron';
export const SUPPORT_EMAIL = 'support@profytron.com';
export const CONTACT_EMAIL = 'support@profytron.com';
export const DISCORD_URL = 'https://discord.gg/profytron';
export const INSTAGRAM_URL = 'https://www.instagram.com/profytron/';
export const SOCIAL_SAME_AS = [DISCORD_URL, INSTAGRAM_URL] as const;

/** Public product positioning — clear, positive, reader-facing. */
export const PRODUCT_POSITIONING =
  'Profytron helps you run automated trading bots on the forex market via MT4 and MT5. Connect your broker, deploy strategies, set risk limits, and keep capital at your broker.';

export const DEFAULT_KEYWORDS = [
  'forex trading bots',
  'MT5 forex bots',
  'MT4 automated forex trading',
  'forex algorithmic trading',
  'automated forex trading platform',
  'forex EA bots',
  'algo forex trading bots',
  'MetaTrader 5 bots',
  'forex strategy marketplace',
  'AI forex trading bots',
] as const;
