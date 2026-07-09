'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingCard,
} from '@/components/marketing/MarketingPage';
import { ArrowRight, Mail, CheckCircle } from 'lucide-react';

export default function CareersPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Careers"
        title="We're Building"
        titleAccent="The Team."
        description="Profytron is assembling an elite group of engineers, quants, and builders. Formal job listings are coming soon — get notified the moment we go live."
        meta={
          <span className="inline-flex items-center gap-2.5 rounded-full border border-chart-4/25 bg-chart-4/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-chart-4">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-chart-4"
            />
            Positions Opening Soon
          </span>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 w-full max-w-lg"
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative min-w-0 flex-1">
                <label htmlFor="careers-email" className="sr-only">
                  Email address
                </label>
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="careers-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="h-12 w-full rounded-xl border border-[var(--card-border)] bg-card py-0 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[color-mix(in_srgb,var(--primary)_35%,var(--card-border))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                />
              </div>
              <button
                type="submit"
                className="dash-btn-primary flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-6 sm:w-auto"
              >
                Notify Me <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex max-w-md items-center gap-3 rounded-xl border border-chart-3/25 bg-chart-3/10 px-6 py-3 text-sm font-medium text-chart-3"
            >
              <CheckCircle className="h-5 w-5" />
              You&apos;re on the list. We&apos;ll be in touch.
            </motion.div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            No spam. Unsubscribe at any time. Questions?{' '}
            <a href="mailto:support@profytron.com" className="font-medium text-primary hover:underline">
              support@profytron.com
            </a>
          </p>
        </motion.div>
      </MarketingHero>

      <MarketingSection narrow className="border-t border-[var(--card-border)] pb-20">
        <MarketingCard className="border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,transparent),color-mix(in_srgb,var(--brand-crimson)_5%,transparent))] p-10 text-center">
          <h2 className="brand-display-heading mb-3 text-2xl">Can&apos;t Wait?</h2>
          <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Send us your work now. Exceptional people don&apos;t wait for job postings.
          </p>
          <a
            href="mailto:support@profytron.com"
            className="inline-flex items-center gap-3 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all hover:bg-primary-hover"
          >
            <Mail className="h-4 w-4" /> support@profytron.com
          </a>
        </MarketingCard>
      </MarketingSection>
    </PublicPageLayout>
  );
}
