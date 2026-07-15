'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';
import type { AxiosError } from 'axios';

const SYNC_MAX_ATTEMPTS = 4;
const SYNC_RETRY_DELAYS_MS = [0, 800, 2000, 4000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapSyncError(error: unknown): string {
  const axiosErr = error as AxiosError<{ code?: string }>;
  const status = axiosErr?.response?.status;
  const code = axiosErr?.response?.data?.code;
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'backend_unavailable';
  if (
    !axiosErr?.response &&
    (axiosErr?.code === 'ECONNABORTED' ||
      axiosErr?.code === 'ETIMEDOUT' ||
      axiosErr?.code === 'ERR_NETWORK' ||
      axiosErr?.message?.includes('timeout'))
  ) {
    return 'backend_unavailable';
  }
  if (code === 'SESSION_SUPERSEDED') return 'session_limit';
  if (status === 401) return 'sync_failed';
  return 'sync_failed';
}

async function syncFirebaseSession(payload: {
  token: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  provider: string;
}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < SYNC_MAX_ATTEMPTS; attempt += 1) {
    if (SYNC_RETRY_DELAYS_MS[attempt] > 0) {
      await sleep(SYNC_RETRY_DELAYS_MS[attempt]);
    }
    try {
      return await apiClient.post('/auth/firebase', payload, { timeout: 45_000 });
    } catch (error) {
      lastError = error;
      const axiosErr = error as AxiosError;
      const status = axiosErr?.response?.status;
      const timedOut =
        axiosErr?.code === 'ECONNABORTED' ||
        axiosErr?.code === 'ETIMEDOUT' ||
        axiosErr?.message?.includes('timeout');
      const retryable =
        timedOut ||
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        (!axiosErr?.response &&
          (axiosErr?.code === 'ERR_NETWORK' ||
            axiosErr?.code === 'ECONNREFUSED'));
      if (!retryable) {
        throw error;
      }
    }
  }
  throw lastError;
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const syncStartedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (syncStartedRef.current) return;
      syncStartedRef.current = true;

      // NestJS OAuth (Google/GitHub) returns a one-time code. Exchanging it here
      // (on this public route, proxied through our own origin) sets the
      // refresh_token cookie scoped to the frontend domain, so the middleware
      // lets the user into protected routes afterwards.
      const oauthCode = searchParams.get('oauthCode');
      if (oauthCode) {
        try {
          const exch = await apiClient.get(
            `/auth/oauth-token-exchange?code=${encodeURIComponent(oauthCode)}`,
          );
          const { accessToken } = unwrapApiResponse<{ accessToken: string }>(
            exch.data,
          );
          const meRes = await apiClient.get('/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const user = unwrapApiResponse<any>(meRes.data);
          login(accessToken, user);
          const redirectTo = searchParams.get('redirect') || '/dashboard';
          const dest = resolvePostLoginRedirect(user, redirectTo);
          useWorkspaceBootstrapStore.getState().startBootstrap(dest);
          router.replace(dest);
        } catch (e) {
          console.error('OAuth code exchange failed:', e);
          router.push('/login?error=oauth_failed');
        }
        return;
      }

      const providerError =
        searchParams.get('error') ||
        searchParams.get('error_description') ||
        new URL(window.location.href).searchParams.get('error_description');

      if (providerError) {
        console.error('OAuth provider error:', providerError);
        router.push('/login?error=auth_failed');
        return;
      }

      const auth = await getFirebaseAuth();
      if (!auth) {
        console.error('Firebase auth unavailable (missing env configuration)');
        router.push('/login?error=auth_failed');
        return;
      }

      const { getRedirectResult } = await import('firebase/auth');
      let result;
      try {
        result = await getRedirectResult(auth);
      } catch (redirectError) {
        console.error('Firebase redirect result failed:', redirectError);
        router.push('/login?error=auth_failed');
        return;
      }

      if (!result?.user) {
        console.error('Firebase session retrieval failed: no redirect result');
        router.push('/login?error=auth_failed');
        return;
      }

      const fbUser = result.user;

      try {
        const email = fbUser.email;
        if (!email) {
          console.error('Firebase session is missing an email address');
          router.push('/login?error=auth_failed');
          return;
        }

        const fullName = fbUser.displayName || email.split('@')[0] || 'User';
        const avatarUrl = fbUser.photoURL || undefined;
        const provider =
          fbUser.providerData[0]?.providerId?.replace('.com', '') || 'oauth';
        const idToken = await fbUser.getIdToken();

        const response = await syncFirebaseSession({
          token: idToken,
          email,
          fullName,
          avatarUrl,
          provider,
        });
        const data = unwrapApiResponse<
          | { accessToken: string; user: any }
          | { requiresTwoFa: true; challengeToken: string }
        >(response.data);

        if ('requiresTwoFa' in data && data.requiresTwoFa) {
          router.push(
            `/login?twoFaChallenge=${encodeURIComponent(data.challengeToken)}&redirect=${encodeURIComponent(searchParams.get('redirect') || '/dashboard')}`,
          );
          return;
        }

        const { accessToken, user } = data as {
          accessToken: string;
          user: any;
        };
        login(accessToken, user);
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        const dest = resolvePostLoginRedirect(user, redirectTo);
        useWorkspaceBootstrapStore.getState().startBootstrap(dest);
        router.replace(dest);
      } catch (e) {
        console.error('Backend synchronization failed:', e);
        router.push(`/login?error=${mapSyncError(e)}`);
      }
    };

    handleCallback();
  }, [login, router, searchParams]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="Signing in" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Signing you in…
        </p>
      </div>
    </div>
  );
}
