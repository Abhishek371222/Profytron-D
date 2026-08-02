import { getFirebaseAuth } from '@/lib/firebase/client';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';
import { resolvePostLoginRedirect } from '@/lib/utils';
import type { User } from 'firebase/auth';

type SocialProvider = 'google' | 'github';
type SocialAuthContext = 'login' | 'register';

/**
 * Safari / iOS WebKit often block or break OAuth popups (ITP + popup policy).
 * Prefer full-page redirect there; Chrome/Edge/Firefox can keep popup UX.
 */
export function prefersOAuthRedirect(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  const isSafariDesktop =
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|Firefox|FxiOS|Android/i.test(ua);
  return isIOS || isSafariDesktop;
}

function startRedirectFlow(provider: SocialProvider, redirectTarget: string) {
  const params = new URLSearchParams({
    startProvider: provider,
    redirect: redirectTarget,
  });
  window.location.assign(`/auth/callback?${params.toString()}`);
}

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
    window.location.assign(
      `/login?twoFaChallenge=${encodeURIComponent(data.challengeToken)}&redirect=${encodeURIComponent(redirectTarget)}`,
    );
    return;
  }

  const { accessToken, user } = data as { accessToken: string; user: any };
  useAuthStore.getState().login(accessToken, user);
  const dest = resolvePostLoginRedirect(user, redirectTarget);
  useWorkspaceBootstrapStore.getState().startBootstrap(dest);
  window.location.assign(dest);
}

export async function startSocialOAuth(
  provider: SocialProvider,
  context: SocialAuthContext = 'login',
) {
  const action = context === 'login' ? 'sign in' : 'sign up';
  const isLocalhost =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  if (provider === 'google' && isLocalhost) {
    window.location.assign('/api/auth/google');
    return;
  }

  const auth = await getFirebaseAuth();
  if (!auth) {
    if (provider === 'google') {
      window.location.assign('/api/auth/google');
      return;
    }
    // GitHub requires Firebase; surface a clear oauth_failed query for the auth page.
    window.location.assign(
      `/${context === 'register' ? 'register' : 'login'}?error=oauth_failed`,
    );
    return;
  }

  const redirectTarget =
    new URLSearchParams(window.location.search).get('redirect') || '/dashboard';

  // Safari / iOS: skip popup entirely (ITP + blocked popups). GitHub always uses redirect.
  if (prefersOAuthRedirect() || provider === 'github') {
    startRedirectFlow(provider, redirectTarget);
    return;
  }

  if (provider === 'google') {
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const authProvider = new GoogleAuthProvider();
    authProvider.setCustomParameters({ prompt: 'consent' });

    try {
      const result = await signInWithPopup(auth, authProvider);
      await completeFirebaseLogin(result.user, redirectTarget);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        startRedirectFlow('google', redirectTarget);
        return;
      }
      console.error(`Unable to ${action} with google:`, err);
      window.location.assign('/api/auth/google');
    }
  }
}
