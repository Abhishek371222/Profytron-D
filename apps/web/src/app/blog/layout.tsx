import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.blog;
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

