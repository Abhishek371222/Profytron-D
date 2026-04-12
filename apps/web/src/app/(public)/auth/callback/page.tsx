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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('Supabase session retrieval failed:', error);
        router.push('/login?error=auth_failed');
        return;
      }

      try {
        // Exchange Supabase session for local session
        // We send the Supabase token to our backend to sync/create the user
        const { data } = await apiClient.post('/auth/supabase', {
          token: session.access_token,
          email: session.user.email,
          fullName: session.user.user_metadata.full_name,
          avatarUrl: session.user.user_metadata.avatar_url,
          provider: session.user.app_metadata.provider,
        });

        login(data.accessToken, data.user);
        window.location.href = '/dashboard';
      } catch (e) {
        console.error('Backend synchronization failed:', e);
        router.push('/login?error=sync_failed');
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
