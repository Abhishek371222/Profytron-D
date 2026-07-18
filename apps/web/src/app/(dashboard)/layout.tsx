import type { Metadata } from 'next';
import { privateAppMetadata } from '@/lib/seo/page-metadata';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata: Metadata = privateAppMetadata;

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
