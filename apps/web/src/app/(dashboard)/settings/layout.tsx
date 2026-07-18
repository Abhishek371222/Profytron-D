'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  User,
  Shield,
  ShieldCheck,
  Bell,
  Zap,
  CreditCard,
  MessageSquare,
} from '@/components/ui/icons';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardSubNav,
} from '@/components/dashboard/DashboardPrimitives';

const navItems = [
  { name: 'Profile', icon: User, href: '/settings/profile' },
  { name: 'Security', icon: Shield, href: '/settings/security' },
  { name: 'Verification', icon: ShieldCheck, href: '/settings/kyc' },
  { name: 'Notifications', icon: Bell, href: '/settings/notifications' },
  { name: 'Trading', icon: Zap, href: '/settings/trading' },
  { name: 'Billing', icon: CreditCard, href: '/settings/billing' },
  { name: 'Support', icon: MessageSquare, href: '/settings/support' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeItem = navItems.find(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/'),
  );
  const sectionTitle = activeItem?.name ?? 'Settings';
  const SectionIcon = activeItem?.icon ?? User;

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
          { label: sectionTitle },
        ]}
      />

      <DashboardPageHeader
        title={sectionTitle}
        description="Manage your identity, security, notifications, and account preferences."
        icon={SectionIcon}
        className="max-sm:[&_.dash-subtitle]:hidden"
      />

      <div className="dash-settings-layout">
        <div
          data-tour="settings-subnav"
          className="min-w-0 max-w-full overflow-hidden -mx-[var(--dashboard-p)] px-[var(--dashboard-p)] lg:mx-0 lg:px-0"
        >
          <DashboardSubNav items={navItems} pathname={pathname ?? ''} />
        </div>
        <div className="min-w-0 w-full max-w-full">{children}</div>
      </div>
    </DashboardPage>
  );
}
