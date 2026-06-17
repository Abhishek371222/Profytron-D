import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.guides;
export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

