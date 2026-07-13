import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const AFFILIATE_VISITOR_COOKIE = 'affiliate_visitor_id';
const AFFILIATE_VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // ~1 year

const protectedRoutes = [
  '/get-bots',
  '/copy-trading',
  '/dashboard',
  '/strategies',
  '/marketplace',
  '/markets',
  '/analytics',
  '/alpha-coach',
  '/wallet',
  '/affiliate',
  '/creator',
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

  const applyReferral = async (response: NextResponse, code: string) => {
    response.cookies.set('referral_code', code, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    let visitorId = request.cookies.get(AFFILIATE_VISITOR_COOKIE)?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }
    response.cookies.set(AFFILIATE_VISITOR_COOKIE, visitorId, {
      path: '/',
      maxAge: AFFILIATE_VISITOR_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });

    const backend =
      process.env.BACKEND_API_ORIGIN ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:4000';

    const headers: Record<string, string> = {
      'x-affiliate-visitor-id': visitorId,
    };
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers.cookie = cookieHeader;
    }

    // Await so the capture is not abandoned when the proxy response finishes.
    // Fail-open: navigation and referral cookie must still succeed.
    try {
      await fetch(
        `${backend}/v1/affiliates/capture/${encodeURIComponent(code)}`,
        { method: 'POST', headers },
      );
    } catch {
      /* capture failures must not break registration flow */
    }

    return response;
  };

  // Canonical register URL — preserve ?ref= and referral cookie (next.config redirect dropped both).
  if (pathname === '/signup') {
    const url = request.nextUrl.clone();
    url.pathname = '/register';
    const response = NextResponse.redirect(url);
    if (referralCode) {
      return updateSession(request, await applyReferral(response, referralCode));
    }
    return updateSession(request, response);
  }

  if (referralCode) {
    const response = NextResponse.next();
    return updateSession(request, await applyReferral(response, referralCode));
  }

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
      if (!isAdmin) {
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
