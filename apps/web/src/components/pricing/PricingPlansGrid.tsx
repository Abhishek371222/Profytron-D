'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PLATFORM_PLANS,
  formatInr,
  planPriceLabel,
} from '@/lib/pricing/plans';

type Props = {
  variant?: 'landing' | 'page';
  showEnterprise?: boolean;
};

export function PricingPlansGrid({ variant = 'page', showEnterprise = true }: Props) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = PLATFORM_PLANS.filter(
    (p) => showEnterprise || p.slug !== 'enterprise',
  ).filter((p) => variant === 'landing' ? p.slug !== 'free' && p.slug !== 'business' : true);

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-full border border-border bg-foreground/5 p-1">
          {(['monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors',
                billingCycle === cycle
                  ? 'bg-primary text-foreground'
                  : 'text-foreground/50 hover:text-foreground',
              )}
            >
              {cycle}
              {cycle === 'yearly' && (
                <span className="ml-1 text-chart-3 normal-case">· 2 mo free</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'grid gap-6',
          variant === 'landing' ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        )}
      >
        {plans.map((plan) => (
          <article
            key={plan.slug}
            className={cn(
              'rounded-2xl border p-6 flex flex-col',
              plan.recommended
                ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border bg-foreground/5',
            )}
          >
            {plan.recommended && (
              <span className="text-micro font-bold uppercase tracking-widest text-primary mb-2">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {planPriceLabel(plan, billingCycle)}
            </p>
            {billingCycle === 'yearly' && plan.annualPrice > 0 && (
              <p className="text-xs text-foreground/40 mt-1">
                {formatInr(plan.annualPrice)} billed annually
              </p>
            )}
            <p className="mt-3 text-sm text-foreground/60 flex-1">{plan.description}</p>
            <ul className="mt-5 space-y-2 mb-6">
              {plan.features.slice(0, 6).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground/70">
                  <Check className="h-4 w-4 text-chart-3 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.ctaHref.startsWith('mailto:') ? (
              <a
                href={plan.ctaHref}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg font-semibold bg-foreground/10 hover:bg-foreground/20 text-foreground transition"
              >
                {plan.cta}
              </a>
            ) : (
              <Link
                href={`${plan.ctaHref}${plan.ctaHref.includes('?') ? '&' : '?'}billing=${billingCycle}`}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-lg font-semibold transition',
                  plan.recommended
                    ? 'bg-primary hover:bg-primary text-foreground'
                    : 'bg-foreground/10 hover:bg-foreground/20 text-foreground',
                )}
              >
                {plan.cta}
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
