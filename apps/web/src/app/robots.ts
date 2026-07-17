import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/constants';
import { ROBOTS_DISALLOW_PREFIXES } from '@/lib/seo/private-routes';

export default function robots(): MetadataRoute.Robots {
  const disallow = [...ROBOTS_DISALLOW_PREFIXES];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/blog', '/docs', '/about', '/pricing', '/help', '/guides'],
        disallow,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/blog', '/docs', '/about', '/pricing'],
        disallow,
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/blog', '/docs', '/about', '/pricing'],
        disallow,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // `host` expects a bare hostname, not a full origin URL.
    host: new URL(SITE_URL).host,
  };
}
