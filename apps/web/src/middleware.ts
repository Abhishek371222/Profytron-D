import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // user_role is a non-httpOnly cookie set by the backend on login.
  // This middleware is a server-side first gate — the real authorization
  // check happens on every API call via JwtAuthGuard + RolesGuard on the backend.
  const userRole = request.cookies.get('user_role')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken || userRole !== 'ADMIN') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
