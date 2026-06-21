import { Prisma } from '@prisma/client';

const OAUTH_CALLBACK_PATH_RE = /^\/v1\/auth\/(google|github)\/callback(?:\?|$)/;

export function isOAuthCallbackPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path;
  return OAUTH_CALLBACK_PATH_RE.test(pathname);
}

export function isDatabaseUnreachableError(exception: unknown): boolean {
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    return exception.code === 'P1001';
  }
  const message =
    exception instanceof Error
      ? exception.message
      : typeof exception === 'string'
        ? exception
        : '';
  return (
    message.includes("Can't reach database server") ||
    message.includes('Connection refused') ||
    message.includes('ECONNREFUSED')
  );
}

/** Query param value for /login?error=... after OAuth callback failure */
export function oauthLoginErrorCode(exception: unknown): string {
  if (isDatabaseUnreachableError(exception)) {
    return 'database_unavailable';
  }
  return 'auth_failed';
}

/**
 * Resolves the canonical frontend origin for browser-facing redirects.
 *
 * The production site is served on the `www` host; the apex `profytron.com`
 * only redirects "/" to www and returns 404 for every deep path. Redirecting
 * an OAuth login to `https://profytron.com/auth/callback` therefore lands on a
 * raw "Not Found". This upgrades the bare apex to www so the redirect always
 * hits a host that actually serves the app, regardless of env drift.
 */
export function resolveFrontendUrl(): string {
  const raw = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  try {
    const url = new URL(raw);
    if (url.hostname === 'profytron.com') {
      url.hostname = 'www.profytron.com';
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // Fall through to the raw value if it isn't a parseable URL.
  }
  return raw;
}

export function oauthFailureRedirectUrl(exception: unknown): string {
  const frontendUrl = resolveFrontendUrl();
  const code = oauthLoginErrorCode(exception);
  return `${frontendUrl}/login?error=${code}`;
}
