import { LandingPageClient } from '@/components/home/LandingPageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQ_ITEMS } from '@/lib/seo/faq-items';
import type { Metadata } from 'next';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.home;

export default function LandingPage() {
  return (
    <>
      <JsonLd type="website" />
      <JsonLd type="howto" />
      <JsonLd type="faq" faqs={FAQ_ITEMS} />
      <LandingPageClient />
    </>
  );
}
