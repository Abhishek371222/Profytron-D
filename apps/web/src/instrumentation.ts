import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Server/edge process start. Keep Zod in jitless mode so SSR validation
 * matches the client CSP-safe configuration, and initialize Sentry for
 * whichever runtime (nodejs or edge) this instrumentation file runs in.
 */
export async function register() {
  const { z } = await import("zod");
  z.config({ jitless: true });

  if (!SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.05,
      enabled: process.env.NODE_ENV === "production",
    });
  } else {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production",

      beforeSend(event) {
        // Strip PII from server-side error events
        if (event.user) {
          delete event.user.ip_address;
          delete event.user.email;
        }
        return event;
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
