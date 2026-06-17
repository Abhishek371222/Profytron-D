import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.docs;
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

