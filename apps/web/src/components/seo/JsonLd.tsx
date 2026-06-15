export interface FaqItem {
  question: string;
  answer: string;
}

interface JsonLdProps {
  type: 'organization' | 'software' | 'faq' | 'breadcrumb';
  faqs?: FaqItem[];
  breadcrumbs?: { name: string; url: string }[];
}

const INR_PLANS = [
  { name: 'Free', price: '0' },
  { name: 'Starter', price: '3999' },
  { name: 'Pro', price: '11999' },
  { name: 'Business', price: '29999' },
];

export function JsonLd({ type, faqs, breadcrumbs }: JsonLdProps) {
  let schema: object;

  if (type === 'organization') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Profytron',
      url: 'https://profytron.com',
      logo: 'https://profytron.com/icons/icon-512.png',
      description:
        'Profytron is an institutional-grade algorithmic trading platform offering AI-powered coaching, copy trading, strategy marketplace, and real-time portfolio analytics for retail and professional traders.',
      foundingDate: '2024',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@profytron.com',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: [
        'https://twitter.com/profytron',
        'https://www.linkedin.com/company/profytron',
      ],
    };
  } else if (type === 'software') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Profytron',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: 'https://profytron.com',
      description:
        'Advanced algorithmic trading platform with AI coaching, copy trading, strategy marketplace, and real-time analytics. Supports MT4, MT5, and multiple brokers.',
      offers: INR_PLANS.map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        price: plan.price,
        priceCurrency: 'INR',
        priceValidUntil: '2026-12-31',
      })),
    };
  } else if (type === 'faq' && faqs?.length) {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  } else if (type === 'breadcrumb' && breadcrumbs?.length) {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url,
      })),
    };
  } else {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
