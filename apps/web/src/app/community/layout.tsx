import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.community;
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}

