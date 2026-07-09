import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const protectedRoutes = [
  '/copy-trading',
  '/dashboard',
  '/strategies',
  '/marketplace',
  '/analytics',
  '/alpha-coach',
  '/wallet',
  '/affiliate',
  '/settings',
  '/admin',
  '/journal',
  '/history',
  '/leaderboard',
  '/bots',
  '/notifications',
  '/builder',
  '/social',
  '/support',
  '/vps',
];

export function proxy(request: NextRequest) {
  return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const referralCode = searchParams.get('ref') || searchParams.get('referral');
  if (referralCode) {
    const response = NextResponse.next();
    response.cookies.set('referral_code', referralCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    const backend =
      process.env.BACKEND_API_ORIGIN ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:4000';
    void fetch(
      `${backend}/v1/affiliates/capture/${encodeURIComponent(referralCode)}`,
      { method: 'POST' },
    ).catch(() => {});
    return updateSession(request, response);
  }

  // Some auth providers can land on "/" with token/code params.
  // Normalize those callbacks to the dedicated callback route.
  if (pathname === '/' && searchParams.has('error')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', searchParams.get('error') || 'auth_failed');
    return updateSession(request, NextResponse.redirect(url));
  }

  if (
    pathname === '/' &&
    (searchParams.has('access_token') ||
      searchParams.has('refresh_token') ||
      searchParams.has('code'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return updateSession(request, NextResponse.redirect(url));
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected) {
    const refreshToken = request.cookies.get('refresh_token');
    const demoAccess = request.cookies.get('demo_access')?.value === '1';
    if (!refreshToken && !demoAccess) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return updateSession(request, NextResponse.redirect(url));
    }

    const onboardingDone =
      request.cookies.get('onboarding_completed')?.value === '1';
    const role = request.cookies.get('user_role')?.value?.toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (
      refreshToken &&
      !onboardingDone &&
      !isAdmin &&
      !pathname.startsWith('/onboarding')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding/risk';
      return updateSession(request, NextResponse.redirect(url));
    }

    if (pathname.startsWith('/admin')) {
      const role = request.cookies.get('user_role')?.value;
      if (role !== 'ADMIN') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return updateSession(request, NextResponse.redirect(url));
      }
    }
  }

  return updateSession(request, NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};