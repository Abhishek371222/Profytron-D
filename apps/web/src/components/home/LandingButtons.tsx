'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { MagneticWrap } from '@/components/animations';

export function LandingPrimaryLink({
  href,
  children,
  className,
  magnetic = true,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  magnetic?: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "btn-landing-primary exp-cta",
        className,
      )}
    >
      {children}
    </Link>
  );

  if (!magnetic) return link;

  return <MagneticWrap strength={0.2}>{link}</MagneticWrap>;
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
        'inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl',
        'border border-[var(--card-border)] bg-card/80 backdrop-blur-sm text-foreground font-semibold text-sm',
        'transition-all duration-200 ease-out whitespace-nowrap',
        'hover:bg-card hover:border-[color-mix(in_srgb,var(--primary)_30%,var(--card-border))]',
        'hover:-translate-y-px',
        'hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--primary)_12%,transparent)]',
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
