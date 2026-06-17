'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Rocket, Star, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PLATFORM_PLANS,
  formatInr,
} from '@/lib/pricing/plans';

type Props = {
  variant?: 'landing' | 'page';
  showEnterprise?: boolean;
};

const LANDING_SLUGS = ['starter', 'pro', 'business'] as const;

const landingMeta: Record<
  string,
  {
    icon: typeof Rocket;
    iconClass: string;
    iconBg: string;
    ctaClass: string;
    displayName?: string;
  }
> = {
  starter: {
    icon: Rocket,
    iconClass: 'text-violet-600',
    iconBg: 'bg-violet-500/10 border-violet-500/15',
    ctaClass:
      'bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 border border-violet-500/20',
  },
  pro: {
    icon: Star,
    iconClass: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    ctaClass: 'bg-primary text-primary-foreground hover:brightness-110 shadow-[var(--shadow-cta)]',
  },
  business: {
    icon: Building2,
    iconClass: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10 border-emerald-500/15',
    ctaClass:
      'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 border border-emerald-500/20',
    displayName: 'Enterprise',
  },
};

export function PricingPlansGrid({ variant = 'page', showEnterprise = true }: Props) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const displayPlans =
    variant === 'landing'
      ? PLATFORM_PLANS.filter((p) =>
          LANDING_SLUGS.includes(p.slug as (typeof LANDING_SLUGS)[number]),
        )
      : PLATFORM_PLANS.filter((p) => showEnterprise || p.slug !== 'enterprise');

  const toggle = (
    <div className="relative flex flex-col items-center mb-10 sm:mb-12">
      {variant === 'landing' && (
        <p className="text-xs font-semibold text-muted-foreground mb-3 hidden sm:block">
          <span className="inline-block border-b border-dashed border-muted-foreground/40 pb-0.5">
            ↳ Save up to 17%
          </span>
        </p>
      )}
      <div className="inline-flex rounded-full border border-[var(--card-border)] bg-card p-1 shadow-sm">
        {(['monthly', 'yearly'] as const).map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => setBillingCycle(cycle)}
            className={cn(
              'relative px-5 sm:px-6 py-2.5 rounded-full text-sm font-semibold capitalize transition-all',
              billingCycle === cycle
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {cycle}
            {cycle === 'yearly' && (
              <span
                className={cn(
                  'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                  billingCycle === 'yearly'
                    ? 'bg-emerald-500/20 text-emerald-100'
                    : 'bg-emerald-500/10 text-emerald-600',
                )}
              >
                2 months free
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (variant === 'page') {
    return (
      <div>
        {toggle}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {displayPlans.map((plan) => (
            <PricingCard
              key={plan.slug}
              plan={plan}
              billingCycle={billingCycle}
              variant="page"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {toggle}
      <div className="grid gap-6 md:grid-cols-3">
        {displayPlans.map((plan) => (
          <PricingCard
            key={plan.slug}
            plan={plan}
            billingCycle={billingCycle}
            variant="landing"
          />
        ))}
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  billingCycle,
  variant,
}: {
  plan: (typeof PLATFORM_PLANS)[number];
  billingCycle: 'monthly' | 'yearly';
  variant: 'landing' | 'page';
}) {
  const meta = landingMeta[plan.slug];
  const Icon = meta?.icon;
  const displayName = meta?.displayName ?? plan.name;
  const isPopular = plan.recommended;

  const monthlyEquivalent =
    billingCycle === 'yearly' && plan.annualPrice > 0
      ? Math.round(plan.annualPrice / 12)
      : plan.monthlyPrice;

  const annualNote =
    billingCycle === 'yearly' && plan.annualPrice > 0
      ? `${formatInr(plan.annualPrice)} billed annually`
      : billingCycle === 'monthly' && plan.monthlyPrice > 0
        ? 'Billed monthly'
        : null;

  const cardInner = (
    <>
      {isPopular && variant === 'landing' && (
        <span className="absolute top-4 right-4 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          Most Popular
        </span>
      )}

      {variant === 'landing' && Icon && (
        <div
          className={cn(
            'w-11 h-11 rounded-xl border flex items-center justify-center mb-5',
            meta.iconBg,
          )}
        >
          <Icon className={cn('w-5 h-5', meta.iconClass)} />
        </div>
      )}

      {!isPopular && variant === 'page' && plan.recommended && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
          Most Popular
        </span>
      )}

      <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
      <p className="mt-2 text-sm text-muted-foreground min-h-[2.5rem]">{plan.description}</p>

      <div className="mt-6 mb-1">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {plan.monthlyPrice < 0 ? 'Custom' : formatInr(monthlyEquivalent)}
        </span>
        {plan.monthlyPrice >= 0 && (
          <span className="text-lg font-semibold text-muted-foreground">/mo</span>
        )}
      </div>
      {annualNote && (
        <p className="text-sm text-muted-foreground mb-6">{annualNote}</p>
      )}
      {!annualNote && <div className="mb-6" />}

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.ctaHref.startsWith('mailto:') ? (
        <a
          href={plan.ctaHref}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center rounded-xl font-semibold text-sm transition-colors',
            variant === 'landing' && meta
              ? meta.ctaClass
              : 'bg-muted hover:bg-muted/80 text-foreground',
          )}
        >
          {plan.cta}
        </a>
      ) : (
        <Link
          href={`${plan.ctaHref}${plan.ctaHref.includes('?') ? '&' : '?'}billing=${billingCycle}`}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center rounded-xl font-semibold text-sm transition-colors',
            variant === 'landing' && meta
              ? meta.ctaClass
              : isPopular
                ? 'bg-primary text-primary-foreground hover:brightness-110'
                : 'bg-muted hover:bg-muted/80 text-foreground',
          )}
        >
          {plan.slug === 'business' && variant === 'landing' ? 'Start 7-Day Trial' : plan.cta}
        </Link>
      )}
    </>
  );

  if (variant === 'landing') {
    return (
      <article
        className={cn(
          'relative rounded-[24px] border bg-card p-6 sm:p-7 flex flex-col shadow-[0_10px_40px_rgba(15,23,42,0.06)]',
          isPopular
            ? 'border-primary ring-1 ring-primary/20'
            : 'border-[var(--card-border)]',
        )}
      >
        {cardInner}
      </article>
    );
  }

  return (
    <article
      className={cn(
        'rounded-2xl border p-6 flex flex-col',
        isPopular
          ? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10'
          : 'border-border bg-card',
      )}
    >
      {cardInner}
    </article>
  );
}
