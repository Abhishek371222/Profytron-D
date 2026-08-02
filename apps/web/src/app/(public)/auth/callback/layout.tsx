import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Authentication',
  description: 'Completing Profytron sign-in.',
  path: '/auth/callback',
  noIndex: true,
});

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
