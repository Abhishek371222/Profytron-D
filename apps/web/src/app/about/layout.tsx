import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.about;
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

