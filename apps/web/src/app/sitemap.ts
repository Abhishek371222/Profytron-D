import type { MetadataRoute } from 'next';
import { BROKER_DIRECTORY } from '@/lib/broker/broker-directory';
import { getAllBlogSlugs, getBlogPost } from '@/lib/blog/posts';
import { PUBLIC_SITEMAP_ROUTES, toSitemapEntries } from '@/lib/seo/sitemap-routes';
import { SITE_URL } from '@/lib/seo/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = toSitemapEntries(PUBLIC_SITEMAP_ROUTES);

  const blogRoutes: MetadataRoute.Sitemap = getAllBlogSlugs().map((slug) => {
    const post = getBlogPost(slug);
    return {
      url: `${SITE_URL}/blog/${slug}`,
      ...(post ? { lastModified: new Date(post.date) } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  const brokerRoutes: MetadataRoute.Sitemap = BROKER_DIRECTORY.filter(
    (b) => b.id !== 'PAPER',
  ).map((b) => ({
    url: `${SITE_URL}/brokers/${b.id.toLowerCase().replace(/_/g, '-')}`,
    changeFrequency: 'monthly' as const,
    priority: 0.55,
  }));

  return [...staticRoutes, ...blogRoutes, ...brokerRoutes];
}
