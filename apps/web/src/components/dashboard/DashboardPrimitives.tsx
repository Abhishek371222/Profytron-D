'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Standard dashboard page wrapper — same spacing on every tab */
export function DashboardPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('dash-page', className)}>{children}</div>;
}

export function DashboardBreadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="dash-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          {item.href ? (
            <Link href={item.href} className={i === items.length - 1 ? 'text-foreground' : 'hover:underline'}>
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground truncate max-w-[220px]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function DashboardPageHeader({
  title,
  description,
  icon: Icon,
  iconClassName,
  actions,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? (
          <div className={cn('dash-icon-box', iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="dash-title">{title}</h1>
          {description ? <p className="dash-subtitle mt-1">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div> : null}
    </div>
  );
}

export function DashButton({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'icon';
}) {
  return (
    <button
      type="button"
      className={cn(
        variant === 'primary' && 'dash-btn-primary',
        variant === 'outline' && 'dash-btn-outline',
        variant === 'ghost' && 'dash-btn-ghost',
        variant === 'icon' && 'dash-btn-icon',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DashFilterPill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('dash-filter-pill', active && 'dash-filter-pill-active', className)}
    >
      {children}
    </button>
  );
}

export function DashboardTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="dash-tabs">
      {tabs.map((tab) => (
        <DashFilterPill key={tab} active={active === tab} onClick={() => onChange(tab)}>
          {tab}
        </DashFilterPill>
      ))}
    </div>
  );
}

export function DashboardCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('dashboard-card', className)}>{children}</div>;
}

export function DashStatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('dashboard-card p-5 text-center', className)}>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="dash-eyebrow mt-1.5">{label}</p>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function DashEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('dash-eyebrow', className)}>{children}</p>;
}

export function DashSectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('dash-section-title', className)}>{children}</h2>;
}

/** Secondary nav — settings sub-pages, same visual language as main sidebar */
export function DashboardSubNav({
  items,
  pathname,
}: {
  pathname: string;
  items: { name: string; href: string; icon: React.ElementType }[];
}) {
  return (
    <nav className="space-y-0.5 w-full lg:w-56 shrink-0">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('dash-nav-link', isActive && 'dash-nav-link-active')}
          >
            <div className="flex items-center gap-2.5 w-full pl-3 pr-2">
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

/** Standard empty state block */
export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="dashboard-card py-16 px-6 text-center space-y-3">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted border border-[var(--card-border)]">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="dash-eyebrow">{title}</p>
      {description ? <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p> : null}
    </div>
  );
}
