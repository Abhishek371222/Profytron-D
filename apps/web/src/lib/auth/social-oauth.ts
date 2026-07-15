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

/**
 * localStorage keys used to hand the OAuth result back from the popup to the
 * opener. Read by AuthCallbackClient.tsx too — keep in sync.
 *
 * Why localStorage and not window.opener/postMessage or window.name/
 * BroadcastChannel: the popup's redirect chain hops across origins (ours ->
 * NestJS -> Google -> back), and this site sends
 * Cross-Origin-Opener-Policy: same-origin. Verified against the real chain
 * (not simulated): that header doesn't just sever window.opener on the first
 * cross-origin hop — it forces the popup into a genuinely new, unrelated
 * browsing context, which *also* resets window.name to "". Neither opener nor
 * name survive, so nothing tied to browsing-context identity can be trusted
 * as the "am I the popup" signal or as a delivery channel. localStorage is
 * pure origin-scoped storage with no ties to browsing-context identity at
 * all, so it comes through unaffected — confirmed empirically by driving a
 * real popup through an actual Google redirect and back.
 */
export const OAUTH_POPUP_PENDING_KEY = 'profytron-oauth-popup-pending';
export const OAUTH_POPUP_RESULT_KEY = 'profytron-oauth-popup-result';

/** Give up listening after this long if the popup never reports back
 * (abandoned flow, or the user closed it partway through). */
const OAUTH_POPUP_LISTEN_TIMEOUT_MS = 5 * 60 * 1000;

/** Parses a popup result payload and navigates the opener if it resolves to a destination. */
function applyPopupResult(raw: string) {
  try {
    window.localStorage.removeItem(OAUTH_POPUP_RESULT_KEY);
  } catch {
    /* ignore */
  }
  let data: { redirectTo?: string } | null = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (data?.redirectTo) {
    window.location.href = data.redirectTo;
  }
}

/**
 * Attaches the storage listener that catches the popup's result and navigates
 * the opener. Used both right after opening a popup, and to re-arm listening
 * on a fresh page load (see resumePendingOAuthPopup below).
 */
function armPopupResultListener() {
  const cleanup = () => {
    window.removeEventListener('storage', handleStorage);
    window.clearTimeout(giveUpTimer);
    try {
      window.localStorage.removeItem(OAUTH_POPUP_PENDING_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== OAUTH_POPUP_RESULT_KEY || !event.newValue) {
      return;
    }
    cleanup();
    applyPopupResult(event.newValue);
  };
  window.addEventListener('storage', handleStorage);

  const giveUpTimer = window.setTimeout(cleanup, OAUTH_POPUP_LISTEN_TIMEOUT_MS);
}

/**
 * Recovers a pending popup flow after a fresh page load (e.g. the opener tab
 * reloaded mid-flight — a dev-mode Fast Refresh reload is the common case,
 * since none of this survives a page reload: it's plain in-memory JS state).
 * Without this, a reload between "popup opened" and "popup finished" silently
 * drops the completion signal forever — the popup closes right on schedule,
 * but nothing is left listening on the opener side to act on it.
 *
 * Call once on app mount (outside /auth/callback, which is the popup's own
 * page and has nothing to recover into).
 */
export function resumePendingOAuthPopup() {
  if (typeof window === 'undefined') return;
  let pending: string | null = null;
  try {
    pending = window.localStorage.getItem(OAUTH_POPUP_PENDING_KEY);
  } catch {
    return;
  }
  if (!pending) return;

  let existingResult: string | null = null;
  try {
    existingResult = window.localStorage.getItem(OAUTH_POPUP_RESULT_KEY);
  } catch {
    /* ignore */
  }
  if (existingResult) {
    try {
      window.localStorage.removeItem(OAUTH_POPUP_PENDING_KEY);
    } catch {
      /* ignore */
    }
    applyPopupResult(existingResult);
    return;
  }

  // No result yet — the popup may still be working. Re-arm listening so its
  // eventual write is still caught by this (freshly loaded) page.
  armPopupResultListener();
}

/**
 * Opens the OAuth flow in a popup instead of navigating the whole page away,
 * so a user who backs out just closes the popup and stays on the login page
 * (no more getting stranded on Google's account picker with nothing behind it).
 *
 * Deliberately does NOT try to detect "the user closed the popup" via
 * popup.closed. Verified empirically: the moment the popup navigates
 * cross-origin (which it always does here, to Google), COOP forces it into
 * an isolated browsing context group, and the opener's popup.closed reads
 * true from that point on regardless of whether it's actually still open —
 * the opener can no longer observe it at all, so the browser reports it as
 * gone. Polling that would tear the listener down within moments of opening
 * the popup, long before the user could ever finish. A generous timeout is
 * the only reliable fallback.
 */
function openOAuthPopup(url: string) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(OAUTH_POPUP_PENDING_KEY, String(Date.now()));
  } catch {
    // Storage disabled (private mode etc.) — the popup just won't recognize
    // itself as a popup and will fall back to a normal top-level login in
    // that window, which the user can still close manually.
  }

  const width = 480;
  const height = 640;
  const left = window.screenX + Math.max((window.outerWidth - width) / 2, 0);
  const top = window.screenY + Math.max((window.outerHeight - height) / 2, 0);
  const popup = window.open(
    url,
    'profytron-oauth-popup',
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  if (!popup) {
    // Popup blocked by the browser — fall back to the old full-page redirect.
    window.location.href = url;
    return;
  }

  armPopupResultListener();
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
