import { getFirebaseAuth } from '@/lib/firebase/client';

type SocialProvider = 'google' | 'github';
type SocialAuthContext = 'login' | 'register';

/**
 * Social sign-in via Firebase Auth (Google/GitHub). Google/GitHub OAuth client
 * IDs are configured in Firebase Console → Authentication → Sign-in method
 * (not in web env). The API uses GOOGLE_CLIENT_ID/SECRET only for the legacy
 * NestJS /v1/auth/google route (used as local fallback).
 *
 * On localhost we always use NestJS Google OAuth so the post-login redirect stays
 * on http://localhost:3000 (Firebase's authorized redirect domains are usually
 * the production domain only).
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
    window.location.href = '/api/auth/google';
    return;
  }

  const auth = await getFirebaseAuth();
  if (!auth) {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
      return;
    }
    return;
  }

  try {
    const { GoogleAuthProvider, GithubAuthProvider, signInWithRedirect } =
      await import('firebase/auth');

    const authProvider =
      provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    if (provider === 'github') {
      authProvider.addScope('user:email');
    } else {
      authProvider.setCustomParameters({ prompt: 'consent' });
    }

    await signInWithRedirect(auth, authProvider);
  } catch (error) {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
      return;
    }
    console.error(`Unable to ${action} with ${provider}:`, error);
  }
}
