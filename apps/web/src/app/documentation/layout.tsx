import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Documentation',
  description: 'Profytron documentation.',
  path: '/documentation',
  noIndex: true,
});

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
