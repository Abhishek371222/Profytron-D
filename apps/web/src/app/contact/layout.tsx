import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.contact;
export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

