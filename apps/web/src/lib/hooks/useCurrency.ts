'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyInfo,
  CURRENCY_MAP,
  DEFAULT_CURRENCY,
  formatPrice as _formatPrice,
} from '@/lib/currency';

const STORAGE_KEY = 'profytron_currency_v1';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedEntry {
  currency: CurrencyInfo;
  ts: number;
}

/** Parse a BCP-47 locale string (e.g. "en-IN", "pt-BR") into a CURRENCY_MAP country key. */
function countryFromLocale(locale: string): string | null {
  // navigator.language can be "en-IN", "en-GB", "pt-BR", etc.
  const parts = locale.split('-');
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase();
    if (region in CURRENCY_MAP) return region;
  }
  return null;
}

function readCache(): CurrencyInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return entry.currency;
  } catch {
    return null;
  }
}

function writeCache(currency: CurrencyInfo): void {
  try {
    const entry: CachedEntry = { currency, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / SSR errors
  }
}

export function useCurrency(): {
  currency: CurrencyInfo;
  isLoading: boolean;
  formatPrice: (usd: number) => string;
} {
  const [currency, setCurrency] = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Try cache first (instant)
    const cached = readCache();
    if (cached) {
      setCurrency(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function detect() {
      // 2. Try ipapi.co geolocation (free, no key)
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const countryCode: string = (data.country_code ?? '').toUpperCase();
          if (countryCode && countryCode in CURRENCY_MAP) {
            const detected = CURRENCY_MAP[countryCode];
            if (!cancelled) {
              writeCache(detected);
              setCurrency(detected);
            }
            return;
          }
        }
      } catch {
        // fall through to locale fallback
      }

      // 3. Fallback: parse navigator.language
      const locales = [
        navigator.language,
        ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      ];
      for (const loc of locales) {
        const country = countryFromLocale(loc);
        if (country) {
          const detected = CURRENCY_MAP[country];
          if (!cancelled) {
            writeCache(detected);
            setCurrency(detected);
          }
          return;
        }
      }

      // 4. Ultimate fallback: USD
      if (!cancelled) {
        writeCache(DEFAULT_CURRENCY);
        setCurrency(DEFAULT_CURRENCY);
      }
    }

    detect().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const formatPrice = useCallback(
    (usd: number) => _formatPrice(usd, currency),
    [currency],
  );

  return { currency, isLoading, formatPrice };
}
