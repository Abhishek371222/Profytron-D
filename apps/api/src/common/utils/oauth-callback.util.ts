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

export function oauthLoginErrorCode(exception: unknown): string {
  if (isDatabaseUnreachableError(exception)) {
    return 'database_unavailable';
  }
  return 'auth_failed';
}

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
  }
  return raw;
}

export function oauthFailureRedirectUrl(exception: unknown): string {
  const frontendUrl = resolveFrontendUrl();
  const code = oauthLoginErrorCode(exception);
  return `${frontendUrl}/login?error=${code}`;
}
