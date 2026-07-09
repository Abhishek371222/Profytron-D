'use client';

import Link from 'next/link';
import { Mail, MessageSquare, Building2, Headphones, MapPin } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingGrid,
  MarketingCard,
  MarketingSection,
} from '@/components/marketing/MarketingPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CONTACT_EMAIL, SUPPORT_EMAIL, SITE_URL } from '@/lib/seo/constants';

const CONTACT_CHANNELS = [
  {
    icon: Headphones,
    title: 'Customer Support',
    description: 'Billing, account access, broker connections, and platform help.',
    email: SUPPORT_EMAIL,
    cta: 'Email Support',
  },
  {
    icon: Building2,
    title: 'Enterprise & Sales',
    description: 'Prop desks, institutions, white-label, and custom SLAs.',
    email: SUPPORT_EMAIL,
    cta: 'Contact Sales',
  },
  {
    icon: MessageSquare,
    title: 'Community',
    description: 'Join traders and strategy creators on Discord.',
    href: 'https://discord.gg/profytron',
    cta: 'Join Discord',
  },
] as const;

export default function ContactPage() {
  return (
    <PublicPageLayout>
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: SITE_URL },
          { name: 'Contact', url: `${SITE_URL}/contact` },
        ]}
      />

      <MarketingHero
        eyebrow="Contact"
        eyebrowIcon={Mail}
        title="We're here to help you"
        titleAccent="trade smarter."
        description="Reach our support team for product help, or talk to sales about enterprise and institutional deployments. We respond within 24 hours on business days."
      />

      <MarketingSection>
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Contact' }]} />
        </div>
        <MarketingGrid cols={3}>
          {CONTACT_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const href = 'email' in channel ? `mailto:${channel.email}` : channel.href;
            return (
              <MarketingCard key={channel.title} hover>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <h2 className="dash-section-title mb-2">{channel.title}</h2>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {channel.cta}
                </a>
              </MarketingCard>
            );
          })}
        </MarketingGrid>

        <MarketingCard className="mt-8 p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden />
                <span className="text-sm font-medium">Headquarters</span>
              </div>
              <p className="font-semibold text-foreground">Profytron Technologies</p>
              <p className="mt-1 text-sm text-muted-foreground">Bangalore, India · Remote-first team</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                {CONTACT_EMAIL}
              </a>
              <Link
                href="/docs"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--card-border)] bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-muted/50"
              >
                Documentation
              </Link>
            </div>
          </div>
        </MarketingCard>
      </MarketingSection>
    </PublicPageLayout>
  );
}
