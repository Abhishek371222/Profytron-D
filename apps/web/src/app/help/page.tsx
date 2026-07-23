'use client';

import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingGrid,
  MarketingCard,
} from '@/components/marketing/MarketingPage';

const sections = [
  {
    title: 'Getting Started',
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Connect MT5 / Paper account', href: '/docs' },
      { label: 'Browse marketplace strategies', href: '/marketplace' },
    ],
  },
  {
    title: 'Billing & Wallet',
    links: [
      { label: 'Plans & pricing', href: '/pricing' },
      { label: 'Manage subscription', href: '/settings/billing' },
      { label: 'Fund wallet (UPI/Razorpay)', href: '/wallet' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FAQ on homepage', href: '/#faq' },
      { label: 'System status', href: '/status' },
      { label: 'Open support ticket', href: '/settings/support' },
      { label: 'Email support', href: 'mailto:support@profytron.com' },
    ],
  },
];

export default function HelpPage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Help Center"
        eyebrowIcon={HelpCircle}
        title="Quick Answers &"
        titleAccent="Resources."
        description="Quick answers and links for Profytron copy trading, billing, and broker setup."
      />

      <MarketingSection narrow className="pb-20">
        <MarketingGrid cols={3}>
          {sections.map((section) => (
            <MarketingCard key={section.title} hover className="h-full">
              <h2 className="dash-section-title mb-4 text-base">{section.title}</h2>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:opacity-100" />
                      <span className="group-hover:underline underline-offset-4">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </MarketingCard>
          ))}
        </MarketingGrid>
      </MarketingSection>
    </PublicPageLayout>
  );
}
