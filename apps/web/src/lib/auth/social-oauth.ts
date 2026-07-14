import { supabase } from '@/lib/supabase';

type SocialProvider = 'google' | 'github';
type SocialAuthContext = 'login' | 'register';

const DEAD_SUPABASE_HOSTS = new Set(['nghlhhsdtewrchdeyean.supabase.co']);

function getSupabaseHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getAnonKeyProjectRef(): string | null {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    '';
  const parts = key.split('.');
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const json = JSON.parse(atob(padded + pad)) as { ref?: string };
    return typeof json.ref === 'string' ? json.ref : null;
  } catch {
    return null;
  }
}

/**
 * True when Supabase social login cannot work (dead host, missing client, or
 * anon key belongs to a different project than NEXT_PUBLIC_SUPABASE_URL).
 */
function isSupabaseSocialBroken(): boolean {
  if (!supabase) return true;
  const host = getSupabaseHost();
  if (!host || DEAD_SUPABASE_HOSTS.has(host)) return true;
  const ref = getAnonKeyProjectRef();
  if (ref && host !== `${ref}.supabase.co`) return true;
  return false;
}

type OAuthPopupMessage = { source?: string; redirectTo?: string };

/**
 * Opens the OAuth flow in a popup instead of navigating the whole page away,
 * so a user who backs out just closes the popup and stays on the login page
 * (no more getting stranded on Google's account picker with nothing behind it).
 * The popup runs the normal redirect chain and, once it lands back on our own
 * origin at /auth/callback, posts the final destination back here and closes
 * itself; we then hard-navigate so the freshly-set session cookie is picked up.
 */
function openOAuthPopup(url: string) {
  if (typeof window === 'undefined') return;

  const width = 480;
  const height = 640;
  const left = window.screenX + Math.max((window.outerWidth - width) / 2, 0);
  const top = window.screenY + Math.max((window.outerHeight - height) / 2, 0);
  const popup = window.open(
    url,
    'profytron-oauth',
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  if (!popup) {
    // Popup blocked by the browser — fall back to the old full-page redirect.
    window.location.href = url;
    return;
  }

  const cleanup = () => {
    window.removeEventListener('message', handleMessage);
    window.clearInterval(pollClosed);
  };

  const handleMessage = (event: MessageEvent<OAuthPopupMessage>) => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.source !== 'profytron-oauth') return;
    cleanup();
    if (event.data.redirectTo) {
      window.location.href = event.data.redirectTo;
    }
  };
  window.addEventListener('message', handleMessage);

  const pollClosed = window.setInterval(() => {
    if (popup.closed) cleanup();
  }, 500);
}

/**
 * Social sign-in via Supabase Auth (Google/GitHub).
 * Google Client ID/Secret are configured in Supabase Dashboard → Authentication →
 * Providers → Google (not in web env). The API uses GOOGLE_CLIENT_ID/SECRET only
 * for the legacy NestJS /v1/auth/google route (used as local fallback).
 *
 * On localhost we always use NestJS Google OAuth so the post-login redirect stays
 * on http://localhost:3000 (Supabase Site URL is usually the production domain).
 */
export async function startSocialOAuth(
  provider: SocialProvider,
  context: SocialAuthContext = 'login',
) {
  const action = context === 'login' ? 'sign in' : 'sign up';
  const isLocalhost =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  // Local dev: Nest Google OAuth → FRONTEND_URL=localhost (never production).
  if (provider === 'google' && isLocalhost) {
    openOAuthPopup('/api/auth/google');
    return;
  }

  // Dead / mismatched Supabase project → NestJS Google OAuth (silent, no toast).
  if (provider === 'google' && isSupabaseSocialBroken()) {
    openOAuthPopup('/api/auth/google');
    return;
  }

  if (!supabase) {
    if (provider === 'google') {
      openOAuthPopup('/api/auth/google');
      return;
    }
    return;
  }

  if (!window.location.origin) {
    if (provider === 'google') {
      openOAuthPopup('/api/auth/google');
      return;
    }
    return;
  }

  const redirectUrl = `${window.location.origin}/auth/callback`;

  // Google runs through our own popup (skipBrowserRedirect); GitHub keeps the
  // SDK's normal top-level redirect since it isn't affected by this issue.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: provider === 'google',
      ...(provider === 'google'
        ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
        : {}),
    },
  });

  if (error) {
    if (provider === 'google') {
      openOAuthPopup('/api/auth/google');
      return;
    }
    console.error(`Unable to ${action} with ${provider}:`, error.message);
    return;
  }

  if (provider === 'google' && data?.url) {
    openOAuthPopup(data.url);
  }
}
