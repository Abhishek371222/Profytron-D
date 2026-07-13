export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  readTime?: string;
}

interface JsonLdProps {
  type:
    | 'organization'
    | 'software'
    | 'faq'
    | 'breadcrumb'
    | 'website'
    | 'howto'
    | 'article'
    | 'product';
  faqs?: FaqItem[];
  breadcrumbs?: BreadcrumbItem[];
  article?: ArticleSchemaInput;
}

const SITE_URL = 'https://profytron.com';

const INR_PLANS = [
  { name: 'Starter', price: '799', url: `${SITE_URL}/pricing` },
  { name: 'Pro', price: '999', url: `${SITE_URL}/pricing` },
  { name: 'Business', price: '1299', url: `${SITE_URL}/pricing` },
];

function buildSchema(props: JsonLdProps): object | null {
  const { type, faqs, breadcrumbs, article } = props;

  switch (type) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Profytron',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/brand-lockup.png`,
          width: 640,
          height: 160,
        },
        image: `${SITE_URL}/hero/hero-trading-3d.png`,
        description:
          'Institutional-grade algorithmic trading platform with AI coaching, copy trading, strategy marketplace, and real-time analytics for Indian traders.',
        foundingDate: '2024',
        areaServed: { '@type': 'Country', name: 'India' },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@profytron.com',
            availableLanguage: ['English', 'Hindi'],
            url: `${SITE_URL}/contact`,
          },
          {
            '@type': 'ContactPoint',
            contactType: 'sales',
            email: 'support@profytron.com',
            url: `${SITE_URL}/contact`,
          },
        ],
        sameAs: [
          'https://twitter.com/profytron',
          'https://www.linkedin.com/company/profytron',
        ],
      };

    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Profytron',
        url: SITE_URL,
        description:
          'Algorithmic trading platform for Indian traders — copy trading, AI coach, strategy marketplace.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/help?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };

    case 'software':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: 'Profytron',
        applicationCategory: 'FinanceApplication',
        applicationSubCategory: 'TradingPlatform',
        operatingSystem: 'Web, iOS, Android',
        url: SITE_URL,
        offers: INR_PLANS.map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          price: plan.price,
          priceCurrency: 'INR',
          priceValidUntil: '2026-12-31',
          url: plan.url,
          availability: 'https://schema.org/InStock',
        })),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '512',
          bestRating: '5',
        },
        featureList: [
          'Automated Trading Bots',
          'Alpha Coach',
          'Strategy Marketplace',
          'MT4/MT5 Integration',
          'Paper Trading',
          'Portfolio Analytics',
        ],
      };

    case 'product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Profytron Trading Platform',
        description:
          'SaaS algorithmic trading platform with copy trading, AI risk management, and strategy marketplace.',
        brand: { '@type': 'Brand', name: 'Profytron' },
        offers: INR_PLANS.map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          price: plan.price,
          priceCurrency: 'INR',
          url: plan.url,
        })),
      };

    case 'faq':
      if (!faqs?.length) return null;
      return {
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

    case 'howto':
      return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to start algorithmic trading on Profytron',
        description:
          'Sign up, connect your broker or use paper trading, browse the strategy marketplace, and start copy trading in minutes.',
        totalTime: 'PT10M',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Create your account',
            text: 'Sign up free at profytron.com with email or Google. No credit card required.',
            url: `${SITE_URL}/register`,
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Connect MT5 or use paper trading',
            text: 'Link your MetaTrader 5 account or start with a built-in paper trading account.',
            url: `${SITE_URL}/docs`,
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Subscribe to a verified strategy',
            text: 'Browse the marketplace, review live track records, and subscribe to copy trades automatically.',
            url: `${SITE_URL}/pricing`,
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Set risk limits and monitor',
            text: 'Configure drawdown limits, lot multipliers, and monitor performance from your dashboard.',
            url: `${SITE_URL}/docs`,
          },
        ],
      };

    case 'breadcrumb':
      if (!breadcrumbs?.length) return null;
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: item.url,
        })),
      };

    case 'article':
      if (!article) return null;
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.datePublished,
        dateModified: article.datePublished,
        author: {
          '@type': 'Organization',
          name: 'Profytron',
          url: SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Profytron',
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/brand-lockup.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog/${article.slug}`,
        },
        image: `${SITE_URL}/hero/hero-trading-3d.png`,
        timeRequired: article.readTime,
      };

    default:
      return null;
  }
}

export function JsonLd(props: JsonLdProps) {
  const schema = buildSchema(props);
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
