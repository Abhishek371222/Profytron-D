'use client';

import Link from 'next/link';
import { Landmark, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingCard,
} from '@/components/marketing/MarketingPage';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { BROKER_DIRECTORY, BROKER_BRAND } from '@/lib/broker/broker-directory';
import { SITE_URL } from '@/lib/seo/constants';

export default function BrokersIndexPage() {
  const brokers = BROKER_DIRECTORY.filter((b) => b.id !== 'PAPER');

  return (
    <PublicPageLayout>
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: 'Home', url: SITE_URL },
          { name: 'Brokers', url: `${SITE_URL}/brokers` },
        ]}
      />

      <MarketingHero
        eyebrow="Broker Directory"
        eyebrowIcon={Landmark}
        title="Connect Your"
        titleAccent="Broker."
        description={`Profytron connects to ${brokers.length}+ MT4/MT5 brokers so your bots trade through the account you already trust. Compare spreads, minimum deposit, and execution type, or start free with paper trading.`}
      />

      <MarketingSection className="pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brokers.map((broker) => {
            const slug = broker.id.toLowerCase().replace(/_/g, '-');
            const brand = BROKER_BRAND[broker.id];
            return (
              <Link key={broker.id} href={`/brokers/${slug}`} className="group block h-full">
                <MarketingCard hover className="flex h-full flex-col">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-1 ${brand?.ring ?? ''} ${brand?.badgeBg ?? ''} ${brand?.text ?? ''}`}
                    >
                      {brand?.mark ?? broker.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h2 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {broker.displayName}
                      </h2>
                      <span className="text-xs font-mono text-muted-foreground">{broker.region}</span>
                    </div>
                  </div>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {broker.description}
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {broker.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--card-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-4 text-xs font-mono text-muted-foreground">
                    <span>{broker.platform} · {broker.spread}</span>
                    <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Connect <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </MarketingCard>
              </Link>
            );
          })}
        </div>

        <div className="mt-10">
          <Breadcrumbs items={[{ label: 'Brokers' }]} />
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
