import type { Metadata } from 'next';
import { privateAppMetadata } from '@/lib/seo/page-metadata';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata: Metadata = privateAppMetadata;

// Authenticated per-user shell — must never be statically optimized/cached.
// Without this, Next.js has no signal that this route is dynamic (all data
// fetching happens client-side), so it emits far-future-cacheable HTML that
// a CDN holds for up to a year, serving stale references to JS chunks a
// later deploy has already deleted.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
