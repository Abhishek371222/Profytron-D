'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

/** Primary landing CTA — gradient brand button with lift on hover */
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
        "btn-landing-primary",
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
        'border border-[var(--card-border)] bg-card/80 backdrop-blur-sm text-foreground font-semibold text-sm',
        'transition-all duration-200 ease-out whitespace-nowrap',
        'hover:bg-card hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))]',
        'hover:scale-[1.02] hover:-translate-y-px',
        'hover:shadow-[0_4px_16px_rgba(71,167,170,0.12)]',
        'active:scale-[0.98] active:translate-y-0',
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
