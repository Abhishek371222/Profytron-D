import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.terms;
export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

