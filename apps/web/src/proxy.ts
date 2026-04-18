import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/strategies',
  '/marketplace',
  '/analytics',
  '/ai-coach',
  '/wallet',
  '/settings',
  '/admin',
];

export function proxy(request: NextRequest) {
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
    return response;
  }

  // Some auth providers can land on "/" with token/code params.
  // Normalize those callbacks to the dedicated callback route.
  if (
    pathname === '/' &&
    (searchParams.has('access_token') ||
      searchParams.has('refresh_token') ||
      searchParams.has('code'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
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
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/admin')) {
      const role = request.cookies.get('user_role')?.value;
      if (role !== 'ADMIN') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};