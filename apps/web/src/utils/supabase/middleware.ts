import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

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

  return hasSupabaseAuthCookie(request);
}

const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_CACHE_MAX_SIZE = 5000;
const recentlyVerified = new Map<string, number>();

function sessionCacheKey(request: NextRequest): string {
  return request.cookies
    .getAll()
    .filter((c) => c.name.startsWith('sb-'))
    .map((c) => `${c.name}=${c.value}`)
    .sort()
    .join('&');
}

export async function updateSession(request: NextRequest, response: NextResponse) {
  if (!shouldRefreshSupabaseSession(request)) {
    return response;
  }

  const cacheKey = sessionCacheKey(request);
  const now = Date.now();
  const expiresAt = recentlyVerified.get(cacheKey);
  if (expiresAt && expiresAt > now) {
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

  if (recentlyVerified.size >= SESSION_CACHE_MAX_SIZE) {
    const oldestKey = recentlyVerified.keys().next().value;
    if (oldestKey) recentlyVerified.delete(oldestKey);
  }
  recentlyVerified.set(cacheKey, now + SESSION_CACHE_TTL_MS);

  return response;
}
