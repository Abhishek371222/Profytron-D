'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function CommunityPage() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Community"
        title="We're Just"
        titleAccent="Getting Started."
        description="Profytron is brand new. The community is forming right now — which means you get to help shape it from day one. Join early, get direct access to the team, and influence how the platform evolves."
      />

      <MarketingSection>
        <MarketingGrid cols={2}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <MarketingCard className="flex h-full flex-col border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent)] opacity-90">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <span className="flex items-center gap-2 rounded-full border border-chart-4/20 bg-chart-4/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-chart-4">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-1 w-1 rounded-full bg-chart-4"
                  />
                  Coming Soon
                </span>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-xs font-mono text-primary/70">Profytron Community</div>
                <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground">Discord</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Our Discord server is being set up. Join the waitlist via email and we&apos;ll notify you the moment it launches.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsWaitlistOpen(true)}
                  className="inline-flex items-center gap-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_15%,transparent)] transition-all hover:bg-primary-hover"
                >
                  Join Waitlist
                </button>
                <a
                  href="https://discord.gg/profytron"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground underline"
                >
                  Open Discord
                </a>
              </div>
            </MarketingCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            viewport={{ once: true }}
          >
            <a
              href="https://www.instagram.com/profytron/"
              target="_blank"
              rel="noreferrer"
              className="group block h-full"
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
                  <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground">Instagram</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Behind-the-scenes of building Profytron — platform updates, trading content, and team moments.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--brand-crimson)] transition-all group-hover:gap-3">
                  Follow Us <ArrowRight className="h-4 w-4" />
                </div>
              </MarketingCard>
            </a>
          </motion.div>
        </MarketingGrid>
      </MarketingSection>

      <JoinWaitlistModal open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen} />

      <MarketingBand>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <h2 className="brand-display-heading mb-3 text-3xl">Why Join Early?</h2>
          <p className="text-sm text-muted-foreground">Being here at the start matters more than the number on the member counter.</p>
        </motion.div>

        <MarketingGrid>
          {[
            { title: 'Direct Team Access', desc: 'Early members get to talk directly with the founders and engineers — not a support bot.' },
            { title: 'Shape the Roadmap', desc: 'Your feedback on what to build next actually reaches the people building it.' },
            { title: 'Early Feature Access', desc: 'New features and beta programmes go to community members first, before public release.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <MarketingCard hover>
                <div className="mb-4 h-px w-6 bg-primary" />
                <h4 className="mb-2 text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </MarketingCard>
            </motion.div>
          ))}
        </MarketingGrid>
      </MarketingBand>

      <MarketingSection className="border-t border-[var(--card-border)] pb-20">
        <MarketingCard className="flex flex-col items-center justify-between gap-8 border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,transparent),color-mix(in_srgb,var(--brand-crimson)_5%,transparent))] p-10 md:flex-row">
          <div>
            <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Prefer email?</h3>
            <p className="max-w-xs text-sm text-muted-foreground">Reach the team directly. We read every message.</p>
          </div>
          <a
            href="mailto:support@profytron.com"
            className="inline-flex items-center gap-3 whitespace-nowrap rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all hover:bg-primary-hover"
          >
            <Mail className="h-4 w-4" /> support@profytron.com
          </a>
        </MarketingCard>
      </MarketingSection>
    </PublicPageLayout>
  );
}
