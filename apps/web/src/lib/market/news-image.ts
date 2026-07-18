import type { MarketNewsItem } from '@/lib/api/market';

export function isUsableNewsImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  } catch {
    return false;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('/finnhub/logo')) return false;
  if (lower.includes('finnhub.io/logo')) return false;
  if (/[/_-]logo\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(lower)) return false;
  if (/\/static\/logo/i.test(lower)) return false;

  return true;
}

export function newsImageSrc(url: string): string {
  return `/api/market/news-image?url=${encodeURIComponent(url)}`;
}

export function newsWithImages(items: MarketNewsItem[]): MarketNewsItem[] {
  return items.filter((item) => isUsableNewsImageUrl(item.image));
}
