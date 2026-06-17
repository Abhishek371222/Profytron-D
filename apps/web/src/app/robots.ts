import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/constants';

const PRIVATE_PREFIXES = [
  '/dashboard',
  '/strategies',
  '/marketplace',
  '/analytics',
  '/ai-coach',
  '/wallet',
  '/affiliate',
  '/settings',
  '/admin',
  '/journal',
  '/history',
  '/leaderboard',
  '/bots',
  '/notifications',
  '/copy-trading',
  '/builder',
  '/social',
  '/support',
  '/vps',
  '/onboarding',
  '/auth',
  '/api',
  '/oauth-test',
  '/oauth-diagnostics',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PREFIXES,
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/blog', '/docs', '/about', '/pricing', '/help', '/guides'],
        disallow: PRIVATE_PREFIXES,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/blog', '/docs', '/about', '/pricing'],
        disallow: PRIVATE_PREFIXES,
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/blog', '/docs', '/about', '/pricing'],
        disallow: PRIVATE_PREFIXES,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: PRIVATE_PREFIXES,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: PRIVATE_PREFIXES,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
