'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
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
  titleAccent,
  description,
  icon: Icon,
  iconClassName,
  actions,
}: {
  title: string;
  titleAccent?: string;
  description?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? (
          <div className={cn('dash-icon-box shadow-[0_4px_16px_rgba(0,0,0,0.06)]', iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="dash-title">
            {title}
            {titleAccent ? (
              <>
                {' '}
                <span className="brand-gradient-text">{titleAccent}</span>
              </>
            ) : null}
          </h1>
          {description ? <p className="dash-subtitle mt-1">{description}</p> : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:flex-wrap sm:shrink-0">
          {actions}
        </div>
      ) : null}
    </motion.div>
  );
}

/** Shared "failed to load" state with a retry action — use whenever a query's isError is true. */
export function DashErrorState({
  message = "Couldn't load this data.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-destructive/20 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="dash-btn-outline mt-1 inline-flex items-center gap-2"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
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
  icon: Icon,
  trend,
  trendUp,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={cn(
        'dashboard-card kpi-card relative overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]',
        className,
      )}
    >
      {/* Subtle top-left teal glow */}
      <div className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] blur-2xl" />

      <div className="relative flex items-start justify-between gap-2 mb-3">
        <p className="dash-eyebrow text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex-shrink-0 w-8 h-8 rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--primary)_12%,transparent)] flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      <p className="relative text-2xl font-bold text-foreground tabular-nums tracking-tight leading-none mb-2 animate-slot-up">
        {value}
      </p>

      <div className="flex items-center gap-2">
        {trend && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
            trendUp
              ? "bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]"
              : "bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] text-[var(--destructive)]",
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </motion.div>
  );
}

export function DashEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('dash-eyebrow', className)}>{children}</p>;
}

export function DashSectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('dash-section-title', className)}>{children}</h2>;
}

export function DashMetricTile({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('dashboard-card p-4', className)}>
      <p className="dash-eyebrow text-[11px]">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
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
    <nav className="dash-subnav-horizontal md:space-y-0.5 w-full md:w-56 shrink-0">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'dash-nav-link shrink-0 md:shrink',
              isActive && 'dash-nav-link-active',
            )}
          >
            <div className="flex items-center gap-2.5 w-full pl-3 pr-3 md:pr-2 whitespace-nowrap md:whitespace-normal">
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
