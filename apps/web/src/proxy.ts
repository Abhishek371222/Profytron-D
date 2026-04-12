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
    if (!refreshToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};