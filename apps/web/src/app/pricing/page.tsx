import Link from 'next/link';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { MarketingHero } from '@/components/marketing/MarketingPage';
import { PricingPlansGrid } from '@/components/pricing/PricingPlansGrid';
import { PricingFaq } from '@/components/pricing/PricingFaq';
import { PricingComparisonTable } from '@/components/pricing/PricingComparisonTable';
import { SectionRevealer } from '@/components/ui/SectionRevealer';
import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { PRICING_TRUST_ITEMS, PRICING_FAQ_ITEMS } from '@/lib/pricing/plans';

export const metadata: Metadata = pageSeo.pricing;

export default function PricingPage() {
  return (
    <PublicPageLayout transition="depthShift">
      <JsonLd type="product" />
      <JsonLd
        type="faq"
        faqs={PRICING_FAQ_ITEMS.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))}
      />

      <MarketingHero
        eyebrow="Pricing"
        title="Clear plans for every"
        titleAccent="stage of trading."
        description="Start free with paper trading. Upgrade when you are ready for live MT5 copy execution. All prices in INR · 7-day free trial on paid plans."
        sceneKey="pricingHero"
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#plans"
            className="inline-flex h-12 min-w-[10rem] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            Compare plans
          </Link>
          <Link
            href="/register?plan=pro&billing=yearly"
            className="inline-flex h-12 min-w-[10rem] items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            Start Pro trial
          </Link>
        </div>
      </MarketingHero>

      <SectionRevealer>
        <section className="page-container w-full pb-16 sm:pb-20 md:pb-24 text-foreground">
          <div id="plans" className="scroll-mt-24">
            <PricingPlansGrid variant="page" />
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {PRICING_TRUST_ITEMS.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                  aria-hidden
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Annual billing includes two months free versus monthly. Cancel anytime from Billing —
            access continues through the end of your paid period. Trading involves risk; past
            performance does not predict future results.
          </p>
        </section>
      </SectionRevealer>

      <SectionRevealer delay={0.06}>
        <section
          className="page-container w-full pb-16 sm:pb-20"
          aria-labelledby="pricing-compare-heading"
        >
          <div className="mb-8 max-w-2xl">
            <h2
              id="pricing-compare-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            >
              Compare features side by side
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Limits match what you get at signup. Need more bots or accounts later? Upgrade from
              Billing without losing your history.
            </p>
          </div>
          <PricingComparisonTable />
        </section>
      </SectionRevealer>

      <SectionRevealer delay={0.08}>
        <section
          className="page-container w-full pb-16 sm:pb-20"
          aria-labelledby="pricing-faq-heading"
        >
          <div className="mb-8 max-w-2xl">
            <h2
              id="pricing-faq-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
            >
              Billing questions, answered
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Short answers on trials, cancellations, annual savings, and Enterprise.
            </p>
          </div>
          <div className="max-w-3xl">
            <PricingFaq />
          </div>
        </section>
      </SectionRevealer>

      <SectionRevealer delay={0.1}>
        <section className="page-container w-full pb-20 sm:pb-24">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 md:flex-row shadow-sm">
            <div className="text-center md:text-left max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Need Enterprise deployment?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                White-label dashboards, colocation options, on-premise installs, and a dedicated
                solutions architect — scoped to your desk.
              </p>
            </div>
            <a
              href="mailto:support@profytron.com?subject=Enterprise%20inquiry"
              className="shrink-0 inline-flex h-12 min-w-[11rem] items-center justify-center px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition hover:brightness-110 shadow-[var(--shadow-cta)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            >
              Contact sales
            </a>
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold text-foreground">Related</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/brokers" className="text-primary hover:underline">
                  Supported brokers
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-primary hover:underline">
                  Help &amp; FAQs
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-primary hover:underline">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/get-bots" className="text-primary hover:underline">
                  Get bots
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary hover:underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </SectionRevealer>
    </PublicPageLayout>
  );
}
