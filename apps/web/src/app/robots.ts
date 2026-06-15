import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/onboarding/', '/auth/'],
      },
    ],
    sitemap: 'https://profytron.com/sitemap.xml',
    host: 'https://profytron.com',
  };
}
