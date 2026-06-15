'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

/** Primary landing CTA — solid, readable, no animated bleed-through */
export function LandingPrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[14px]',
        'bg-primary text-white font-semibold text-sm whitespace-nowrap',
        'shadow-[0_8px_24px_rgba(59,91,255,0.28)]',
        'hover:bg-[var(--primary-hover)] transition-colors',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function LandingSecondaryLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[14px]',
        'border border-[var(--card-border)] bg-card text-foreground font-semibold text-sm',
        'shadow-sm hover:bg-muted transition-colors whitespace-nowrap',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function LandingDashboardLink({ className }: { className?: string }) {
  return (
    <LandingPrimaryLink href="/dashboard" className={className}>
      Open Dashboard
      <ArrowRight className="w-4 h-4 shrink-0" />
    </LandingPrimaryLink>
  );
}
