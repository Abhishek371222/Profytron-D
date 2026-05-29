import { clsx, type ClassValue } from"clsx"
import { twMerge } from"tailwind-merge"

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs))
}

/** Returns a safe same-origin redirect path; falls back to /dashboard for external or invalid URLs. */
export function safeRedirect(url: string | null | undefined): string {
  const fallback = '/dashboard';
  if (!url) return fallback;
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) return fallback;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}
