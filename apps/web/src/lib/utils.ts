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

export function isAdminUser(
  user: { role?: string } | null | undefined,
): boolean {
  const role = user?.role?.toUpperCase();
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** After login: admins → /admin; regular users → onboarding or requested path. */
export function resolvePostLoginRedirect(
  user: { onboardingCompleted?: boolean; role?: string } | null | undefined,
  redirectTo: string | null | undefined,
): string {
  const target = safeRedirect(redirectTo);
  const requested = redirectTo?.trim() || null;

  if (isAdminUser(user)) {
    if (!requested || target === '/dashboard') {
      return '/admin';
    }
    return target;
  }

  if (user?.onboardingCompleted || target.startsWith('/admin')) {
    return target;
  }
  return '/onboarding/risk';
}
