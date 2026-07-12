'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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

function resolveOAuthEmail(
  user: NonNullable<
    Awaited<ReturnType<NonNullable<typeof supabase>['auth']['getSession']>>['data']['session']
  >['user'],
) {
  const metadata = user.user_metadata ?? {};
  return (
    user.email ||
    (typeof metadata.email === 'string' ? metadata.email : null) ||
    null
  );
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

async function syncSupabaseSession(payload: {
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
      return await apiClient.post('/auth/supabase', payload, { timeout: 45_000 });
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

      if (!supabase) {
        console.error('Supabase client unavailable (missing env configuration)');
        router.push('/login?error=auth_failed');
        return;
      }

      let {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!session) {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(
          `${url.search}${url.hash ? `&${url.hash.replace(/^#/, '')}` : ''}`,
        );

        const code = params.get('code');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (code) {
          const exchanged = await supabase.auth.exchangeCodeForSession(code);
          if (exchanged.error) {
            console.error('Supabase code exchange failed:', exchanged.error);
          }
        } else if (accessToken && refreshToken) {
          const restored = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (restored.error) {
            console.error('Supabase session restore failed:', restored.error);
          }
        }

        const retry = await supabase.auth.getSession();
        session = retry.data.session;
        error = retry.error;
      }

      if (error || !session?.access_token) {
        console.error('Supabase session retrieval failed:', error);
        router.push('/login?error=auth_failed');
        return;
      }

      try {
        const metadata = session.user.user_metadata ?? {};
        const email = resolveOAuthEmail(session.user);
        if (!email) {
          console.error('Supabase session is missing an email address');
          router.push('/login?error=auth_failed');
          return;
        }

        const fullName =
          metadata.full_name ||
          metadata.name ||
          email.split('@')[0] ||
          'User';
        const avatarUrl =
          metadata.avatar_url || metadata.picture || metadata.avatar;
        const provider =
          session.user.app_metadata?.provider ||
          session.user.identities?.[0]?.provider ||
          'oauth';

        const response = await syncSupabaseSession({
          token: session.access_token,
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
