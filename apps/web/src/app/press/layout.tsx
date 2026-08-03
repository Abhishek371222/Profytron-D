import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Press',
  description:
    'Profytron press kit and media resources. For interviews, brand assets, and product announcements, contact the team via the contact page.',
  path: '/press',
  noIndex: true,
});

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
