import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.careers;
export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

