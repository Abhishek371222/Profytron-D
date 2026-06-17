import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.cookies;
export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

