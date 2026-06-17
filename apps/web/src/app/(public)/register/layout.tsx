import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.register;
export default function RegisterLayout({ children }: { children: React.ReactNode }) { return children; }

