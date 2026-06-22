'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Shield, Activity, Globe, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  { label: 'Overview', href: '/analytics', icon: LayoutDashboard },
  { label: 'Performance', href: '/analytics/performance', icon: BarChart2 },
  { label: 'Risk', href: '/analytics/risk', icon: Shield },
  { label: 'Trade', href: '/analytics/trade', icon: Activity },
  { label: 'Global', href: '/analytics/global', icon: Globe },
] as const;

export function AnalyticsSectionNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-[var(--card-border)] pb-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sections.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors',
              active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
