import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

// ─── Request body size limits ────────────────────────────────────────────────
// Keep these conservative. Webhook routes receive raw buffers and are registered
// first so they take priority before the JSON parser runs.
const JSON_BODY_LIMIT = '100kb'; // Tightened from 2 MB — most API payloads are small
const URLENCODED_BODY_LIMIT = '100kb';

export function configureApp(app: INestApplication) {
  const isProduction = process.env.NODE_ENV === 'production';

  // ─── Allowed CORS origins ──────────────────────────────────────────────────
  // Populated from env; empty string disables CORS entirely (blocks all cross-
  // origin requests). Never use a wildcard here on an API that sets cookies.
  const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // ─── connectSrc domains for CSP ───────────────────────────────────────────
  // Includes the API's own origin and optional WebSocket/API domains from env.
  // Format: CONNECT_SRC_EXTRA="wss://ws.profytron.com https://api.profytron.com"
  const extraConnectSrc = (process.env.CONNECT_SRC_EXTRA || '')
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean);

  // ─── Webhook routes: raw body required for signature verification ──────────
  // Must be registered BEFORE express.json() so the body is not pre-parsed.
  // CSRF note: these endpoints are protected by HMAC webhook signatures
  // (Stripe-Signature / Razorpay-Signature headers), which is the correct
  // mechanism for server-to-server callbacks — not session cookies.
  app.use('/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use('/v1/webhooks/razorpay', express.raw({ type: 'application/json' }));
  app.use('/v1/wallet/webhook', express.raw({ type: 'application/json' }));

  // ─── JSON / URL-encoded parsers (size-limited) ────────────────────────────
  app.use(
    express.json({
      limit: JSON_BODY_LIMIT,
      strict: false,
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }));

  // ─── Reject oversized requests early with a clear 413 ─────────────────────
  // express.json() already enforces its own limit, but this middleware acts as
  // a belt-and-suspenders guard at the transport layer before any parsing.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const MAX_BYTES = 200 * 1024; // 200 KB hard ceiling
    if (contentLength > MAX_BYTES) {
      res.status(413).json({ success: false, error: 'Payload too large' });
      return;
    }
    next();
  });

  app.setGlobalPrefix('v1', {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });

  // ─── Security headers via Helmet ──────────────────────────────────────────
  // 'unsafe-inline' for scriptSrc has been removed. If the Next.js frontend
  // serves inline scripts it must inject a nonce at SSR time and pass it here
  // via SCRIPT_SRC_NONCE env (e.g., "'nonce-<base64>'" or a hash like
  // "'sha256-<hash>'"). Until that infrastructure is in place the API itself
  // does not serve any HTML, so a strict default-src 'self' is safe.
  //
  // 'unsafe-inline' for styleSrc is intentionally retained because many UI
  // component libraries inject critical CSS at runtime. Remove it once a nonce
  // or hash-based approach is implemented in the frontend.
  app.use(
    helmet({
      // ── Content-Security-Policy ─────────────────────────────────────────
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // No 'unsafe-inline' — the API does not serve HTML/JS that needs it.
          // If a Swagger UI nonce is needed in future, add it via env.
          scriptSrc: ["'self'"],
          // 'unsafe-inline' retained for stylesheet compatibility; track as
          // tech debt to replace with nonce/hash once frontend is stabilised.
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          // connectSrc scoped to self + WebSocket and API domains from env
          connectSrc: ["'self'", ...extraConnectSrc],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          // Enforce HTTPS upgrade in production browsers
          ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      // ── HTTP Strict Transport Security ─────────────────────────────────
      // 1 year max-age; includeSubDomains protects cookie leakage on subdomains.
      // Do NOT set preload unless you have submitted to the HSTS preload list.
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: false }
        : false,
      // ── Additional protections ─────────────────────────────────────────
      xContentTypeOptions: true, // Prevents MIME-type sniffing (X-Content-Type-Options: nosniff)
      xDnsPrefetchControl: { allow: false }, // Disable DNS prefetch to limit info leakage
      frameguard: { action: 'deny' }, // X-Frame-Options: DENY — clickjacking protection
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
    }),
  );

  app.use(cookieParser());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // allowedOrigins is a strict whitelist. If empty, all cross-origin requests
  // are blocked — this is the safe default for environments without a frontend.
  // Credentials (cookies) are only sent when the origin is explicitly allowed.
  app.enableCors({
    origin(
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      // Allow same-origin / non-browser requests (e.g., server-to-server)
      if (!requestOrigin) return callback(null, true);
      if (allowedOrigins.includes(requestOrigin)) return callback(null, true);
      callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // Do not expose extra response headers beyond what browsers allow by default
    exposedHeaders: [],
  });

  app.useGlobalFilters(
    new AllExceptionsFilter({ httpAdapter: app.getHttpAdapter() } as any),
  );
  app.useGlobalInterceptors(
    new SentryInterceptor(),
    new TransformInterceptor(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties — prevents mass assignment
      transform: true, // Auto-coerce types from request payloads
      forbidNonWhitelisted: true, // Reject requests that contain unknown properties
    }),
  );

  // ─── Swagger (API docs) ───────────────────────────────────────────────────
  // Only exposed in non-production environments. In production all docs are
  // disabled to avoid advertising endpoint signatures to attackers.
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Profytron API')
      .setDescription('Complete Profytron backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }
}
