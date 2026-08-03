import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Documentation',
  description:
    'Profytron product documentation: getting started, brokers, bots, API, and troubleshooting. Use /docs for the live public docs hub.',
  path: '/documentation',
  noIndex: true,
});

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
