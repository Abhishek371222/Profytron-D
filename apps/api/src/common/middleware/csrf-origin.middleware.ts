import type { NextFunction, Request, Response } from 'express';

/**
 * Cookie-session CSRF mitigation without csurf:
 * For unsafe methods that send cookies, require Origin / Referer to match
 * the CORS allowlist. Bearer-only (no Cookie) requests are allowed.
 */
export function csrfOriginGuardMiddleware(
  allowedOrigins: string[],
  options?: { enabled?: boolean },
) {
  const enabled =
    options?.enabled ??
    (process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'staging' ||
      process.env.CSRF_ORIGIN_CHECK === 'true');

  const allowlist = new Set(allowedOrigins.filter(Boolean));

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!enabled) {
      next();
      return;
    }

    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      next();
      return;
    }

    // Webhooks / health never use browser cookies from our SPA.
    const path = req.path || req.url || '';
    if (
      path.startsWith('/v1/webhooks') ||
      path.startsWith('/v1/wallet/webhook') ||
      path === '/health' ||
      path === '/live' ||
      path === '/ready' ||
      path === '/metrics'
    ) {
      next();
      return;
    }

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader || !String(cookieHeader).trim()) {
      next();
      return;
    }

    if (allowlist.size === 0) {
      next();
      return;
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    let candidate = typeof origin === 'string' ? origin : '';
    if (!candidate && typeof referer === 'string') {
      try {
        candidate = new URL(referer).origin;
      } catch {
        candidate = '';
      }
    }

    if (!candidate || !allowlist.has(candidate)) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'CSRF origin check failed',
        code: 'CSRF_ORIGIN_MISMATCH',
        timestamp: new Date().toISOString(),
        path,
      });
      return;
    }

    next();
  };
}
