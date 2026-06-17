import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

/** Paths where Supabase session refresh is required (OAuth flows). */
const SUPABASE_SESSION_PATHS = ['/auth', '/login', '/register', '/signup', '/onboarding'];

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
}

function shouldRefreshSupabaseSession(request: NextRequest): boolean {
  if (!supabaseUrl || !supabaseKey) return false;

  const pathname = request.nextUrl.pathname;
  if (SUPABASE_SESSION_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }

  // JWT cookie auth covers dashboard routes — skip remote getUser() on every navigation.
  return hasSupabaseAuthCookie(request);
}

export async function updateSession(request: NextRequest, response: NextResponse) {
  if (!shouldRefreshSupabaseSession(request)) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
