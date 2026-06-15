import { MetadataRoute } from 'next';
import { BROKER_DIRECTORY } from '@/lib/broker/broker-directory';

const BASE_URL = 'https://profytron.com';

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const brokerRoutes: MetadataRoute.Sitemap = BROKER_DIRECTORY.filter(
    (b) => b.id !== 'PAPER',
  ).map((b) => ({
    url: `${BASE_URL}/brokers/${b.id.toLowerCase().replace(/_/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  let marketplaceRoutes: MetadataRoute.Sitemap = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/v1/marketplace?limit=200&page=1`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const listings: { strategyId?: string; id?: string; updatedAt?: string }[] =
        data?.data ?? data?.listings ?? [];

      marketplaceRoutes = listings
        .filter((l) => l.strategyId || l.id)
        .map((l) => ({
          url: `${BASE_URL}/marketplace/${l.strategyId ?? l.id}`,
          lastModified: l.updatedAt ? new Date(l.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
    }
  } catch {
    // Marketplace routes are optional — fail silently
  }

  return [...staticRoutes, ...brokerRoutes, ...marketplaceRoutes];
}
