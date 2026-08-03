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
        sceneKey="heroTrading"
      />

      <MarketingSection className="pb-24">
        <div className="mb-10 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            How broker connections work on Profytron
          </h2>
          <p>
            Profytron links automated strategies and copy bots to your own brokerage account
            over MT4/MT5. You keep custody of funds at the broker; Profytron does not hold
            client money. Paper mode is available if you want to validate execution before
            going live.
          </p>
          <p>
            Pick a broker below for spreads, minimum deposit, and region notes, then create a
            free account and open Connected Accounts (or Bot Plans) to finish credential
            linking. Prefer support? See{' '}
            <Link href="/docs" className="font-medium text-primary hover:underline">
              docs
            </Link>
            ,{' '}
            <Link href="/help" className="font-medium text-primary hover:underline">
              help
            </Link>
            , or{' '}
            <Link href="/guides" className="font-medium text-primary hover:underline">
              trading guides
            </Link>
            .
          </p>
          <h2 className="pt-2 text-lg font-bold tracking-tight text-foreground">
            MT4 vs MT5 for automated forex bots
          </h2>
          <p>
            Most brokers on this list offer MetaTrader 5 (MT5) and many still support
            MetaTrader 4 (MT4). Profytron is built for live execution through your existing
            terminal login: when a strategy places a trade, signals route to the connected
            account with risk limits you set on the platform. Choose an ECN/RAW account if
            you care about tight spreads; choose an STP or beginner-friendly account if
            deposit size and education matter more.
          </p>
          <h2 className="pt-2 text-lg font-bold tracking-tight text-foreground">
            What to check before you connect
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-foreground">Server name</span> — exact MT
              server string from your broker portal (wrong server = failed login).
            </li>
            <li>
              <span className="font-medium text-foreground">Account type</span> — demo vs
              live; hedging vs netting if your strategy assumes it.
            </li>
            <li>
              <span className="font-medium text-foreground">Minimum deposit & region</span>{' '}
              — confirm you can fund and trade the instruments your bots need.
            </li>
            <li>
              <span className="font-medium text-foreground">Risk first</span> — start on
              paper or a small live size; enable stop limits in Profytron before scaling.
            </li>
          </ul>
          <h2 className="pt-2 text-lg font-bold tracking-tight text-foreground">
            From connection to first bot
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a free Profytron account and complete onboarding risk preferences.
            </li>
            <li>
              Open Connected Accounts (or Bot Plans) and choose a broker from this directory.
            </li>
            <li>
              Enter credentials once; tokens stay broker-side and encrypted for re-use.
            </li>
            <li>
              Deploy a marketplace bot or your own strategy and monitor from the dashboard.
            </li>
          </ol>
          <p>
            Looking for pricing? See{' '}
            <Link href="/pricing" className="font-medium text-primary hover:underline">
              plans and the 7-day free trial
            </Link>
            . Need a community second opinion? Join{' '}
            <Link href="/community" className="font-medium text-primary hover:underline">
              Discord
            </Link>
            .
          </p>
        </div>

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

        <div className="mt-10 rounded-xl border border-[var(--card-border)] bg-card p-6">
          <p className="text-sm font-semibold text-foreground">Related</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/pricing" className="text-primary hover:underline">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/get-bots" className="text-primary hover:underline">
                Get bots
              </Link>
            </li>
            <li>
              <Link href="/guides" className="text-primary hover:underline">
                Guides
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-primary hover:underline">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/docs" className="text-primary hover:underline">
                Docs
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-primary hover:underline">
                Start free trial
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-10">
          <Breadcrumbs items={[{ label: 'Brokers' }]} />
        </div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
