import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.brokers;
export default function BrokersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
