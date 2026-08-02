import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Press',
  description: 'Profytron press resources.',
  path: '/press',
  noIndex: true,
});

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
