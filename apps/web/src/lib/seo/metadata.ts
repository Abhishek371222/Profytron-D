import type { Metadata } from 'next';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  TWITTER_HANDLE,
  DEFAULT_KEYWORDS,
} from './constants';

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
};

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = DEFAULT_OG_IMAGE_ALT,
  noIndex = false,
  type = 'website',
  publishedTime,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const alreadyBranded = title.includes(SITE_NAME);
  const fullTitle = alreadyBranded ? title : `${title} | ${SITE_NAME}`;
  const mergedKeywords = [...new Set([...keywords, ...DEFAULT_KEYWORDS])];

  return {
    // Skip the root "%s | Profytron" template when the title already brands itself
    // (home, broker pages, etc.) to avoid "Profytron … | Profytron".
    title: alreadyBranded ? { absolute: title } : title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      locale: 'en_IN',
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage),
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
      ...(type === 'article' && publishedTime
        ? { publishedTime, modifiedTime: publishedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage)],
    },
  };
}
