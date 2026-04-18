'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      let {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Handle providers that return token/code in query/hash when session
      // is not auto-hydrated by the SDK.
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
        // Exchange Supabase session for local session
        // We send the Supabase token to our backend to sync/create the user
        const response = await apiClient.post('/auth/supabase', {
          token: session.access_token,
          email: session.user.email,
          fullName: session.user.user_metadata.full_name,
          avatarUrl: session.user.user_metadata.avatar_url,
          provider: session.user.app_metadata.provider,
        });
        const data = unwrapApiResponse<{ accessToken: string; user: any }>(response.data);

        login(data.accessToken, data.user);
        window.location.href = '/dashboard';
      } catch (e) {
        console.error('Backend synchronization failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        const isBackendUnavailable =
          message.includes('ECONNREFUSED') || message.includes('Network Error');

        router.push(
          isBackendUnavailable
            ? '/login?error=backend_unavailable'
            : '/login?error=sync_failed',
        );
      }
    };

    handleCallback();
  }, [login, router]);

  return (
    <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center noise">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="w-12 h-12 text-p animate-spin" />
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs">Synchronizing Identity...</p>
      </div>
    </div>
  );
}
