'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingBand,
  MarketingGrid,
  MarketingCard,
} from '@/components/marketing/MarketingPage';
import { ArrowRight, Mail, MessageSquare } from 'lucide-react';
import JoinWaitlistModal from '@/components/community/JoinWaitlistModal';
import { DISCORD_URL, INSTAGRAM_URL, SUPPORT_EMAIL } from '@/lib/seo/constants';
import { trackEvent } from '@/lib/analytics/track';

const EXTERNAL_REL = 'noopener noreferrer';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const relatedLinks = [
  { href: '/help', label: 'Help', event: 'community_related_help_click' },
  { href: '/blog', label: 'Blog', event: 'community_related_blog_click' },
  { href: '/docs', label: 'Docs', event: 'community_related_docs_click' },
  { href: '/pricing', label: 'Pricing', event: 'community_related_pricing_click' },
  { href: '/register', label: 'Start free trial', event: 'community_related_register_click' },
] as const;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function CommunityPage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          transition: { delay },
          viewport: { once: true },
        };

  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Community"
        title="We're Just"
        titleAccent="Getting Started."
        description="Profytron is brand new. The community is forming right now — which means you get to help shape it from day one. Join early, get direct access to the team, and influence how the platform evolves."
        sceneKey="productCoach"
      />

      <MarketingSection>
        <MarketingGrid cols={2}>
          <motion.div {...fadeUp()}>
            <MarketingCard className="flex h-full flex-col border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent)] opacity-90">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <span className="flex items-center gap-2 rounded-full border border-chart-3/25 bg-chart-3/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-chart-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-chart-3" aria-hidden />
                  Live
                </span>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-xs font-mono text-primary/70">Profytron Community</div>
                <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">Discord</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Chat with traders and the team building India&apos;s algo trading platform. Announcements,
                  feedback, and early feature chatter.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel={EXTERNAL_REL}
                  aria-label="Join Profytron Discord (opens in a new tab)"
                  onClick={() => trackEvent('community_discord_click', { location: 'community_card' })}
                  className={`inline-flex min-h-[44px] items-center gap-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_15%,transparent)] transition-all hover:bg-primary-hover ${focusRing}`}
                >
                  Join Discord
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('community_waitlist_click', { location: 'community_card' });
                    setIsWaitlistOpen(true);
                  }}
                  className={`inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline ${focusRing} rounded-sm`}
                >
                  Email updates (optional)
                </button>
              </div>
            </MarketingCard>
          </motion.div>

          <motion.div {...fadeUp(0.12)}>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              aria-label="Follow Profytron on Instagram (opens in a new tab)"
              onClick={() => trackEvent('community_instagram_click', { location: 'community_card' })}
              className={`group block h-full rounded-2xl ${focusRing}`}
            >
              <MarketingCard
                hover
                className="flex h-full flex-col border-[color-mix(in_srgb,var(--brand-crimson)_20%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--brand-crimson)_12%,transparent),transparent)]"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--brand-crimson)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-crimson)_10%,transparent)]">
                    <InstagramIcon className="h-5 w-5 text-[var(--brand-crimson)]" />
                  </div>
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--brand-crimson)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-crimson)_10%,transparent)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-crimson)]">
                    Follow
                  </span>
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-xs font-mono text-[var(--brand-crimson)] opacity-80">@profytron</div>
                  <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">Instagram</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Behind-the-scenes of building Profytron — platform updates, trading content, and team moments.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--brand-crimson)] transition-all group-hover:gap-3">
                  Follow Us <ArrowRight className="h-4 w-4" aria-hidden />
                </div>
              </MarketingCard>
            </a>
          </motion.div>
        </MarketingGrid>
      </MarketingSection>

      <JoinWaitlistModal open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen} />

      <MarketingBand>
        <motion.div {...fadeUp()} className="mb-12">
          <h2 className="brand-display-heading mb-3 text-3xl">Why Join Early?</h2>
          <p className="text-sm text-muted-foreground">
            Being here at the start matters more than the number on the member counter.
          </p>
        </motion.div>

        <MarketingGrid>
          {[
            {
              title: 'Direct Team Access',
              desc: 'Early members get to talk directly with the founders and engineers — not a support bot.',
            },
            {
              title: 'Shape the Roadmap',
              desc: 'Your feedback on what to build next actually reaches the people building it.',
            },
            {
              title: 'Early Feature Access',
              desc: 'New features and beta programmes go to community members first, before public release.',
            },
          ].map((item, i) => (
            <motion.div key={item.title} {...fadeUp(reduceMotion ? 0 : i * 0.1)}>
              <MarketingCard hover>
                <div className="mb-4 h-px w-6 bg-primary" aria-hidden />
                <h3 className="mb-2 text-sm font-bold text-foreground">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </MarketingCard>
            </motion.div>
          ))}
        </MarketingGrid>
      </MarketingBand>

      <MarketingSection className="border-t border-[var(--card-border)] pb-20">
        <MarketingCard className="flex flex-col items-center justify-between gap-8 border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,transparent),color-mix(in_srgb,var(--brand-crimson)_5%,transparent))] p-10 md:flex-row">
          <div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Prefer email?</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Reach the team directly. We read every message.</p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            onClick={() => trackEvent('community_support_email_click', { location: 'community_footer_card' })}
            className={`inline-flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all hover:bg-primary-hover ${focusRing}`}
          >
            <Mail className="h-4 w-4" aria-hidden /> {SUPPORT_EMAIL}
          </a>
        </MarketingCard>
        <div className="mt-10">
          <p className="text-sm font-semibold text-foreground">Related</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {relatedLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => trackEvent(item.event, { location: 'community_related' })}
                  className={`text-primary hover:underline ${focusRing} rounded-sm`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
