import type { MetadataRoute } from 'next';
import { BROKER_DIRECTORY } from '@/lib/broker/broker-directory';
import { getAllBlogSlugs } from '@/lib/blog/posts';
import { PUBLIC_SITEMAP_ROUTES, toSitemapEntries } from '@/lib/seo/sitemap-routes';
import { SITE_URL } from '@/lib/seo/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = toSitemapEntries(PUBLIC_SITEMAP_ROUTES);

  const blogRoutes: MetadataRoute.Sitemap = getAllBlogSlugs().map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const brokerRoutes: MetadataRoute.Sitemap = BROKER_DIRECTORY.filter(
    (b) => b.id !== 'PAPER',
  ).map((b) => ({
    url: `${SITE_URL}/brokers/${b.id.toLowerCase().replace(/_/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.55,
  }));

  return [...staticRoutes, ...blogRoutes, ...brokerRoutes];
}
