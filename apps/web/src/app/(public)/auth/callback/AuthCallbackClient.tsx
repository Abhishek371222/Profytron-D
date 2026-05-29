'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import { safeRedirect } from '@/lib/utils';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const providerError =
        searchParams.get('error') ||
        searchParams.get('error_description') ||
        new URL(window.location.href).searchParams.get('error_description');

      if (providerError) {
        console.error('OAuth provider error:', providerError);
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

      if (error || !session) {
        console.error('Supabase session retrieval failed:', error);
        router.push('/login?error=auth_failed');
        return;
      }

      try {
        const response = await apiClient.post('/auth/supabase', {
          token: session.access_token,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          provider: session.user.app_metadata?.provider,
        });
        const data = unwrapApiResponse<{ accessToken: string; user: any }>(
          response.data,
        );

        login(data.accessToken, data.user);
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        window.location.href = safeRedirect(redirectTo);
      } catch (e) {
        console.error('Backend synchronization failed:', e);
        router.push('/login?error=sync_failed');
      }
    };

    handleCallback();
  }, [login, router, searchParams]);

  return (
    <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center noise">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-12 h-12 text-p animate-spin" />
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs">
          Synchronizing Identity...
        </p>
      </div>
    </div>
  );
}
