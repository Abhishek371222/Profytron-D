'use client';

import React from 'react';
import Link from 'next/link';
import {
  Brain,
  FileBarChart2,
  Plus,
  Settings,
  Shield,
  Wallet,
} from 'lucide-react';

const ACTIONS = [
  { href: '/wallet', label: 'Deposit', icon: Wallet },
  { href: '#new-order', label: 'New order', icon: Plus, action: 'order' as const },
  { href: '/alpha-coach', label: 'Alpha Coach', icon: Brain },
  { href: '/analytics/risk', label: 'Risk limits', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: FileBarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

type Props = {
  onNewOrder?: () => void;
};

export function OverviewQuickActions({ onNewOrder }: Props) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 sm:grid-cols-6">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const className =
            'flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl border border-transparent px-2 py-3 text-center transition-colors hover:border-[var(--card-border)] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
          const inner = (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[11px] font-medium leading-tight text-foreground">
                {a.label}
              </span>
            </>
          );
          if (a.action === 'order') {
            return (
              <button
                key={a.label}
                type="button"
                onClick={onNewOrder}
                className={className}
              >
                {inner}
              </button>
            );
          }
          return (
            <Link key={a.label} href={a.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
