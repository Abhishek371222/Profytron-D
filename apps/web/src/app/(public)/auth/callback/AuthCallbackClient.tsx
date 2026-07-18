'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { resolvePostLoginRedirect } from '@/lib/utils';
import { cn } from '@/lib/utils';
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

/** Product Phase 2 — OAuth callback recovery (AUTH_REPORT / ERROR_GUIDE). */
export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const syncStartedRef = useRef(false);
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const handleCallback = async () => {
      if (syncStartedRef.current) return;
      syncStartedRef.current = true;
      setFailMessage(null);

      const fail = (message: string, loginQuery?: string) => {
        setFailMessage(message);
        if (loginQuery) {
          // Keep login as alternate path; in-page retry remains primary.
          void loginQuery;
        }
      };

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
          window.location.href = dest;
        } catch (e) {
          console.error('OAuth code exchange failed:', e);
          fail('Google/GitHub sign-in could not finish. Please try again.');
        }
        return;
      }

      const providerError =
        searchParams.get('error') ||
        searchParams.get('error_description') ||
        new URL(window.location.href).searchParams.get('error_description');

      if (providerError) {
        console.error('OAuth provider error:', providerError);
        const detail =
          searchParams.get('error_description') ||
          (providerError !== 'access_denied' ? providerError : null);
        fail(
          detail
            ? `Sign-in was cancelled or failed: ${String(detail).slice(0, 160)}`
            : 'Sign-in was cancelled or failed. Please try again.',
        );
        return;
      }

      const auth = await getFirebaseAuth();
      if (!auth) {
        console.error('Firebase auth unavailable (missing env configuration)');
        fail('Sign-in is temporarily unavailable. Return to login and try again.');
        return;
      }

      const { getRedirectResult } = await import('firebase/auth');
      let result;
      try {
        result = await getRedirectResult(auth);
      } catch (redirectError) {
        console.error('Firebase redirect result failed:', redirectError);
        fail('Sign-in could not finish. Please try again from login.');
        return;
      }

      if (!result?.user) {
        const startProvider = searchParams.get('startProvider');
        if (startProvider === 'google' || startProvider === 'github') {
          try {
            const { GoogleAuthProvider, GithubAuthProvider, signInWithRedirect } =
              await import('firebase/auth');
            if (startProvider === 'google') {
              const provider = new GoogleAuthProvider();
              provider.setCustomParameters({ prompt: 'consent' });
              await signInWithRedirect(auth, provider);
            } else {
              const provider = new GithubAuthProvider();
              provider.addScope('user:email');
              await signInWithRedirect(auth, provider);
            }
          } catch (startError) {
            console.error('Failed to start redirect sign-in:', startError);
            fail('Could not start social sign-in. Please try again.');
          }
          return;
        }

        console.error('Firebase session retrieval failed: no redirect result');
        fail('No sign-in session was found. Return to login and try again.');
        return;
      }

      const fbUser = result.user;

      try {
        const email = fbUser.email;
        if (!email) {
          console.error('Firebase session is missing an email address');
          fail('Your social account did not share an email. Use email sign-in or another provider.');
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
        window.location.href = dest;
      } catch (e) {
        console.error('Backend synchronization failed:', e);
        const code = mapSyncError(e);
        fail(
          code === 'rate_limited'
            ? 'Too many sign-in attempts. Wait a minute and try again.'
            : code === 'backend_unavailable'
              ? 'Service is temporarily unavailable. Please try again.'
              : 'Sign-in almost completed, but session setup failed. Please try again.',
        );
      }
    };

    handleCallback();
  }, [login, router, searchParams, retryKey]);

  if (failMessage) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-heading-4 font-semibold text-foreground">Sign-in interrupted</h1>
          <p className="text-sm text-muted-foreground">{failMessage}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              type="button"
              onClick={() => {
                syncStartedRef.current = false;
                setRetryKey((k) => k + 1);
              }}
            >
              Try again
            </Button>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
