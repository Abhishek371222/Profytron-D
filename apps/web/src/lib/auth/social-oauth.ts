import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type SocialProvider = 'google' | 'github';
type SocialAuthContext = 'login' | 'register';

/**
 * Social sign-in via Supabase Auth (Google/GitHub).
 * Google Client ID/Secret are configured in Supabase Dashboard → Authentication →
 * Providers → Google (not in web env). The API uses GOOGLE_CLIENT_ID/SECRET only
 * for the legacy NestJS /v1/auth/google route.
 */
export async function startSocialOAuth(
  provider: SocialProvider,
  context: SocialAuthContext = 'login',
) {
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
  const action = context === 'login' ? 'sign in' : 'sign up';

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
    toast.error(`Unable to ${action} with ${provider}`, {
      description: error.message,
    });
  }
}
