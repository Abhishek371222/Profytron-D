import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PricingPlansGrid } from '@/components/pricing/PricingPlansGrid';
import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = pageSeo.pricing;

export default function PricingPage() {
  return (
    <PublicPageLayout>
      <JsonLd type="product" />
      <main className="min-h-screen text-foreground px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Simple pricing for every trader
          </h1>
          <p className="mt-3 text-foreground/60 max-w-2xl">
            Start free with paper trading. Upgrade when you are ready for live copy execution on MT5.
            All prices in INR · 7-day free trial on paid plans.
          </p>
          <section className="mt-12">
            <PricingPlansGrid variant="page" />
          </section>
        </div>
      </main>
    </PublicPageLayout>
  );
}
