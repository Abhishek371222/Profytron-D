import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.login;
export default function LoginLayout({ children }: { children: React.ReactNode }) { return children; }

