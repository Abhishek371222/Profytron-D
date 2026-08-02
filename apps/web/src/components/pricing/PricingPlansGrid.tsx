'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Rocket, Star, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TiltCard3D } from '@/components/animations/TiltCard3D';
import { GlowPulse } from '@/components/animations/GlowPulse';
import {
  ANNUAL_SAVE_LABEL,
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
    iconClass: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/15',
    ctaClass:
      'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20',
  },
  pro: {
    icon: Star,
    iconClass: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    ctaClass: 'bg-primary text-primary-foreground hover:brightness-110 shadow-[var(--shadow-cta)]',
  },
  business: {
    icon: Building2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/15',
    ctaClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/20',
    displayName: 'Elite',
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
      <p className="text-xs font-semibold text-muted-foreground mb-3">
        <span className="inline-block border-b border-dashed border-muted-foreground/40 pb-0.5">
          ↳ {ANNUAL_SAVE_LABEL}
        </span>
      </p>
      <div
        role="radiogroup"
        aria-label="Billing cycle"
        className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-[var(--card-border)] bg-card p-1 shadow-sm"
      >
        {(['monthly', 'yearly'] as const).map((cycle) => (
          <button
            key={cycle}
            type="button"
            role="radio"
            aria-checked={billingCycle === cycle}
            onClick={() => setBillingCycle(cycle)}
            className={cn(
              'relative shrink-0 min-h-[44px] px-3.5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:px-5 md:px-6',
              billingCycle === cycle
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {cycle === 'yearly' ? 'Yearly' : 'Monthly'}
            {cycle === 'yearly' && (
              <span
                className={cn(
                  'ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:ml-2 sm:px-2',
                  billingCycle === 'yearly'
                    ? 'bg-emerald-500/20 text-emerald-50'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      {isPopular && (
        <span
          className={cn(
            'rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground',
            variant === 'landing' ? 'absolute top-4 right-4' : 'mb-3 inline-flex w-fit',
          )}
        >
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
          <Icon className={cn('w-5 h-5', meta.iconClass)} aria-hidden />
        </div>
      )}

      <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
      <p className="mt-2 text-sm text-muted-foreground min-h-[2.5rem]">{plan.description}</p>

      <div className="mt-6 mb-1">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {plan.monthlyPrice < 0 ? 'Custom' : formatInr(monthlyEquivalent)}
        </span>
        {plan.monthlyPrice > 0 && (
          <span className="text-lg font-semibold text-muted-foreground">/mo</span>
        )}
      </div>
      {annualNote && (
        <p className="text-sm text-muted-foreground mb-6">{annualNote}</p>
      )}
      {!annualNote && <div className="mb-6" />}

      {plan.previousPlanName && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Everything in {plan.previousPlanName}, plus:
        </p>
      )}

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
      {plan.ctaHref.startsWith('mailto:') ? (
        <a
          href={plan.ctaHref}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
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
            'inline-flex h-12 w-full items-center justify-center rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
            variant === 'landing' && meta
              ? meta.ctaClass
              : isPopular
                ? 'bg-primary text-primary-foreground hover:brightness-110'
                : 'bg-muted hover:bg-muted/80 text-foreground',
          )}
        >
          {plan.cta}
        </Link>
      )}
      </div>
    </>
  );

  if (variant === 'landing') {
    const card = (
      <article
        className={cn(
          'relative rounded-[24px] border bg-card p-6 sm:p-7 flex flex-col shadow-[0_10px_40px_rgba(15,23,42,0.06)] h-full',
          isPopular
            ? 'border-primary ring-1 ring-primary/20'
            : 'border-[var(--card-border)]',
        )}
      >
        {cardInner}
      </article>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <TiltCard3D intensity={isPopular ? 14 : 9} className="h-full">
          {isPopular ? (
            <GlowPulse
              color="color-mix(in srgb, var(--primary) 12%, transparent)"
              className="rounded-[24px] w-full h-full"
            >
              {card}
            </GlowPulse>
          ) : (
            card
          )}
        </TiltCard3D>
      </motion.div>
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
