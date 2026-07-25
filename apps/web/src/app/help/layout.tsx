import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQ_ITEMS } from '@/lib/seo/faq-items';
import { pageSeo } from '@/lib/seo/page-metadata';

export const metadata: Metadata = pageSeo.help;

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd type="faq" faqs={FAQ_ITEMS} />
      {children}
    </>
  );
}
