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
 * Social sign-in via Supabase Auth (Google/GitHub).
 * Google Client ID/Secret are configured in Supabase Dashboard → Authentication →
 * Providers → Google (not in web env). The API uses GOOGLE_CLIENT_ID/SECRET only
 * for the legacy NestJS /v1/auth/google route (used as local fallback).
 */
export async function startSocialOAuth(
  provider: SocialProvider,
  context: SocialAuthContext = 'login',
) {
  const action = context === 'login' ? 'sign in' : 'sign up';

  // Dead / mismatched Supabase project → NestJS Google OAuth (silent, no toast).
  if (provider === 'google' && isSupabaseSocialBroken()) {
    window.location.href = '/api/auth/google';
    return;
  }

  if (!supabase) {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
      return;
    }
    return;
  }

  if (!window.location.origin) {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
      return;
    }
    return;
  }

  const redirectUrl = `${window.location.origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      ...(provider === 'google'
        ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
        : {}),
    },
  });

  if (error) {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
      return;
    }
    console.error(`Unable to ${action} with ${provider}:`, error.message);
  }
}
