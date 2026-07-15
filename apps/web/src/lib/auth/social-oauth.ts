import { getFirebaseAuth } from '@/lib/firebase/client';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';
import { resolvePostLoginRedirect } from '@/lib/utils';
import type { User } from 'firebase/auth';

type SocialProvider = 'google' | 'github';
type SocialAuthContext = 'login' | 'register';

/** Exchanges a signed-in Firebase user for the app's own JWT session and navigates. */
async function completeFirebaseLogin(fbUser: User, redirectTarget: string) {
  const email = fbUser.email;
  if (!email) throw new Error('Firebase session is missing an email address');

  const fullName = fbUser.displayName || email.split('@')[0] || 'User';
  const avatarUrl = fbUser.photoURL || undefined;
  const provider = fbUser.providerData[0]?.providerId?.replace('.com', '') || 'oauth';
  const idToken = await fbUser.getIdToken();

  const response = await apiClient.post(
    '/auth/firebase',
    { token: idToken, email, fullName, avatarUrl, provider },
    { timeout: 45_000 },
  );
  const data = unwrapApiResponse<
    { accessToken: string; user: any } | { requiresTwoFa: true; challengeToken: string }
  >(response.data);

  if ('requiresTwoFa' in data && data.requiresTwoFa) {
    window.location.href = `/login?twoFaChallenge=${encodeURIComponent(data.challengeToken)}&redirect=${encodeURIComponent(redirectTarget)}`;
    return;
  }

  const { accessToken, user } = data as { accessToken: string; user: any };
  useAuthStore.getState().login(accessToken, user);
  const dest = resolvePostLoginRedirect(user, redirectTarget);
  useWorkspaceBootstrapStore.getState().startBootstrap(dest);
  window.location.href = dest;
}

/**
 * Social sign-in via Firebase Auth (Google/GitHub). Google/GitHub OAuth client
 * IDs are configured in Firebase Console → Authentication → Sign-in method
 * (not in web env). The API uses GOOGLE_CLIENT_ID/SECRET only for the legacy
 * NestJS /v1/auth/google route (used as local fallback).
 *
 * Google runs via a popup (signInWithPopup) so a user who backs out of the
 * account picker just closes the popup and stays on the login page, instead
 * of getting stranded mid-navigation. GitHub keeps the normal top-level
 * redirect (signInWithRedirect), matching prior behavior.
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

  const redirectTarget =
    new URLSearchParams(window.location.search).get('redirect') || '/dashboard';

  if (provider === 'google') {
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
      await import('firebase/auth');
    const authProvider = new GoogleAuthProvider();
    authProvider.setCustomParameters({ prompt: 'consent' });

    try {
      const result = await signInWithPopup(auth, authProvider);
      await completeFirebaseLogin(result.user, redirectTarget);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return; // user closed the popup — no error, no fallback
      }
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, authProvider);
        return;
      }
      console.error(`Unable to ${action} with google:`, err);
      window.location.href = '/api/auth/google';
    }
    return;
  }

  try {
    const { GithubAuthProvider, signInWithRedirect } = await import('firebase/auth');
    const authProvider = new GithubAuthProvider();
    authProvider.addScope('user:email');
    await signInWithRedirect(auth, authProvider);
  } catch (error) {
    console.error(`Unable to ${action} with github:`, error);
  }
}
