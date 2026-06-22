/**
 * Sentry initialisation for the NestJS API.
 *
 * MUST be imported before the Nest application is created (it is the first
 * import in main.ts) so the SDK can instrument the runtime. Without this file
 * `Sentry.captureException()` calls in `SentryInterceptor` are no-ops and no
 * backend errors ever reach Sentry — which was the case until now.
 *
 * No-op unless SENTRY_DSN is set, so local/dev deploys pay no cost.
 */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '0.0.1',
    // Keep tracing light by default; raise via env in production if desired.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  });
}
