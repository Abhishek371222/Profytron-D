import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.apiReference;
export default function ApireferenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}

