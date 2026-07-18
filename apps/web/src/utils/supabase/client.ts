'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

export const supabase: BrowserSupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
  console.warn('Supabase credentials missing. Social login will be disabled.');
}