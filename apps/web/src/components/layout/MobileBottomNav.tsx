'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Server, ShoppingBag, Wallet, Trophy } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const bottomNavItems = [
  { name: 'Home', icon: LayoutDashboard, href: '/dashboard', tour: 'mobilenav-dashboard' },
  { name: 'Market', icon: ShoppingBag, href: '/marketplace', tour: 'mobilenav-marketplace' },
  { name: 'Bots', icon: Server, href: '/my-bots', tour: 'mobilenav-my-bots' },
  { name: 'Wallet', icon: Wallet, href: '/wallet', tour: 'mobilenav-wallet' },
  { name: 'Ranks', icon: Trophy, href: '/leaderboard', tour: 'mobilenav-leaderboard' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isBuilder = pathname?.includes('/strategies/builder');
  const isCoach = pathname?.includes('/alpha-coach');

  if (isBuilder || isCoach) return null;

  return (
    <nav aria-label="Quick navigation" className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
      <div className="pointer-events-none absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-[var(--sidebar)]/60 to-transparent" />

      <div className="relative">
        <div className="absolute inset-0 bg-[var(--sidebar)]/90 backdrop-blur-2xl border-t border-[var(--sidebar-border)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--primary)_35%,transparent)] to-transparent" />

        <div className="relative grid grid-cols-5 items-stretch h-[calc(4rem+env(safe-area-inset-bottom,0px))] min-h-16 pb-safe px-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tour}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-foreground/25 hover:text-foreground/50',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bar"
                    className="absolute top-0 inset-x-3 h-[2px] rounded-b-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                    style={{ boxShadow: '0 0 10px color-mix(in srgb, var(--primary) 55%, transparent)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}

                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bg"
                    className="absolute inset-x-0.5 inset-y-1 rounded-lg bg-primary/10 border border-primary/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}

                <div className="relative z-10 flex min-w-0 w-full flex-col items-center gap-0.5 overflow-hidden px-0.5">
                  <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform duration-200', isActive && 'scale-105')} />
                  <span
                    className={cn(
                      'w-full truncate text-center text-[10px] font-bold uppercase leading-none tracking-wide',
                      isActive ? 'text-primary' : 'text-foreground/20',
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
