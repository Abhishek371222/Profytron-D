import type { MetadataRoute } from 'next';
import { SITE_URL } from './constants';

export type SitemapEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

/** Public marketing & legal pages — indexable, no auth required */
export const PUBLIC_SITEMAP_ROUTES: SitemapEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/docs', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/help', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/guides', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/api-reference', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/community', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/careers', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/register', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.35 },
  { path: '/risk-disclosure', changeFrequency: 'yearly', priority: 0.45 },
];

export function toSitemapEntries(routes: SitemapEntry[]): MetadataRoute.Sitemap {
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
