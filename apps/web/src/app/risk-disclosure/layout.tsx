import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.riskDisclosure;
export default function RiskdisclosureLayout({ children }: { children: React.ReactNode }) {
  return children;
}

