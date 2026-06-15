'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  User,
  Shield,
  Bell,
  Zap,
  CreditCard,
  Key,
  MessageSquare,
  Settings,
} from '@/components/ui/icons';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardSubNav,
  DashboardCard,
} from '@/components/dashboard/DashboardPrimitives';

const navItems = [
  { name: 'Profile', icon: User, href: '/settings/profile' },
  { name: 'Security', icon: Shield, href: '/settings/security' },
  { name: 'Notifications', icon: Bell, href: '/settings/notifications' },
  { name: 'Trading', icon: Zap, href: '/settings/trading' },
  { name: 'Billing', icon: CreditCard, href: '/settings/billing' },
  { name: 'API Keys', icon: Key, href: '/settings/api-keys' },
  { name: 'Support', icon: MessageSquare, href: '/settings/support' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardPage>
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />

      <DashboardPageHeader
        title="Settings"
        description="Manage your profile, security, billing, and platform preferences."
        icon={Settings}
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <DashboardSubNav items={navItems} pathname={pathname ?? ''} />
        <DashboardCard className="flex-1 w-full min-w-0 p-5 sm:p-6 lg:p-8">{children}</DashboardCard>
      </div>
    </DashboardPage>
  );
}
