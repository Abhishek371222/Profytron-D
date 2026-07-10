import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

  // Dead / mismatched Supabase project → use NestJS Google OAuth so local login still works.
  if (provider === 'google' && isSupabaseSocialBroken()) {
    toast.message('Using direct Google sign-in', {
      description: 'Supabase project keys need updating. Falling back to Google OAuth.',
    });
    window.location.href = '/api/auth/google';
    return;
  }

  if (!supabase) {
    toast.error('Social login is not available right now', {
      description: 'Please use your email and password instead.',
    });
    return;
  }

  if (!window.location.origin) {
    toast.error('Unable to start social sign-in', {
      description: 'Could not determine redirect URL.',
    });
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
      toast.message('Retrying with direct Google sign-in');
      window.location.href = '/api/auth/google';
      return;
    }
    toast.error(`Unable to ${action} with ${provider}`, {
      description: error.message,
    });
  }
}
