'use client';

import Link from 'next/link';
import {
  MarketingHero,
  MarketingSection,
  MarketingGrid,
  MarketingCard,
} from '@/components/marketing/MarketingPage';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Link2 } from 'lucide-react';
import type { BrokerEntry } from '@/lib/broker/broker-directory';

export function BrokerSetupClient({ broker }: { broker: BrokerEntry }) {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Broker Setup Guide"
        eyebrowIcon={Link2}
        title={`Connect ${broker.displayName}`}
        titleAccent="to Profytron."
        description={broker.description}
      />

      <MarketingSection narrow>
        <MarketingGrid cols={2}>
          {[
            { label: 'Platform', value: broker.platform },
            { label: 'Min deposit', value: broker.minDeposit },
            { label: 'Execution', value: broker.execution },
            { label: 'Spreads', value: broker.spread },
          ].map((item) => (
            <MarketingCard key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 font-semibold text-foreground">{item.value}</dd>
            </MarketingCard>
          ))}
        </MarketingGrid>

        <MarketingCard className="mt-8">
          <h2 className="dash-section-title mb-4">Quick setup</h2>
          <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Create a Profytron account and complete onboarding</li>
            <li>Open Copy Trading → Connect Broker → select {broker.displayName}</li>
            <li>Enter your MT login, password, and server name</li>
            <li>Subscribe to a verified marketplace strategy</li>
            <li>Configure lot multiplier and risk limits — trades copy automatically</li>
          </ol>
          {broker.servers && broker.servers.length > 0 && (
            <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-muted/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Common server names
              </p>
              <ul className="space-y-1 font-mono text-sm text-primary">
                {broker.servers.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </MarketingCard>

        <div className="mt-10 flex flex-wrap gap-4 pb-20">
          <Link href="/register" className="dash-btn-primary inline-flex h-12 items-center px-6">
            Start 7-Day Free Trial
          </Link>
          <Link href="/copy-trading" className="dash-btn-outline inline-flex h-12 items-center px-6">
            Connect Broker
          </Link>
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
