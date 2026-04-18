'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { apiClient } from '@/lib/api/client';
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
        
        // Extract profile data from Google OAuth metadata
        // Google provides data in user_metadata with various field names
        const metadata = session.user.user_metadata || {};
        
        // Try multiple sources for profile fields
        // Google OAuth returns: full_name, name, given_name, family_name, picture, avatar_url
        const fullName = 
          metadata.full_name ||
          metadata.name ||
          (metadata.given_name && metadata.family_name 
            ? `${metadata.given_name} ${metadata.family_name}`
            : metadata.given_name) ||
          (session.user.email ? session.user.email.split('@')[0] : null) || // fallback to email prefix
          'User';

        const avatarUrl = 
          metadata.avatar_url ||
          metadata.picture ||
          null;

        const provider = session.user.app_metadata?.provider || 'unknown';

        console.log('OAuth Profile Data:', {
          email: session.user.email,
          fullName,
          avatarUrl,
          provider,
          rawMetadata: metadata,
        });

        const { data } = await apiClient.post('/auth/supabase', {
          token: session.access_token,
          email: session.user.email,
          fullName,
          avatarUrl,
          provider,
        });

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
