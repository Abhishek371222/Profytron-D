import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.status;

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
