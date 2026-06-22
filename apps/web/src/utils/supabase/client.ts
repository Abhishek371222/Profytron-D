'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

// When the Supabase env vars are absent, do NOT call createBrowserClient with
// empty strings — it throws at module-evaluation time, which crashes the entire
// login/register page (blank screen, no email/password form), not just social
// login. Export null instead so callers can degrade gracefully: social login is
// disabled while email/password auth keeps working.
type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

export const supabase: BrowserSupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
  console.warn('Supabase credentials missing. Social login will be disabled.');
}