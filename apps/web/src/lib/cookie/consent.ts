/**
 * Analytics cookie consent (localStorage).
 * Strictly necessary session cookies are not controlled here.
 */

export type AnalyticsConsent = 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'profytron_analytics_consent';
/** Bump when policy text / categories change so users re-prompt. */
export const CONSENT_VERSION = 1;

export type ConsentRecord = {
  version: number;
  value: AnalyticsConsent;
  updatedAt: string;
};

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    if (raw === 'granted' || raw === 'denied') {
      // Legacy flat string — valid until policy version bumps.
      return raw;
    }

    const parsed = JSON.parse(raw) as ConsentRecord;
    if (
      parsed &&
      (parsed.value === 'granted' || parsed.value === 'denied') &&
      typeof parsed.version === 'number'
    ) {
      if (parsed.version < CONSENT_VERSION) return null;
      return parsed.value;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

export function setAnalyticsConsent(value: AnalyticsConsent): void {
  if (typeof window === 'undefined') return;
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    value,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* private mode / quota */
  }
  window.dispatchEvent(
    new CustomEvent('profytron:analytics-consent', { detail: value }),
  );
}

export function clearAnalyticsConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
